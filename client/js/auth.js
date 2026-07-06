/**
 * auth.js — legacy fallback auth handler (modal-based)
 * Most login/logout logic is handled in dashboard.js.
 * This file catches any remaining Masuk / Keluar buttons that are
 * not covered by the main dashboard setup.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Guard: only run on pages that have neither been set up by dashboard.js
  const isPublicPage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
  if (!isPublicPage) return; // dashboard.js handles the rest

  // Check if user is logged in and redirect if needed
  const token = localStorage.getItem('token');
  const currentPage = window.location.pathname;
  if (!token && (currentPage.includes('userdashboard') || currentPage.includes('admindashboard'))) {
    NusaToast && NusaToast('Silakan login terlebih dahulu', 'warning');
    setTimeout(() => { window.location.href = '/index.html'; }, 900);
  }
});
