// Simple API helper
const API = (function() {
  const base = '/api';
  const getToken = () => localStorage.getItem('token');

  const request = (path, opts = {}) => {
    const headers = opts.headers || {};
    headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(base + path, { ...opts, headers });
  };

  return {
    register: (data) => request('/register', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
    login: (data) => request('/login', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
    me: () => request('/me').then(r => r.json()),
    stocks: () => request('/stocks').then(r => r.json()),
    buy: (data) => request('/buy', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
    sell: (data) => request('/sell', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
    portfolio: () => request('/portfolio').then(r => r.json()),
    history: () => request('/history').then(r => r.json()),
    users: () => request('/users').then(r => r.json()),
    transactions: () => request('/transactions').then(r => r.json()),
    stats: () => request('/stats').then(r => r.json()),
    updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(r => r.json()),
    deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }).then(r => r.json()),
    createStock: (data) => request('/stocks', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
    updateStock: (id, data) => request(`/stocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(r => r.json()),
    deleteStock: (id) => request(`/stocks/${id}`, { method: 'DELETE' }).then(r => r.json())
  };
})();
