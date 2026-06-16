document.addEventListener('DOMContentLoaded', () => {
  // Find and attach login handler
  const buttons = Array.from(document.querySelectorAll('button, a'));
  const loginBtn = buttons.find(b => /masuk|login/i.test(b.innerText));
  
  if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = prompt('Email:');
      const password = prompt('Password:');
      if (!email || !password) return;
      
      try {
        const result = await API.login({ email, password });
        if (result.token) {
          localStorage.setItem('token', result.token);
          localStorage.setItem('role', result.role || 'user');
          localStorage.setItem('name', result.name || '');
          alert('Login sukses!');
          if (result.role === 'admin') {
            window.location.href = '/admindashboard.html';
          } else {
            window.location.href = '/userdashboard.html';
          }
        } else {
          alert(result.message || 'Login failed');
        }
      } catch (err) {
        alert('Login error: ' + err.message);
      }
    });
  }

  // Find and attach logout handler
  const logoutBtn = buttons.find(b => /keluar|logout|sign out/i.test(b.innerText));
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      alert('Logged out');
      window.location.href = '/index.html';
    });
  }

  // Check if user is logged in and redirect if needed
  const token = localStorage.getItem('token');
  const currentPage = window.location.pathname;
  
  if (!token && (currentPage.includes('userdashboard') || currentPage.includes('admindashboard'))) {
    alert('Please login first');
    window.location.href = '/index.html';
  }
});
