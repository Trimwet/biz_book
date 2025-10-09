import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../hooks/useUser';
import config from '../config';

// 🚨 SMART PRICE ALERTS - AI-powered price monitoring
const SmartPriceAlerts = () => {
  const { user } = useUser();
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({
    productName: '',
    targetPrice: '',
    alertType: 'below', // below, above, change
    frequency: 'instant' // instant, daily, weekly
  });
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 🎯 Smart Alert Types
  const alertTypes = [
    { value: 'below', label: '📉 Price drops below', icon: '⬇️' },
    { value: 'above', label: '📈 Price goes above', icon: '⬆️' },
    { value: 'change', label: '🔄 Any price change', icon: '🔔' },
    { value: 'deal', label: '🔥 Hot deals (AI detected)', icon: '🤖' }
  ];

  const frequencies = [
    { value: 'instant', label: '⚡ Instant notifications' },
    { value: 'daily', label: '📅 Daily summary' },
    { value: 'weekly', label: '📊 Weekly report' }
  ];

  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/alerts/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }, [user]);

  // 📱 Load user's alerts
  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user, loadAlerts]);

  // ➕ Create new alert
  const createAlert = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newAlert,
          userId: user.id
        })
      });

      if (response.ok) {
        setNewAlert({ productName: '', targetPrice: '', alertType: 'below', frequency: 'instant' });
        setShowCreateForm(false);
        loadAlerts();
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete alert
  const deleteAlert = async (alertId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        loadAlerts();
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  // 🎨 Get alert status color
  const getAlertStatusColor = (status) => {
    switch (status) {
      case 'triggered': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h2>
          <p className="text-gray-600">Please log in to set up smart price alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Smart Price Alerts
              </h1>
              <p className="text-xl text-gray-600">Never miss a great deal again! AI-powered price monitoring</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-purple-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">
                  {alerts.filter(a => a.status === 'active').length} active alerts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold text-blue-600">{alerts.filter(a => a.status === 'active').length}</div>
          <div className="text-gray-600">Active Alerts</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600">{alerts.filter(a => a.status === 'triggered').length}</div>
          <div className="text-gray-600">Triggered Today</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-2xl font-bold text-purple-600">₦12,450</div>
          <div className="text-gray-600">Money Saved</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="text-3xl mb-2">🤖</div>
          <div className="text-2xl font-bold text-orange-600">3</div>
          <div className="text-gray-600">AI Deals Found</div>
        </div>
      </div>

      {/* Create Alert Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          ��� Create New Alert
        </button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">🎯 Create Smart Alert</h3>
          <form onSubmit={createAlert} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📦 Product Name</label>
                <input
                  type="text"
                  value={newAlert.productName}
                  onChange={(e) => setNewAlert({...newAlert, productName: e.target.value})}
                  placeholder="e.g., iPhone 15 Pro, Samsung TV"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">💰 Target Price (₦)</label>
                <input
                  type="number"
                  value={newAlert.targetPrice}
                  onChange={(e) => setNewAlert({...newAlert, targetPrice: e.target.value})}
                  placeholder="e.g., 500000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Alert Type</label>
                <select
                  value={newAlert.alertType}
                  onChange={(e) => setNewAlert({...newAlert, alertType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  {alertTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📅 Notification Frequency</label>
                <select
                  value={newAlert.frequency}
                  onChange={(e) => setNewAlert({...newAlert, frequency: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:from-green-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? '⏳ Creating...' : '✅ Create Alert'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all duration-300"
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Alerts */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-800">📋 Your Active Alerts</h3>
        
        {alerts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-2xl font-bold text-gray-600 mb-2">No alerts yet</h3>
            <p className="text-gray-500">Create your first price alert to get started!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-800">{alert.productName}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getAlertStatusColor(alert.status)}`}>
                        {alert.status}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">🎯 Target:</span> ₦{parseFloat(alert.targetPrice).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">📊 Type:</span> {alertTypes.find(t => t.value === alert.alertType)?.label}
                      </div>
                      <div>
                        <span className="font-medium">📅 Frequency:</span> {frequencies.find(f => f.value === alert.frequency)?.label}
                      </div>
                      <div>
                        <span className="font-medium">📅 Created:</span> {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {alert.lastTriggered && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg">
                        <span className="text-green-700 font-medium">
                          🎉 Last triggered: {new Date(alert.lastTriggered).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights */}
      <div className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">🤖 AI Price Insights</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-3">📈</div>
            <h4 className="font-bold text-gray-800 mb-2">Trending Up</h4>
            <p className="text-gray-600 text-sm">iPhone prices are increasing by 5% this week. Consider buying soon!</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-3">📉</div>
            <h4 className="font-bold text-gray-800 mb-2">Great Deals</h4>
            <p className="text-gray-600 text-sm">Samsung TVs are 20% cheaper than usual. Perfect time to buy!</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="font-bold text-gray-800 mb-2">Smart Tip</h4>
            <p className="text-gray-600 text-sm">Set alerts 10% below current prices for better success rates.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
export default SmartPriceAlerts;