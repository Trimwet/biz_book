const { pool } = require('../utils');
const { logSecurityEvent } = require('./auth');

/**
 * Advanced Security Monitoring System
 */

// Security event types
const SECURITY_EVENTS = {
  AUTHENTICATION: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    LOGOUT_ALL: 'LOGOUT_ALL',
    TOKEN_REFRESHED: 'TOKEN_REFRESHED',
    TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PASSWORD_CHANGE_FAILED: 'PASSWORD_CHANGE_FAILED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED'
  },
  AUTHORIZATION: {
    ACCESS_DENIED: 'ACCESS_DENIED',
    PERMISSION_VIOLATION: 'PERMISSION_VIOLATION',
    ROLE_CHANGE: 'ROLE_CHANGE'
  },
  DATA: {
    DATA_BREACH: 'DATA_BREACH',
    DATA_ACCESS: 'DATA_ACCESS',
    DATA_MODIFICATION: 'DATA_MODIFICATION',
    DATA_EXPORT: 'DATA_EXPORT'
  },
  SYSTEM: {
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    MALWARE_DETECTED: 'MALWARE_DETECTED',
    VULNERABILITY_SCAN: 'VULNERABILITY_SCAN',
    SECURITY_PATCH: 'SECURITY_PATCH'
  },
  NETWORK: {
    BRUTE_FORCE: 'BRUTE_FORCE',
    DDOS_ATTEMPT: 'DDOS_ATTEMPT',
    SQL_INJECTION: 'SQL_INJECTION',
    XSS_ATTEMPT: 'XSS_ATTEMPT'
  }
};

// Security risk levels
const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Security monitor class
class SecurityMonitor {
  constructor() {
    this.failedLoginAttempts = new Map();
    this.suspiciousActivities = new Map();
    this.blockedIPs = new Set();
    this.userActivityTracking = new Map();
  }

  // Track failed login attempts
  trackFailedLogin(email, ip, userAgent) {
    const key = `${email}|${ip}`;
    const attempts = this.failedLoginAttempts.get(key) || 0;
    this.failedLoginAttempts.set(key, attempts + 1);

    // Log failed attempt
    logSecurityEvent('LOGIN_FAILED', {
      email,
      ip,
      userAgent,
      attemptCount: attempts + 1,
      timestamp: new Date().toISOString()
    });

    // Check if account should be locked
    if (attempts + 1 >= 5) {
      this.lockAccount(email, ip);
      return true; // Account locked
    }

    return false; // Not locked
  }

  // Track successful login
  trackSuccessfulLogin(email, ip, userAgent) {
    const key = `${email}|${ip}`;
    this.failedLoginAttempts.delete(key); // Reset failed attempts

    logSecurityEvent('LOGIN_SUCCESS', {
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }

  // Lock account due to suspicious activity
  async lockAccount(email, ip) {
    try {
      // Update user account status
      await pool.query(
        'UPDATE users SET is_active = false, locked_at = NOW(), locked_reason = $1 WHERE email = $2',
        ['Too many failed login attempts', email.toLowerCase()]
      );

      // Add to blocked IPs
      this.blockedIPs.add(ip);

      // Log security event
      await logSecurityEvent('ACCOUNT_LOCKED', {
        email,
        ip,
        reason: 'Too many failed login attempts',
        timestamp: new Date().toISOString()
      });

      // Set automatic unlock timer (30 minutes)
      setTimeout(() => {
        this.unlockAccount(email);
      }, 30 * 60 * 1000);

      console.log(`🔒 Account locked for ${email} from IP ${ip}`);
    } catch (error) {
      console.error('Error locking account:', error);
    }
  }

  // Unlock account
  async unlockAccount(email) {
    try {
      await pool.query(
        'UPDATE users SET is_active = true, locked_at = NULL, locked_reason = NULL WHERE email = $1',
        [email.toLowerCase()]
      );

      await logSecurityEvent('ACCOUNT_UNLOCKED', {
        email,
        timestamp: new Date().toISOString()
      });

      console.log(`🔓 Account unlocked for ${email}`);
    } catch (error) {
      console.error('Error unlocking account:', error);
    }
  }

  // Detect suspicious activity
  detectSuspiciousActivity(userId, action, details) {
    const key = `user_${userId}`;
    const activities = this.suspiciousActivities.get(key) || [];
    
    const activity = {
      action,
      details,
      timestamp: new Date().toISOString(),
      riskLevel: this.calculateRiskLevel(action, details)
    };

    activities.push(activity);
    this.suspiciousActivities.set(key, activities);

    // Log security event
    logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      userId,
      action,
      details,
      riskLevel: activity.riskLevel,
      timestamp: activity.timestamp
    });

    // Check if activity pattern indicates high risk
    const recentActivities = activities.filter(
      a => Date.now() - new Date(a.timestamp).getTime() < 60 * 60 * 1000 // Last hour
    );

    if (recentActivities.length >= 10) {
      this.handleHighRiskActivity(userId, recentActivities);
    }

    return activity;
  }

