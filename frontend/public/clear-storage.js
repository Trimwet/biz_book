// Clear old localStorage data to prevent conflicts
console.log('🧹 Clearing old authentication data...');

// Old system keys
localStorage.removeItem('token');
localStorage.removeItem('user');

// New system keys  
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// Other potential keys
localStorage.removeItem('refreshToken');
localStorage.removeItem('product_draft_new');

console.log('✅ Storage cleared! Please refresh the page and log in again.');
alert('Authentication data cleared. Please refresh and log in again.');