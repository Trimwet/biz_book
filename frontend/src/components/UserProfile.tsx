import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import {
  User, Mail, Building, Shield,
  Eye, EyeOff, Camera, Save, ShoppingBag, Store,
  AlertCircle, CheckCircle
} from 'lucide-react';
import config from '../config';

// 👤 USER PROFILE MANAGEMENT - Clean, minimal profile editing for both shoppers and vendors
const UserProfile = () => {
  const { user, getProfile } = useUser();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Avatar upload states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Password visibility states
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    color: 'gray'
  });

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{action: () => void, title: string, message: string} | null>(null);

  // Toggle password visibility
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'Avatar file size must be less than 5MB' });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    let feedback = '';
    let color = 'gray';

    if (password.length === 0) {
      return { score: 0, feedback: '', color: 'gray' };
    }

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Set feedback and color based on score
    if (score <= 2) {
      feedback = 'Weak - Add more characters and variety';
      color = 'red';
    } else if (score <= 4) {
      feedback = 'Medium - Consider adding special characters';
      color = 'yellow';
    } else {
      feedback = 'Strong - Great password!';
      color = 'blue';
    }

    return { score: Math.min(score, 5), feedback, color };
  };

  // Show confirmation modal
  const showConfirmation = (action: () => void, title: string, message: string) => {
    setConfirmAction({ action, title, message });
    setShowConfirmModal(true);
  };

  // Handle confirmed action
  const handleConfirmedAction = () => {
    if (confirmAction?.action) {
      confirmAction.action();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  // 📝 Form states for different sections
  const [personalInfo, setPersonalInfo] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || ''
  });

  const [vendorInfo, setVendorInfo] = useState({
    business_name: '',
    business_description: '',
    location: '',
    phone: '',
    website: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 🔄 Load user data on component mount
  useEffect(() => {
    if (user) {
      setPersonalInfo({
        email: user.email || '',
        phone: user.phone || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });

      if (user.vendor_profile) {
        setVendorInfo({
          business_name: user.vendor_profile.business_name || '',
          business_description: user.vendor_profile.business_description || '',
          location: user.vendor_profile.location || '',
          phone: user.vendor_profile.phone || '',
          website: user.vendor_profile.website || ''
        });
      }

      // Set avatar preview if user has one
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  // Monitor password strength
  useEffect(() => {
    if (passwordData.newPassword) {
      const strength = calculatePasswordStrength(passwordData.newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: '', color: 'gray' });
    }
  }, [passwordData.newPassword]);

  // 💾 Update personal information
  const handlePersonalInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(personalInfo)
      });

      const data = await response.json();

      if (response.ok) {
        // Update user context with new data
        await getProfile();
        setMessage({ type: 'success', text: 'Personal information updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // 🏪 Update vendor information
  const handleVendorInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/api/auth/vendor-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vendorInfo)
      });

      const data = await response.json();

      if (response.ok) {
        // Update user context with new vendor data
        await getProfile();
        setMessage({ type: 'success', text: 'Business information updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update business profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Change password
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
      return;
    }

    if (passwordStrength.score < 3) {
      setMessage({ type: 'error', text: 'Please choose a stronger password' });
      return;
    }

    showConfirmation(
      performPasswordChange,
      'Change Password',
      'Are you sure you want to change your password? You will need to use the new password for future logins.'
    );
  };

  // Perform actual password change
  const performPasswordChange = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStrength({ score: 0, feedback: '', color: 'gray' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white border border-gray-100 rounded-2xl mb-6 overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar Section */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-50 border border-blue-100">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Profile Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                      <span className="text-xl font-semibold text-blue-600">
                        {(() => {
                          if (user.user_type === 'vendor' && user.vendor_profile?.business_name) {
                            return user.vendor_profile.business_name[0].toUpperCase();
                          } else if (user.user_type === 'shopper' && user.shopper_profile?.full_name) {
                            return user.shopper_profile.full_name[0].toUpperCase();
                          } else if (user.first_name) {
                            return user.first_name[0].toUpperCase();
                          } else if (user.email) {
                            return user.email[0].toUpperCase();
                          } else {
                            return 'U';
                          }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <label className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-xl p-1.5 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                  <Camera className="w-4 h-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {(() => {
                    if (user.user_type === 'vendor' && user.vendor_profile?.business_name) {
                      return user.vendor_profile.business_name;
                    } else if (user.user_type === 'shopper' && user.shopper_profile?.full_name) {
                      return user.shopper_profile.full_name;
                    } else if (user.first_name && user.last_name) {
                      return `${user.first_name} ${user.last_name}`;
                    } else {
                      return user.email || 'User';
                    }
                  })()}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg">
                    {user.user_type === 'vendor' ? (
                      <>
                        <Store className="w-4 h-4 mr-1.5" />
                        Vendor Space
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 mr-1.5" />
                        Shopper
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-600 text-xs rounded-lg font-medium">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 border rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-100 rounded-2xl mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('personal')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'personal'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Personal Info</span>
                </div>
              </button>
              
              {user.user_type === 'vendor' && (
                <button
                  onClick={() => setActiveTab('business')}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                    activeTab === 'business'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Vendor Space</span>
                  </div>
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-all ${
                  activeTab === 'security'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <form onSubmit={handlePersonalInfoUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={personalInfo.first_name}
                      onChange={(e) => setPersonalInfo({...personalInfo, first_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your first name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={personalInfo.last_name}
                      onChange={(e) => setPersonalInfo({...personalInfo, last_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Business Information Tab */}
            {activeTab === 'business' && user.user_type === 'vendor' && (
              <form onSubmit={handleVendorInfoUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={vendorInfo.business_name}
                    onChange={(e) => setVendorInfo({...vendorInfo, business_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                  </label>
                  <textarea
                    value={vendorInfo.business_description}
                    onChange={(e) => setVendorInfo({...vendorInfo, business_description: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Describe your business, products, and services..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={vendorInfo.location}
                      onChange={(e) => setVendorInfo({...vendorInfo, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Business location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      value={vendorInfo.phone}
                      onChange={(e) => setVendorInfo({...vendorInfo, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Business phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={vendorInfo.website}
                    onChange={(e) => setVendorInfo({...vendorInfo, website: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {passwordData.newPassword && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className={passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                        ✓ At least 8 characters
                      </div>
                      <div className={/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ One uppercase letter
                      </div>
                      <div className={/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ One lowercase letter
                      </div>
                      <div className={/[0-9]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-400'}>
                        ✓ One number
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Change Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {confirmAction?.title}
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                {confirmAction?.message}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedAction}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;