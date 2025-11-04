// Check if user is authenticated
function checkAuth() {
  // Check both sessionStorage and localStorage for auth status
  const isAuthenticated = 
    sessionStorage.getItem('isAuthenticated') === 'true' || 
    localStorage.getItem('isAuthenticated') === 'true';

  // If not on login page and not authenticated, redirect to login
  if (!window.location.pathname.includes('login.html') && !isAuthenticated) {
    // Only redirect if not already on the login page
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = 'login.html';
    }
    return false;
  }
  
  // If on login page but already authenticated, redirect to admin
  if (window.location.pathname.includes('login.html') && isAuthenticated) {
    window.location.href = 'admin.html';
    return false;
  }
  
  return isAuthenticated;
}

// Logout function
function logout() {
  // Clear all auth data
  sessionStorage.removeItem('isAuthenticated');
  localStorage.removeItem('isAuthenticated');
  
  // Redirect to login page
  window.location.href = 'login.html';
}

// Add logout button to admin pages
document.addEventListener('DOMContentLoaded', function() {
  // Only run on admin pages
  if (window.location.pathname.includes('admin.html')) {
    // Check authentication
    if (!checkAuth()) return;
    
    // Add logout button to header if it doesn't exist
    const header = document.querySelector('header');
    if (header && !document.getElementById('logoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'logoutBtn';
      logoutBtn.className = 'ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors';
      logoutBtn.innerHTML = 'Logout';
      logoutBtn.onclick = logout;
      
      // Add to header
      header.appendChild(logoutBtn);
    }
  }
});