  // Calculate risk level for activity
  calculateRiskLevel(action, details) {
    const highRiskActions = [
      'PASSWORD_CHANGE_FAILED',
      'MULTIPLE_FAILED_LOGINS',
      'UNUSUAL_DEVICE_ACCESS',
      'DATA_EXPORT'
    ];

    const mediumRiskActions = [
      'LOGIN_FROM_NEW_LOCATION',
      'DEVICE_CHANGE',
      'PROFILE_MODIFICATION'
    ];

    if (highRiskActions.includes(action)) {
      return RISK_LEVELS.HIGH;
    }

    if (mediumRiskActions.includes(action)) {
      return RISK_LEVELS.MEDIUM;
    }

    return RISK_LEVELS.LOW;
  }

  // Handle high risk activity
  async handleHighRiskActivity(userId, activities) {
    try {
      // Send security alert (in real implementation, this would trigger email/SMS)
      console.log(`🚨 High risk activity detected for user ${userId}:`, activities);

      // Log security event
      await logSecurityEvent('SUSPICIOUS_ACTIVITY', {
        userId,
        action: 'HIGH_RISK_PATTERN_DETECTED',
        details: {
          activityCount: activities.length,
          activities: activities.slice(-5) // Last 5 activities
        },
        riskLevel: RISK_LEVELS.CRITICAL,
        timestamp: new Date().toISOString()
      });

      // Optionally lock account
      await pool.query(
        'UPDATE users SET is_active = false, locked_at = NOW(), locked_reason = $1 WHERE id = $2',
        ['High risk activity pattern detected', userId]
      );

    } catch (error) {
      console.error('Error handling high risk activity:', error);
    }
  }

  // Track user activity
  trackUserActivity(userId, action, details) {
    const key = `user_${userId}`;
    const activities = this.userActivityTracking.get(key) || [];
    
    const activity = {
      action,
      details,
      timestamp: new Date().toISOString()
    };

    activities.push(activity);
    
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.shift();
    }

    this.userActivityTracking.set(key, activities);
  }

  // Get user activity report
  async getUserActivityReport(userId, timeRange = '24h') {
    try {
      const hours = parseInt(timeRange);
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const result = await pool.query(`
        SELECT action, details, created_at
        FROM security_logs
        WHERE user_id = $1 AND created_at >= $2
        ORDER BY created_at DESC
      `, [userId, cutoffTime]);

      return result.rows;
    } catch (error) {
      console.error('Error getting user activity report:', error);
      return [];
    }
  }

  // Security audit trail
  async generateSecurityAuditReport(startDate, endDate) {
    try {
      const result = await pool.query(`
        SELECT 
          sl.*,
          u.email as user_email,
          u.user_type
        FROM security_logs sl
        LEFT JOIN users u ON sl.user_id = u.id
        WHERE sl.created_at BETWEEN $1 AND $2
        ORDER BY sl.created_at DESC
      `, [startDate, endDate]);

      return result.rows;
    } catch (error) {
      console.error('Error generating security audit report:', error);
      return [];
    }
  }

  // Clean up old data
  async cleanupOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      // Clean up security logs
      const logsResult = await pool.query(
        'DELETE FROM security_logs WHERE created_at < $1 RETURNING id',
        [cutoffDate]
      );

      // Clean up refresh tokens
      const tokensResult = await pool.query(
        'DELETE FROM refresh_tokens WHERE expires_at < $1 OR invalidated_at IS NOT NULL AND invalidated_at < $1 RETURNING id',
        [cutoffDate]
      );

      console.log(`🧹 Security cleanup completed:`);
      console.log(`   - Deleted ${logsResult.rowCount} security logs`);
      console.log(`   - Deleted ${tokensResult.rowCount} refresh tokens`);

      return {
        logsDeleted: logsResult.rowCount,
        tokensDeleted: tokensResult.rowCount
      };
    } catch (error) {
      console.error('Error cleaning up security data:', error);
      return { logsDeleted: 0, tokensDeleted: 0 };
    }
  }

  // Get security metrics
  async getSecurityMetrics() {
    try {
      const [
        totalLogins,
        failedLogins,
        activeUsers,
        lockedAccounts,
        securityEvents
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM security_logs WHERE action = $1', ['LOGIN_SUCCESS']),
        pool.query('SELECT COUNT(*) as count FROM security_logs WHERE action = $1', ['LOGIN_FAILED']),
        pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
        pool.query('SELECT COUNT(*) as count FROM users WHERE is_active = false'),
        pool.query('SELECT COUNT(*) as count FROM security_logs WHERE created_at >= $1', [new Date(Date.now() - 24 * 60 * 60 * 1000)])
      ]);

      return {
        totalLogins: parseInt(totalLogins.rows[0].count),
        failedLogins: parseInt(failedLogins.rows[0].count),
        activeUsers: parseInt(activeUsers.rows[0].count),
        lockedAccounts: parseInt(lockedAccounts.rows[0].count),
        securityEvents24h: parseInt(securityEvents.rows[0].count),
        blockedIPs: this.blockedIPs.size,
        suspiciousActivities: this.suspiciousActivities.size
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {};
    }
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

// Periodic cleanup (run every 24 hours)
setInterval(() => {
  securityMonitor.cleanupOldData();
}, 24 * 60 * 60 * 1000);

// Export security monitor and utilities
module.exports = {
  securityMonitor,
  SECURITY_EVENTS,
  RISK_LEVELS,
  logSecurityEvent
};