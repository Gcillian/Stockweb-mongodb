// Global state
let currentUser = null;
let stocks = [];
let portfolio = [];
let selectedStock = null;
let isBuyMode = true;
let adminUsers = [];
let adminStocks = [];
let adminTransactions = [];

const formatCurrency = (value) => 'Rp ' + (Number(value) || 0).toLocaleString('id-ID');

// Setup index.html login/logout panel
function setupIndexNavigation() {
  const isPublicPage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
  if (!isPublicPage) return;

  const token = localStorage.getItem('token');
  const name = localStorage.getItem('name');
  const loginBtn = document.querySelector('#loginBtn');
  const logoutBtn = document.querySelector('#logoutBtn');
  const tradingBtn = document.querySelector('#tradingBtn');
  const userPanel = document.querySelector('#userPanel');
  const userNameDisplay = document.querySelector('#userNameDisplay');

  if (token && userPanel) {
    loginBtn?.classList.add('hidden');
    userPanel.classList.remove('hidden');
    if (userNameDisplay) userNameDisplay.innerText = `Hi, ${name || 'User'}`;
    if (tradingBtn) tradingBtn.innerText = 'Dashboard';
    
    if (tradingBtn) {
      tradingBtn.onclick = () => {
        window.location.href = '/userdashboard.html';
      };
    }
    
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        const ok = await NusaConfirm({ title: 'Keluar dari NusaTrade?', message: 'Sesi Anda akan diakhiri.', danger: true, confirmText: 'Keluar' });
        if (!ok) return;
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
        NusaToast('Berhasil keluar', 'success');
        setTimeout(() => window.location.reload(), 800);
      };
    }
  } else {
    if (userPanel) userPanel.classList.add('hidden');
    loginBtn?.classList.remove('hidden');

    const openLogin = async () => {
      const result = await NusaLoginModal();
      if (!result) return;
      if (result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('role', result.role || 'user');
        localStorage.setItem('name', result.name || '');
        NusaToast('Login berhasil! Selamat datang 👋', 'success');
        setTimeout(() => {
          if (result.role === 'admin') window.location.href = '/admindashboard.html';
          else window.location.reload();
        }, 800);
      }
    };
    
    if (loginBtn) loginBtn.onclick = (e) => { e.preventDefault(); openLogin(); };
    if (tradingBtn) tradingBtn.onclick = openLogin;
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  setupIndexNavigation();

  const token = localStorage.getItem('token');
  const isPublicPage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
  const isDashboardPage = window.location.pathname.includes('userdashboard') || window.location.pathname.includes('admindashboard');
  
  if (isDashboardPage && !token) {
    NusaToast('Silakan login terlebih dahulu', 'warning');
    setTimeout(() => { window.location.href = '/index.html'; }, 900);
    return;
  }

  if (token) {
    try {
      const response = await fetch('/api/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (response.ok) {
        currentUser = await response.json();
      }
    } catch (err) {
      console.log('Could not fetch user data');
    }
  }

  if (window.location.pathname.includes('userdashboard')) {
    // Attach navigation FIRST so menu works even if API calls fail
    setupUserDashboardNavigation();
    await loadUserDashboard();
  } else if (window.location.pathname.includes('admindashboard')) {
    setupAdminDashboardNavigation();
    await loadAdminDashboard();
  } else if (isPublicPage) {
    await loadHomePageStocks();
  }
});

// Load home page stocks
async function loadHomePageStocks() {
  try {
    const grids = document.querySelectorAll('.grid');
    const marketGrid = Array.from(grids).find(g => g.className.includes('grid-cols-6') || g.className.includes('md:grid-cols-3'));
    
    if (marketGrid) {
      stocks = await API.stocks();
      if (Array.isArray(stocks) && stocks.length > 0) {
        marketGrid.innerHTML = '';
        stocks.slice(0, 6).forEach(s => {
          const change = s.changePercent ?? 0;
          const changeColor = change >= 0 ? 'text-primary' : 'text-secondary';
          const changeStr = change >= 0 ? `+${change}%` : `${change}%`;
          const card = document.createElement('div');
          card.className = 'glass-card p-md rounded-xl hover:border-primary/40 transition-all cursor-pointer';
          card.innerHTML = `
            <div class="flex justify-between mb-xs">
              <span class="font-bold">${s.stockCode}</span>
              <span class="${changeColor} text-label-sm">${changeStr}</span>
            </div>
            <p class="text-label-sm text-on-surface-variant mb-md truncate">${s.companyName || 'N/A'}</p>
            <p class="font-data-tabular text-headline-md">Rp ${(s.price || 0).toLocaleString('id-ID')}</p>
          `;
          marketGrid.appendChild(card);
        });
      }
    }
  } catch (err) {
    console.log('No stocks to load or API error:', err.message);
  }
}

// Load user dashboard
async function loadUserDashboard() {
  try {
    stocks = await API.stocks();
    portfolio = await API.portfolio();
    
    const token = localStorage.getItem('token');
    const userResponse = await fetch('/api/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (userResponse.ok) {
      const user = await userResponse.json();
      currentUser = user;
      const balanceEl = document.querySelector('#balanceValue');
      const totalBalanceEl = document.querySelector('#totalBalanceValue');
      if (balanceEl) balanceEl.innerText = formatCurrency(user.balance);
      if (totalBalanceEl) totalBalanceEl.innerText = formatCurrency(user.balance);
    }
    
    const totalValue = portfolio.reduce((sum, p) => sum + ((p.price || 0) * (p.quantity || 0)), 0);
    const totalAssetEl = document.querySelector('#totalAssetValue');
    const totalInvestEl = document.querySelector('#totalInvestValue');
    if (totalAssetEl) totalAssetEl.innerText = formatCurrency(totalValue);
    if (totalInvestEl) totalInvestEl.innerText = formatCurrency(totalValue);
    
    renderPortfolioSection();
    const history = await API.history();
    loadTransactionHistory(history);
    setupTradingPanel();
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

// Setup user dashboard navigation
function setupUserDashboardNavigation() {
  const menuLinks = document.querySelectorAll('.menu-link');
  const sections = document.querySelectorAll('.section-content');

  // Initial state: only dashboard visible
  sections.forEach(s => s.classList.add('hidden'));
  const initialSection = document.querySelector('#dashboardSection');
  if (initialSection) initialSection.classList.remove('hidden');

  // Expose global click handler (called via inline onclick in HTML)
  // This is a robust fallback: works even if event delegation fails
  window.__nusatradeMenuClick = (link, menu) => {
    const menuLinksLocal = document.querySelectorAll('.menu-link');
    const sectionsLocal = document.querySelectorAll('.section-content');

    // Hide all sections
    sectionsLocal.forEach(s => s.classList.add('hidden'));

    // Reset menu styles
    menuLinksLocal.forEach(m => {
      m.classList.remove('text-primary', 'border-r-2', 'border-primary', 'bg-primary/5');
      m.classList.add('text-on-surface-variant');
    });

    // Show target section
    const targetSection = document.querySelector(`#${menu}Section`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    } else {
      console.warn('Section not found:', menu + 'Section');
    }

    // Mark menu as active
    if (link) {
      link.classList.add('text-primary', 'border-r-2', 'border-primary', 'bg-primary/5');
      link.classList.remove('text-on-surface-variant');
    }

    // Render section data lazily
    if (menu === 'markets') renderMarketsView();
    else if (menu === 'watchlist') renderWatchlistView();
    else if (menu === 'portfolio') renderPortfolioView();
    else if (menu === 'history') renderHistoryView();
    else if (menu === 'settings') renderSettingsView();
  };

  // Also attach via addEventListener as a secondary path
  menuLinks.forEach(link => {
    if (link.dataset.bound === 'true') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const menu = link.dataset.menu;
      window.__nusatradeMenuClick(link, menu);
    });
    link.dataset.bound = 'true';
  });

  const logoutBtn = document.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const ok = await NusaConfirm({ title: 'Keluar dari NusaTrade?', message: 'Sesi Anda akan diakhiri.', danger: true, confirmText: 'Keluar' });
      if (!ok) return;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      NusaToast('Berhasil keluar', 'success');
      setTimeout(() => { window.location.href = '/index.html'; }, 800);
    });
  }

  const depositBtn = document.querySelector('#depositBtn');
  if (depositBtn) {
    depositBtn.addEventListener('click', async () => {
      const balance = currentUser?.balance || 0;
      const result = await NusaDepositModal(balance);
      if (!result) return;

      try {
        const res = await API.submitDeposit({ amount: result.amount, method: result.method });
        if (res.ok) {
          NusaToast('Permintaan deposit berhasil dikirim! Menunggu persetujuan admin.', 'success', 5000);
        } else {
          NusaToast(res.message || 'Gagal mengirim permintaan deposit', 'error');
        }
      } catch (err) {
        NusaToast('Error: ' + err.message, 'error');
      }
    });
  }
}

// Render markets view
function renderMarketsView() {
  const grid = document.querySelector('#marketsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  stocks.forEach(stock => {
    const change = stock.changePercent ?? 0;
    const changeColor = change >= 0 ? 'text-primary' : 'text-secondary';
    const changeStr = change >= 0 ? `+${change}%` : `${change}%`;
    const card = document.createElement('div');
    card.className = 'glass-card p-5 rounded-xl cursor-pointer hover:border-primary/40 transition-all';
    card.innerHTML = `
      <div class="flex justify-between mb-3">
        <span class="font-bold text-headline-md">${stock.stockCode}</span>
        <span class="${changeColor} text-label-sm font-bold">${changeStr}</span>
      </div>
      <p class="text-label-sm text-on-surface-variant mb-3 truncate">${stock.companyName}</p>
      <p class="font-data-tabular text-body-md mb-4">${formatCurrency(stock.price)}</p>
      <button class="w-full bg-primary text-on-primary py-2 rounded-lg text-label-sm font-bold hover:opacity-90 transition-all" onclick="selectStockForBuy('${stock.stockCode}')">Pilih Saham</button>
    `;
    grid.appendChild(card);
  });
}

// Render watchlist view
function renderWatchlistView() {
  const grid = document.querySelector('#watchlistGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const watchlist = stocks.slice(0, 3);
  if (watchlist.length === 0) {
    grid.innerHTML = '<p class="text-on-surface-variant">Watchlist kosong</p>';
    return;
  }
  watchlist.forEach(stock => {
    const card = document.createElement('div');
    card.className = 'glass-card p-5 rounded-xl';
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <p class="font-bold text-body-md">${stock.stockCode}</p>
          <p class="text-label-sm text-on-surface-variant">${stock.companyName}</p>
        </div>
        <div class="text-right">
          <p class="font-data-tabular text-body-md">${formatCurrency(stock.price)}</p>
          <button class="text-primary text-label-sm font-bold hover:underline mt-2" onclick="selectStockForBuy('${stock.stockCode}')">Beli</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Render portfolio view
function renderPortfolioView() {
  const detail = document.querySelector('#portfolioDetail');
  if (!detail) return;
  if (!portfolio || portfolio.length === 0) {
    detail.innerHTML = '<p class="text-on-surface-variant">Portfolio Anda kosong</p>';
    return;
  }
  let html = '<div class="space-y-4">';
  portfolio.forEach(item => {
    const value = (item.price || 0) * (item.quantity || 0);
    html += `<div class="p-4 bg-surface-container rounded-lg flex justify-between items-center">
      <div>
        <p class="font-bold">${item.stockCode}</p>
        <p class="text-label-sm text-on-surface-variant">${item.quantity} saham @ ${formatCurrency(item.price)}</p>
      </div>
      <p class="font-bold text-primary">${formatCurrency(value)}</p>
    </div>`;
  });
  html += '</div>';
  detail.innerHTML = html;
}

// Render history view
function renderHistoryView() {
  const detail = document.querySelector('#historyDetail');
  if (!detail) return;
  detail.innerHTML = '';
  const historyList = document.querySelector('#historyList');
  if (historyList) {
    detail.innerHTML = historyList.innerHTML;
  }
}

// Render settings view
function renderSettingsView() {
  if (currentUser) {
    const userNameEl    = document.querySelector('#settingUserName');
    const userEmailEl   = document.querySelector('#settingUserEmail');
    const userBalanceEl = document.querySelector('#settingUserBalance');
    if (userNameEl)    userNameEl.innerText    = currentUser.name  || '—';
    if (userEmailEl)   userEmailEl.innerText   = currentUser.email || '—';
    if (userBalanceEl) userBalanceEl.innerText = formatCurrency(currentUser.balance);
  }
  loadMyDeposits();
}

// Load riwayat deposit milik user sendiri
async function loadMyDeposits() {
  const tbody = document.querySelector('#myDepositTable');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-label-sm text-on-surface-variant text-center animate-pulse">Memuat...</td></tr>';

  try {
    const deposits = await API.myDeposits();
    tbody.innerHTML = '';

    if (!deposits || deposits.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-label-sm text-on-surface-variant text-center">Belum ada riwayat deposit</td></tr>';
      return;
    }

    const statusCfg = {
      pending:  { cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', label: 'Menunggu',  icon: 'schedule' },
      approved: { cls: 'bg-primary/20 text-primary border border-primary/30',          label: 'Disetujui', icon: 'check_circle' },
      rejected: { cls: 'bg-error/20 text-error border border-error/30',                label: 'Ditolak',   icon: 'cancel' },
    };
    const methodLabel = { transfer: 'Bank Transfer', ewallet: 'E-Wallet', virtual: 'Virtual Account' };

    deposits.forEach(dep => {
      const s = statusCfg[dep.status] || statusCfg.pending;
      const row = document.createElement('tr');
      row.className = 'hover:bg-white/5 transition-colors';
      row.innerHTML = `
        <td class="px-4 py-3 font-bold font-data-tabular text-primary">
          Rp ${(dep.amount || 0).toLocaleString('id-ID')}
        </td>
        <td class="px-4 py-3 text-label-sm text-on-surface-variant">
          ${methodLabel[dep.method] || dep.method}
        </td>
        <td class="px-4 py-3">
          <span class="flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[10px] font-bold ${s.cls}">
            <span class="material-symbols-outlined text-[12px]">${s.icon}</span>${s.label}
          </span>
        </td>
        <td class="px-4 py-3 text-[10px] text-on-surface-variant">
          ${dep.createdAt ? new Date(dep.createdAt).toLocaleString('id-ID') : '—'}
        </td>
        <td class="px-4 py-3 text-[10px] text-on-surface-variant">
          ${dep.note || (dep.status === 'pending' ? 'Menunggu persetujuan admin' : '—')}
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-label-sm text-error text-center">${err.message}</td></tr>`;
  }
}

// Select stock for buy
window.selectStockForBuy = (stockCode) => {
  const stock = stocks.find(s => s.stockCode === stockCode);
  if (stock) {
    selectedStock = stock;
    const select = document.querySelector('#tradeStockSelect');
    const priceInput = document.querySelector('#tradePriceInput');
    if (select) select.value = stockCode;
    if (priceInput) priceInput.value = stock.price;
    // Show dashboard, hide others
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    document.querySelector('#dashboardSection').classList.remove('hidden');
    document.querySelectorAll('.menu-link').forEach(m => {
      if (m.dataset.menu === 'dashboard') {
        m.classList.add('text-primary', 'border-r-2', 'border-primary', 'bg-primary/5');
        m.classList.remove('text-on-surface-variant');
      } else {
        m.classList.remove('text-primary', 'border-r-2', 'border-primary', 'bg-primary/5');
        m.classList.add('text-on-surface-variant');
      }
    });
    setTimeout(() => {
      document.querySelector('#tradeStockSelect')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
};

// Setup trading panel
function setupTradingPanel() {
  const buyBtn = document.querySelector('#tradeBuyBtn');
  const sellBtn = document.querySelector('#tradeSellBtn');
  const stockSelect = document.querySelector('#tradeStockSelect');
  const lotInput = document.querySelector('#tradeLotInput');
  const priceInput = document.querySelector('#tradePriceInput');
  const confirmBtn = document.querySelector('#tradeConfirmBtn');
  const estimateValueEl = document.querySelector('#estimateValue');
  const estimateFeeEl = document.querySelector('#estimateFee');
  const estimateTotalEl = document.querySelector('#estimateTotal');

  const chartCodeEl = document.querySelector('#chartStockCode');
  const chartNameEl = document.querySelector('#chartStockName');

  const updateSelectedStockInfo = () => {
    if (!selectedStock) return;
    if (chartCodeEl) chartCodeEl.innerText = selectedStock.stockCode;
    if (chartNameEl) chartNameEl.innerText = selectedStock.companyName || '';
  };

  const updateTradeMode = () => {
    if (!buyBtn || !sellBtn) return;
    if (isBuyMode) {
      buyBtn.classList.add('text-primary', 'border-b-2', 'border-primary', 'bg-primary/5');
      buyBtn.classList.remove('text-on-surface-variant');
      sellBtn.classList.remove('text-primary', 'border-b-2', 'border-primary', 'bg-primary/5');
      sellBtn.classList.add('text-on-surface-variant');
      if (confirmBtn) confirmBtn.innerText = 'Konfirmasi Beli';
    } else {
      sellBtn.classList.add('text-primary', 'border-b-2', 'border-primary', 'bg-primary/5');
      sellBtn.classList.remove('text-on-surface-variant');
      buyBtn.classList.remove('text-primary', 'border-b-2', 'border-primary', 'bg-primary/5');
      buyBtn.classList.add('text-on-surface-variant');
      if (confirmBtn) confirmBtn.innerText = 'Konfirmasi Jual';
    }
  };

  if (buyBtn && sellBtn && buyBtn.dataset.bound !== 'true') {
    buyBtn.addEventListener('click', () => {
      isBuyMode = true;
      updateTradeMode();
    });

    sellBtn.addEventListener('click', () => {
      isBuyMode = false;
      updateTradeMode();
    });
    buyBtn.dataset.bound = 'true';
    sellBtn.dataset.bound = 'true';
  }

  const updateEstimate = () => {
    const lot = parseInt(lotInput?.value) || 0;
    const price = parseInt(priceInput?.value) || 0;
    const totalValue = lot * 100 * price;
    const fee = totalValue * 0.0015;
    if (estimateValueEl) estimateValueEl.innerText = formatCurrency(totalValue);
    if (estimateFeeEl) estimateFeeEl.innerText = formatCurrency(Math.floor(fee));
    if (estimateTotalEl) estimateTotalEl.innerText = formatCurrency(Math.floor(totalValue + fee));
  };

  if (stockSelect) {
    stockSelect.innerHTML = '';
    stocks.forEach(stock => {
      const option = document.createElement('option');
      option.value = stock.stockCode;
      option.innerText = `${stock.stockCode} — ${stock.companyName}`;
      stockSelect.appendChild(option);
    });
    selectedStock = stocks[0] || null;
    if (selectedStock && priceInput) priceInput.value = selectedStock.price || 0;
    updateSelectedStockInfo();
    if (stockSelect.dataset.bound !== 'true') {
      stockSelect.addEventListener('change', () => {
        selectedStock = stocks.find(stock => stock.stockCode === stockSelect.value) || selectedStock;
        if (selectedStock && priceInput) priceInput.value = selectedStock.price || 0;
        updateSelectedStockInfo();
        updateEstimate();
      });
      stockSelect.dataset.bound = 'true';
    }
  }

  if (lotInput && lotInput.dataset.bound !== 'true') {
    lotInput.addEventListener('input', updateEstimate);
    lotInput.dataset.bound = 'true';
  }
  if (priceInput && priceInput.dataset.bound !== 'true') {
    priceInput.addEventListener('input', updateEstimate);
    priceInput.dataset.bound = 'true';
  }
  updateTradeMode();
  updateEstimate();

  if (confirmBtn && confirmBtn.dataset.bound !== 'true') {
    confirmBtn.addEventListener('click', async () => {
      const lot = parseInt(lotInput?.value) || 0;
      if (lot <= 0) {
        NusaToast('Masukkan jumlah lot yang valid', 'error');
        return;
      }
      const stockCode = stockSelect?.value || selectedStock?.stockCode || 'BBCA';
      const price = parseInt(priceInput?.value) || 0;
      const fee   = Math.floor(lot * 100 * price * 0.0015);
      const total = Math.floor(lot * 100 * price + fee);

      const confirmed = await NusaTradeConfirmModal({
        type: isBuyMode ? 'buy' : 'sell',
        stockCode, lots: lot, price, fee, total
      });
      if (!confirmed) return;

      try {
        const result = isBuyMode ? await API.buy({ stockCode, lots: lot }) : await API.sell({ stockCode, lots: lot });
        if (result.ok) {
          NusaToast(isBuyMode ? '✅ Pembelian berhasil!' : '✅ Penjualan berhasil!', 'success');
          if (lotInput) lotInput.value = '';
          await loadUserDashboard();
        } else {
          NusaToast(result.message || (isBuyMode ? 'Pembelian gagal' : 'Penjualan gagal'), 'error');
        }
      } catch (err) {
        NusaToast('Error: ' + err.message, 'error');
      }
    });
    confirmBtn.dataset.bound = 'true';
  }
}

// Load transaction history
function loadTransactionHistory(history) {
  try {
    const space = document.querySelector('#historyList');
    if (!space) return;
    
    space.innerHTML = '';
    
    if (!history || history.length === 0) {
      space.innerHTML = '<p class="text-on-surface-variant text-label-sm">No transactions yet</p>';
      return;
    }
    
    history.slice(0, 5).forEach(tx => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors';
      const type = tx.type === 'buy' ? 'Beli' : 'Jual';
      const statusColor = tx.type === 'buy' ? 'bg-primary/20 text-primary' : 'bg-secondary-container/20 text-secondary';
      
      div.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg ${tx.type === 'buy' ? 'bg-primary/10' : 'bg-secondary-container/10'} flex items-center justify-center font-bold text-[10px]">${tx.stockCode}</div>
          <div>
            <p class="text-[12px] font-bold">${type} ${tx.quantity / 100} Lot</p>
            <p class="text-[10px] text-on-surface-variant">${new Date(tx.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-[12px] font-data-tabular">Rp ${tx.total.toLocaleString('id-ID')}</p>
          <span class="text-[9px] px-2 py-0.5 rounded-full ${statusColor} uppercase font-bold">Selesai</span>
        </div>
      `;
      space.appendChild(div);
    });
  } catch (err) {
    console.error('Error loading transaction history:', err);
  }
}

// Load admin dashboard
async function loadAdminDashboard() {
  // Validasi dulu: pastikan token ada dan role adalah admin
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  if (!token) {
    NusaToast('Tidak ada token. Silakan login ulang.', 'error');
    setTimeout(() => { window.location.href = '/index.html'; }, 1000);
    return;
  }

  if (role !== 'admin') {
    NusaToast('Akun Anda bukan admin.', 'error');
    setTimeout(() => { window.location.href = '/userdashboard.html'; }, 1000);
    return;
  }

  try {
    // Muat data secara individual agar jika salah satu gagal tidak memblokir yang lain
    const [usersRes, stocksRes, txRes, statsRes] = await Promise.allSettled([
      API.users(),
      API.stocks(),
      API.transactions(),
      API.stats()
    ]);

    // Ambil nilai atau fallback ke array kosong
    adminUsers        = usersRes.status  === 'fulfilled' && Array.isArray(usersRes.value)  ? usersRes.value  : [];
    adminStocks       = stocksRes.status === 'fulfilled' && Array.isArray(stocksRes.value) ? stocksRes.value : [];
    adminTransactions = txRes.status     === 'fulfilled' && Array.isArray(txRes.value)     ? txRes.value     : [];
    const stats       = statsRes.status  === 'fulfilled' ? statsRes.value : null;

    // Log hasil untuk debugging
    console.log('[Admin] users:', adminUsers.length, '| stocks:', adminStocks.length, '| tx:', adminTransactions.length);

    // Cek jika users kosong padahal response sukses — berarti 403/401
    if (usersRes.status === 'fulfilled' && !Array.isArray(usersRes.value)) {
      const msg = usersRes.value?.message || 'Unknown error';
      console.warn('[Admin] /users returned non-array:', msg);
      if (msg.toLowerCase().includes('admin') || msg.toLowerCase().includes('token')) {
        NusaToast('Sesi admin tidak valid. Silakan login ulang.', 'error');
        setTimeout(() => { window.location.href = '/index.html'; }, 1500);
        return;
      }
    }

    // Populate semua bagian dashboard
    populateAdminStats(stats, adminUsers, adminStocks, adminTransactions);
    loadUsersTable(adminUsers);
    loadStocksTable(adminStocks);
    loadTransactionsTable(adminTransactions);
    populateGainersLosers(stats);
    updateDepositStats(); // muat stats deposit (pending count, dll)

    // Tampilkan peringatan jika ada yang gagal
    if (usersRes.status  === 'rejected') NusaToast('Gagal memuat data users: ' + usersRes.reason?.message, 'error');
    if (stocksRes.status === 'rejected') NusaToast('Gagal memuat data saham: ' + stocksRes.reason?.message, 'error');
    if (txRes.status     === 'rejected') NusaToast('Gagal memuat transaksi: '  + txRes.reason?.message,    'error');

  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    NusaToast('Error: ' + err.message, 'error');
  }
}

function populateAdminStats(stats, users, stocks, transactions) {
  const fmt = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'jt';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return n?.toLocaleString('id-ID') || '0';
  };

  // Gunakan stats dari server jika tersedia, fallback ke array lokal
  const totalUsers  = stats?.totalUsers  ?? users.length;
  const totalTx     = stats?.totalTransactions ?? transactions.length;
  const totalVol    = stats?.totalVolume  ?? 0;
  const revenue     = stats?.platformRevenue ?? 0;
  const totalStocks = stats?.totalStocks  ?? stocks.length;

  // Hitung active traders = users yang punya transaksi hari ini
  const todayStr = new Date().toDateString();
  const activeToday = new Set(
    transactions
      .filter(t => new Date(t.createdAt).toDateString() === todayStr)
      .map(t => String(t.userId))
  ).size;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('adminStatTotalUsers',   fmt(totalUsers));
  setEl('adminStatActiveTraders', fmt(activeToday));
  setEl('adminStatTotalTx',      fmt(totalTx));
  setEl('adminStatDailyVolume',  'Rp ' + fmt(totalVol));
  setEl('adminStatRevenue',      'Rp ' + fmt(revenue));
  setEl('adminStatTotalStocks',  fmt(totalStocks));

  // Update progress bar widths secara proporsional
  const setBar = (id, pct) => {
    const el = document.getElementById(id);
    if (el) el.style.width = Math.min(100, Math.max(2, pct)) + '%';
  };
  setBar('adminBarUsers',   Math.min(99, (totalUsers / 200) * 100));
  setBar('adminBarTraders', Math.min(99, (activeToday / Math.max(totalUsers, 1)) * 100));
  setBar('adminBarTx',      Math.min(99, (totalTx / 1000) * 100));
  setBar('adminBarVolume',  Math.min(99, (totalVol / 1e10) * 100));
  setBar('adminBarRevenue', Math.min(99, (revenue / 1e8)  * 100));

  // Finance summary cards
  const buyVol = transactions.filter(t => t.type === 'buy').reduce((s, t) => s + (t.total || 0), 0);
  const sellVol = transactions.filter(t => t.type === 'sell').reduce((s, t) => s + (t.total || 0), 0);
  setEl('adminSumBuyVol',   'Rp ' + fmt(buyVol));
  setEl('adminSumSellVol',  'Rp ' + fmt(sellVol));
  setEl('adminSumStocks',   String(totalStocks));

  // Recent trading table (5 latest)
  const recentTbody = document.getElementById('adminRecentTradingTable');
  if (recentTbody) {
    const recent = transactions.slice(0, 8);
    if (recent.length === 0) {
      recentTbody.innerHTML = '<tr><td colspan="6" class="px-md py-6 text-label-sm text-on-surface-variant text-center">Belum ada transaksi</td></tr>';
    } else {
      recentTbody.innerHTML = recent.map(tx => {
        const isBuy = tx.type === 'buy';
        return `<tr class="hover:bg-white/5 transition-colors">
          <td class="px-md py-sm text-[11px] text-on-surface-variant">${String(tx.userId).slice(-8)}</td>
          <td class="px-md py-sm font-bold">${tx.stockCode}</td>
          <td class="px-md py-sm">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isBuy ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}">${tx.type.toUpperCase()}</span>
          </td>
          <td class="px-md py-sm">${(tx.quantity||0).toLocaleString('id-ID')}</td>
          <td class="px-md py-sm">Rp ${(tx.total||0).toLocaleString('id-ID')}</td>
          <td class="px-md py-sm text-[10px] text-on-surface-variant">${tx.createdAt ? new Date(tx.createdAt).toLocaleString('id-ID') : '—'}</td>
        </tr>`;
      }).join('');
    }
  }

  // Recent users list (5 newest)
  const recentUsersEl = document.getElementById('adminRecentUsersList');
  if (recentUsersEl) {
    const recentUsers = [...users].slice(-5).reverse();
    if (recentUsers.length === 0) {
      recentUsersEl.innerHTML = '<p class="text-label-sm text-on-surface-variant">Belum ada pengguna</p>';
    } else {
      recentUsersEl.innerHTML = recentUsers.map(u => `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-sm">
            <div class="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center">
              <span class="font-bold text-primary text-[12px]">${(u.name||'U')[0].toUpperCase()}</span>
            </div>
            <div>
              <p class="font-bold text-sm">${u.name}</p>
              <p class="text-[10px] text-on-surface-variant">${u.email}</p>
            </div>
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-surface-variant text-on-surface-variant'}">${u.role}</span>
        </div>`).join('');
    }
  }
}

function populateGainersLosers(stats) {
  // Gainers
  const gainersEl = document.getElementById('adminGainersList');
  if (gainersEl) {
    const gainers = stats?.gainers || [];
    if (gainers.length === 0) {
      gainersEl.innerHTML = '<p class="text-label-sm text-on-surface-variant">Belum ada data pergerakan harga</p>';
    } else {
      gainersEl.innerHTML = gainers.map(s => `
        <div class="flex items-center justify-between">
          <div>
            <p class="font-bold font-data-tabular">${s.stockCode}</p>
            <p class="text-[10px] text-on-surface-variant">${s.companyName || ''}</p>
          </div>
          <div class="text-right">
            <p class="text-primary font-bold">+${s.change}%</p>
            <p class="text-[10px] text-on-surface-variant font-data-tabular">Rp ${(s.price||0).toLocaleString('id-ID')}</p>
          </div>
        </div>`).join('');
    }
  }
  // Losers
  const losersEl = document.getElementById('adminLosersList');
  if (losersEl) {
    const losers = stats?.losers || [];
    if (losers.length === 0) {
      losersEl.innerHTML = '<p class="text-label-sm text-on-surface-variant">Belum ada data pergerakan harga</p>';
    } else {
      losersEl.innerHTML = losers.map(s => `
        <div class="flex items-center justify-between">
          <div>
            <p class="font-bold font-data-tabular">${s.stockCode}</p>
            <p class="text-[10px] text-on-surface-variant">${s.companyName || ''}</p>
          </div>
          <div class="text-right">
            <p class="text-error font-bold">${s.change}%</p>
            <p class="text-[10px] text-on-surface-variant font-data-tabular">Rp ${(s.price||0).toLocaleString('id-ID')}</p>
          </div>
        </div>`).join('');
    }
  }
}

function renderPortfolioSection() {
  const tbody = document.querySelector('#portfolioTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!portfolio || portfolio.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-label-sm text-on-surface-variant">Belum ada portofolio.</td></tr>';
    return;
  }
  portfolio.forEach(item => {
    const row = document.createElement('tr');
    const value = (item.price || 0) * (item.quantity || 0);
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm font-bold">${item.stockCode}</td>
      <td class="px-4 py-3 text-label-sm">${item.quantity.toLocaleString('id-ID')} saham</td>
      <td class="px-4 py-3 text-label-sm">${formatCurrency(item.price)}</td>
      <td class="px-4 py-3 text-label-sm">${formatCurrency(value)}</td>
    `;
    tbody.appendChild(row);
  });
}

function createStockForm() {
  // replaced by NusaCreateStockModal – kept as stub
  return null;
}

window.createStock = async () => {
  const data = await NusaCreateStockModal();
  if (!data) return;
  try {
    const result = await API.createStock(data);
    if (result._id || result.ok) {
      NusaToast('Saham berhasil ditambahkan', 'success');
      await loadAdminDashboard();
    } else {
      NusaToast(result.message || 'Gagal menambahkan saham', 'error');
    }
  } catch (err) {
    NusaToast('Error: ' + err.message, 'error');
  }
}

// Load users table — isi tabel di dashboard section
function loadUsersTable(users) {
  const tbodies = [
    document.querySelector('#adminDashUsersTable'),
    document.querySelector('[data-table="users"]')
  ].filter(Boolean);

  tbodies.forEach(tbody => {
    tbody.innerHTML = '';
    const list = users.slice(0, 8);
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-label-sm text-on-surface-variant text-center">Tidak ada pengguna</td></tr>';
      return;
    }
    list.forEach(user => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-white/5 transition-colors';
      row.innerHTML = `
        <td class="px-4 py-3 text-label-sm">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px]">${(user.name||'U')[0].toUpperCase()}</div>
            ${user.name}
          </div>
        </td>
        <td class="px-4 py-3 text-label-sm text-on-surface-variant">${user.email}</td>
        <td class="px-4 py-3 text-label-sm font-bold font-data-tabular">Rp ${(user.balance||0).toLocaleString('id-ID')}</td>
        <td class="px-4 py-3 text-label-sm">
          <span class="px-2 py-1 rounded-full text-[10px] font-bold ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-surface-variant text-on-surface-variant'}">${user.role}</span>
        </td>
        <td class="px-4 py-3 text-label-sm">
          <button class="text-primary hover:underline text-[12px] mr-2" onclick="editUser('${user._id}')">Edit</button>
          <button class="text-error hover:underline text-[12px]" onclick="deleteUser('${user._id}')">Hapus</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });
}

// Load stocks table — isi tabel di dashboard section
function loadStocksTable(stocks) {
  const tbodies = [
    document.querySelector('#adminDashStocksTable'),
    document.querySelector('[data-table="stocks"]')
  ].filter(Boolean);

  tbodies.forEach(tbody => {
    tbody.innerHTML = '';
    const list = stocks.slice(0, 8);
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-label-sm text-on-surface-variant text-center">Tidak ada saham</td></tr>';
      return;
    }
    list.forEach(stock => {
      const change = stock.changePercent ?? 0;
      const changeColor = change > 0 ? 'text-primary' : change < 0 ? 'text-error' : 'text-on-surface-variant';
      const changeStr = change > 0 ? `+${change}%` : `${change}%`;
      const row = document.createElement('tr');
      row.className = 'hover:bg-white/5 transition-colors';
      row.innerHTML = `
        <td class="px-4 py-3 text-label-sm font-bold font-data-tabular text-primary">${stock.stockCode}</td>
        <td class="px-4 py-3 text-label-sm truncate max-w-[140px]">${stock.companyName || '—'}</td>
        <td class="px-4 py-3 text-label-sm font-data-tabular font-bold">Rp ${(stock.price||0).toLocaleString('id-ID')}</td>
        <td class="px-4 py-3 text-label-sm font-bold font-data-tabular ${changeColor}">${changeStr}</td>
        <td class="px-4 py-3 text-label-sm">
          <button class="text-primary hover:underline text-[12px] mr-2" onclick="editStock('${stock._id}')">Edit</button>
          <button class="text-error hover:underline text-[12px]" onclick="deleteStock('${stock._id}')">Hapus</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });
}

// Load transactions table — data sudah di adminTransactions
function loadTransactionsTable(transactions) {
  // Dashboard section menampilkan via adminRecentTradingTable (diisi oleh populateAdminStats)
  // Full table di adminTradingSection dirender oleh renderAdminTradingTable
}

// Setup admin dashboard navigation
function setupAdminDashboardNavigation() {
  const adminMenuLinks = document.querySelectorAll('.admin-menu-link');
  const adminSections = document.querySelectorAll('.admin-section');

  // Helper: hide a section (remove inline style + add hidden class)
  const hideSection = (s) => {
    s.classList.add('hidden');
    s.style.display = '';
  };
  // Helper: show a section (remove hidden class + inline style)
  const showSection = (s) => {
    s.classList.remove('hidden');
    s.style.display = '';
  };

  // Initial state: only dashboard section visible
  adminSections.forEach(hideSection);
  const initialSection = document.querySelector('#adminDashboardSection');
  if (initialSection) showSection(initialSection);

  // Expose global click handler (called via inline onclick in HTML)
  window.__nusatradeAdminMenuClick = (link, menu) => {
    const adminMenuLinksLocal = document.querySelectorAll('.admin-menu-link');
    const adminSectionsLocal = document.querySelectorAll('.admin-section');

    // Hide all admin sections
    adminSectionsLocal.forEach(hideSection);

    // Remove active state from all menu links
    adminMenuLinksLocal.forEach(m => {
      m.classList.remove('text-primary', 'border-r-2', 'border-primary', 'bg-primary/5');
      m.classList.add('text-on-surface-variant');
    });

    // Show selected section
    const targetSectionId = 'admin' + menu.charAt(0).toUpperCase() + menu.slice(1) + 'Section';
    const targetSection = document.getElementById(targetSectionId);
    if (targetSection) {
      showSection(targetSection);
    } else {
      console.warn('Admin section not found:', targetSectionId);
    }

    // Mark menu as active
    if (link) {
      link.classList.add('text-primary', 'border-r-2', 'border-primary', 'bg-primary/5');
      link.classList.remove('text-on-surface-variant');
    }

    // Call specific render function (lazy load)
    if (menu === 'users') renderAdminUsersTable();
    else if (menu === 'trading') renderAdminTradingTable();
    else if (menu === 'stocks') renderAdminStocksTable();
    else if (menu === 'deposits') renderAdminDepositsTable();
    else if (menu === 'monitoring') renderAdminMonitoringTable();
  };

  // Also attach via addEventListener as a secondary path
  adminMenuLinks.forEach(link => {
    if (link.dataset.bound === 'true') return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const menu = link.dataset.adminMenu;
      window.__nusatradeAdminMenuClick(link, menu);
    });
    link.dataset.bound = 'true';
  });

  // Setup admin logout
  const adminLogoutBtn = document.querySelector('#adminLogoutBtn');
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      const ok = await NusaConfirm({ title: 'Keluar dari Admin Panel?', message: 'Sesi admin Anda akan diakhiri.', danger: true, confirmText: 'Keluar' });
      if (!ok) return;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      NusaToast('Berhasil keluar dari admin panel', 'success');
      setTimeout(() => { window.location.href = '/index.html'; }, 800);
    });
  }
}

// Render admin users table
function renderAdminUsersTable(filter = '') {
  const tbody = document.querySelector('#adminUsersTable');
  const countEl = document.querySelector('#adminUsersCount');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtered = filter
    ? adminUsers.filter(u => u.name?.toLowerCase().includes(filter) || u.email?.toLowerCase().includes(filter))
    : adminUsers;

  if (countEl) countEl.textContent = `${filtered.length} pengguna`;

  filtered.forEach(user => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-white/5 transition-colors';
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
            ${(user.name || 'U')[0].toUpperCase()}
          </div>
          ${user.name}
        </div>
      </td>
      <td class="px-4 py-3 text-label-sm text-on-surface-variant">${user.email}</td>
      <td class="px-4 py-3 text-label-sm font-bold font-data-tabular">Rp ${(user.balance || 0).toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm">
        <span class="px-2 py-1 rounded-full text-[10px] font-bold ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-surface-variant text-on-surface-variant'}">${user.role}</span>
      </td>
      <td class="px-4 py-3 text-label-sm">
        <button class="text-primary hover:underline text-[12px] mr-3" onclick="editUser('${user._id}')">Edit</button>
        <button class="text-error hover:underline text-[12px]" onclick="deleteUser('${user._id}')">Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-label-sm text-on-surface-variant text-center">Tidak ada data pengguna</td></tr>';
  }

  // Bind search input once
  const searchEl = document.querySelector('#usersSearchInput');
  if (searchEl && !searchEl.dataset.bound) {
    searchEl.addEventListener('input', () => renderAdminUsersTable(searchEl.value.trim().toLowerCase()));
    searchEl.dataset.bound = 'true';
  }
}

// Render admin trading table  
function renderAdminTradingTable() {
  const tbody = document.querySelector('#adminTradingTable');
  const countEl = document.querySelector('#adminTradingCount');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (countEl) countEl.textContent = `${adminTransactions.length} transaksi`;

  adminTransactions.forEach(tx => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-white/5 transition-colors';
    const isBuy = tx.type === 'buy';
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm text-on-surface-variant">${tx.userId || '—'}</td>
      <td class="px-4 py-3 text-label-sm font-bold font-data-tabular">${tx.stockCode}</td>
      <td class="px-4 py-3 text-label-sm">
        <span class="px-2 py-1 rounded-full text-[10px] font-bold ${isBuy ? 'bg-primary/20 text-primary' : 'bg-error/20 text-error'}">${(tx.type || 'buy').toUpperCase()}</span>
      </td>
      <td class="px-4 py-3 text-label-sm font-data-tabular">${(tx.quantity || 0).toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm font-data-tabular font-bold">Rp ${(tx.total || 0).toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm text-on-surface-variant text-[10px]">${tx.createdAt ? new Date(tx.createdAt).toLocaleString('id-ID') : '—'}</td>
    `;
    tbody.appendChild(row);
  });

  if (adminTransactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-6 text-label-sm text-on-surface-variant text-center">Tidak ada data transaksi</td></tr>';
  }
}

// Render admin stocks table
function renderAdminStocksTable() {
  const tbody = document.querySelector('#adminStocksTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  adminStocks.forEach(stock => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-white/5 transition-colors';
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm font-bold font-data-tabular text-primary">${stock.stockCode}</td>
      <td class="px-4 py-3 text-label-sm">${stock.companyName}</td>
      <td class="px-4 py-3 text-label-sm font-data-tabular font-bold">Rp ${(stock.price || 0).toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm font-data-tabular text-on-surface-variant">${(stock.volume || 0).toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm">
        <button class="text-primary hover:underline text-[12px] mr-3" onclick="editStock('${stock._id}')">Edit</button>
        <button class="text-error hover:underline text-[12px]" onclick="deleteStock('${stock._id}')">Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (adminStocks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-label-sm text-on-surface-variant text-center">Tidak ada data saham</td></tr>';
  }
}

// Helper function to create table container
function createTableContainer(title) {
  const div = document.createElement('div');
  div.className = 'glass-card rounded-xl p-5 mb-6';
  div.innerHTML = `
    <h4 class="font-bold mb-4">${title}</h4>
    <div class="overflow-auto custom-scrollbar">
      <table class="w-full text-label-sm">
        <tbody></tbody>
      </table>
    </div>
  `;
  const main = document.querySelector('main');
  if (main) main.appendChild(div);
  return div.querySelector('tbody');
}

// Global functions for admin actions
window.editUser = async (userId) => {
  const user = adminUsers.find(u => u._id === userId);
  if (!user) return;
  const data = await NusaEditUserModal(user);
  if (!data) return;
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      NusaToast('Data pengguna berhasil diperbarui', 'success');
      await loadAdminDashboard();
      renderAdminUsersTable();
    } else {
      NusaToast('Gagal memperbarui pengguna', 'error');
    }
  } catch (err) {
    NusaToast('Error: ' + err.message, 'error');
  }
};

window.deleteUser = async (userId) => {
  const user = adminUsers.find(u => u._id === userId);
  const ok = await NusaConfirm({
    title: 'Hapus Pengguna?',
    message: `Akun <strong>${user?.name || 'ini'}</strong> akan dihapus permanen.`,
    danger: true, confirmText: 'Hapus', cancelText: 'Batal'
  });
  if (!ok) return;
  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (response.ok) {
      NusaToast('Pengguna berhasil dihapus', 'success');
      await loadAdminDashboard();
      renderAdminUsersTable();
    } else {
      NusaToast('Gagal menghapus pengguna', 'error');
    }
  } catch (err) {
    NusaToast('Error: ' + err.message, 'error');
  }
};

window.editStock = async (stockId) => {
  const stock = adminStocks.find(s => s._id === stockId);
  if (!stock) return;
  const data = await NusaEditStockModal(stock);
  if (!data) return;
  try {
    const response = await fetch(`/api/stocks/${stockId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      NusaToast('Data saham berhasil diperbarui', 'success');
      await loadAdminDashboard();
      renderAdminStocksTable();
    } else {
      NusaToast('Gagal memperbarui saham', 'error');
    }
  } catch (err) {
    NusaToast('Error: ' + err.message, 'error');
  }
};

window.deleteStock = async (stockId) => {
  const stock = adminStocks.find(s => s._id === stockId);
  const ok = await NusaConfirm({
    title: 'Hapus Saham?',
    message: `Saham <strong>${stock?.stockCode || 'ini'}</strong> akan dihapus dari listing.`,
    danger: true, confirmText: 'Hapus', cancelText: 'Batal'
  });
  if (!ok) return;
  try {
    const response = await fetch(`/api/stocks/${stockId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
    });
    if (response.ok) {
      NusaToast('Saham berhasil dihapus', 'success');
      await loadAdminDashboard();
      renderAdminStocksTable();
    } else {
      NusaToast('Gagal menghapus saham', 'error');
    }
  } catch (err) {
    NusaToast('Error: ' + err.message, 'error');
  }
};

// Render admin deposits table — data dari Deposit collection
let adminDeposits = []; // cache global

async function renderAdminDepositsTable(filterStatus = '') {
  const tbody = document.querySelector('#adminDepositsTable');
  if (!tbody) return;

  // Update filter tab styling
  document.querySelectorAll('.dep-filter-btn').forEach(btn => {
    const isActive = btn.dataset.filter === filterStatus;
    btn.className = btn.className
      .replace('bg-primary text-on-primary', '')
      .replace('bg-surface-container border border-white/10 text-on-surface-variant', '')
      .trim();
    if (isActive) {
      btn.classList.add('bg-primary', 'text-on-primary');
    } else {
      btn.classList.add('bg-surface-container', 'border', 'border-white/10', 'text-on-surface-variant');
    }
  });

  tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-label-sm text-on-surface-variant text-center animate-pulse">Memuat data deposit...</td></tr>';

  try {
    adminDeposits = await API.adminDeposits(filterStatus);

    tbody.innerHTML = '';
    if (!adminDeposits.length) {
      const msg = filterStatus
        ? `Tidak ada deposit dengan status <strong>${filterStatus}</strong>`
        : 'Belum ada permintaan deposit';
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-10 text-label-sm text-on-surface-variant text-center">${msg}</td></tr>`;
      await updateDepositStats();
      return;
    }

    adminDeposits.forEach(dep => {
      const statusCfg = {
        pending:  { cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', label: 'Pending',  icon: 'schedule' },
        approved: { cls: 'bg-primary/20 text-primary border border-primary/30',          label: 'Approved', icon: 'check_circle' },
        rejected: { cls: 'bg-error/20 text-error border border-error/30',                label: 'Rejected', icon: 'cancel' },
      };
      const s = statusCfg[dep.status] || statusCfg.pending;
      const methodLabel = { transfer: 'Bank Transfer', ewallet: 'E-Wallet', virtual: 'Virtual Account' };

      const row = document.createElement('tr');
      row.className = 'hover:bg-white/5 transition-colors';
      row.innerHTML = `
        <td class="px-4 py-3">
          <div class="flex flex-col">
            <span class="text-label-sm font-bold">${dep.userName || '—'}</span>
            <span class="text-[10px] text-on-surface-variant">${dep.userEmail || '—'}</span>
          </div>
        </td>
        <td class="px-4 py-3">
          <span class="font-bold font-data-tabular text-primary">Rp ${(dep.amount || 0).toLocaleString('id-ID')}</span>
        </td>
        <td class="px-4 py-3 text-label-sm text-on-surface-variant">
          ${methodLabel[dep.method] || dep.method}
        </td>
        <td class="px-4 py-3">
          <span class="flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[10px] font-bold ${s.cls}">
            <span class="material-symbols-outlined text-[12px]">${s.icon}</span>${s.label}
          </span>
        </td>
        <td class="px-4 py-3 text-[10px] text-on-surface-variant">
          ${dep.createdAt ? new Date(dep.createdAt).toLocaleString('id-ID') : '—'}
        </td>
        <td class="px-4 py-3 text-[10px]">
          ${dep.processedAt
            ? `<span class="text-on-surface-variant">${new Date(dep.processedAt).toLocaleString('id-ID')}</span>
               ${dep.approvedBy ? `<br><span class="text-primary text-[9px]">oleh ${dep.approvedBy}</span>` : ''}`
            : '<span class="text-on-surface-variant/40">—</span>'}
        </td>
        <td class="px-4 py-3">
          ${dep.status === 'pending'
            ? `<div class="flex gap-2">
                <button onclick="doApproveDeposit('${dep._id}')"
                  class="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg text-[11px] font-bold hover:bg-primary/20 active:scale-95 transition-all">
                  <span class="material-symbols-outlined text-[13px]">check_circle</span> Approve
                </button>
                <button onclick="doRejectDeposit('${dep._id}')"
                  class="flex items-center gap-1 px-3 py-1.5 bg-error/10 border border-error/30 text-error rounded-lg text-[11px] font-bold hover:bg-error/20 active:scale-95 transition-all">
                  <span class="material-symbols-outlined text-[13px]">cancel</span> Reject
                </button>
               </div>`
            : `<span class="text-[10px] text-on-surface-variant/60 italic">${dep.note || '—'}</span>`}
        </td>
      `;
      tbody.appendChild(row);
    });

    await updateDepositStats();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-6 text-label-sm text-error text-center">
      <span class="material-symbols-outlined align-middle mr-1">error</span>${err.message}
    </td></tr>`;
  }
}

window.doApproveDeposit = async (depositId) => {
  const dep = adminDeposits.find(d => d._id === depositId);
  const ok = await NusaConfirm({
    title: 'Setujui Deposit?',
    message: `Deposit sebesar <strong>Rp ${(dep?.amount || 0).toLocaleString('id-ID')}</strong> dari <strong>${dep?.userName || '—'}</strong> akan disetujui dan saldo user akan bertambah.`,
    confirmText: 'Approve',
    cancelText: 'Batal'
  });
  if (!ok) return;

  try {
    const res = await API.approveDeposit(depositId);
    if (res.ok) {
      NusaToast(`✅ Deposit Rp ${(dep?.amount || 0).toLocaleString('id-ID')} disetujui. Saldo baru: Rp ${(res.newBalance || 0).toLocaleString('id-ID')}`, 'success', 5000);
      await renderAdminDepositsTable();
      // Refresh stats juga
      const stats = await API.stats().catch(() => null);
      if (stats) populateAdminStats(stats, adminUsers, adminStocks, adminTransactions);
      await updateDepositStats();
    } else {
      NusaToast(res.message || 'Gagal approve deposit', 'error');
    }
  } catch (err) {
    NusaToast('Error: ' + err.message, 'error');
  }
};

window.doRejectDeposit = async (depositId) => {
  const dep = adminDeposits.find(d => d._id === depositId);
  const ok = await NusaConfirm({
    title: 'Tolak Deposit?',
    message: `Deposit sebesar <strong>Rp ${(dep?.amount || 0).toLocaleString('id-ID')}</strong> dari <strong>${dep?.userName || '—'}</strong> akan ditolak.`,
    danger: true,
    confirmText: 'Tolak',
    cancelText: 'Batal'
  });
  if (!ok) return;

  try {
    const res = await API.rejectDeposit(depositId, 'Ditolak oleh admin');
    if (res.ok) {
      NusaToast('Deposit telah ditolak', 'warning', 3000);
      await renderAdminDepositsTable();
      await updateDepositStats();
    } else {
      NusaToast(res.message || 'Gagal menolak deposit', 'error');
    }
  } catch (err) {
    NusaToast('Error: ' + err.message, 'error');
  }
};

async function updateDepositStats() {
  try {
    const ds = await API.depositStats();
    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const fmt = (n) => 'Rp ' + (n || 0).toLocaleString('id-ID');

    setEl('adminDepositPendingCount',  ds.pendingCount  || 0);
    setEl('adminDepositPendingTotal',  fmt(ds.pendingTotal));
    setEl('adminDepositApprovedTotal', fmt(ds.approvedTotal));

    // Badge di sidebar nav
    const badge = document.querySelector('#adminDepositPendingBadge');
    if (badge) {
      badge.textContent = ds.pendingCount || 0;
      badge.classList.toggle('hidden', !ds.pendingCount);
    }

    // Shortcut di Finance Summary card
    const summaryEl = document.getElementById('adminSumDepositPending');
    if (summaryEl) {
      summaryEl.textContent = ds.pendingCount
        ? `${ds.pendingCount} • ${fmt(ds.pendingTotal)}`
        : 'Tidak ada';
    }
  } catch (_) { /* silent — tidak semua halaman punya elemen ini */ }
}

// Render admin market monitoring — data dari stocks nyata
function renderAdminMonitoringTable() {
  const tbody = document.querySelector('#adminMonitoringTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Tampilkan indeks dari saham-saham di database sebagai rangkuman
  const indices = [
    { name: 'IHSG', label: 'Indeks Harga Saham Gabungan', source: 'composite' },
    { name: 'IDX30', label: 'IDX 30 Blue Chip', source: 'bluechip' },
  ];

  indices.forEach(idx => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-white/5 transition-colors';
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm font-bold font-data-tabular">${idx.name}</td>
      <td class="px-4 py-3 text-label-sm text-on-surface-variant">${idx.label}</td>
      <td class="px-4 py-3 text-label-sm">—</td>
      <td class="px-4 py-3 text-label-sm">
        <span class="flex items-center gap-1 w-fit px-2 py-1 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
          <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Active
        </span>
      </td>
      <td class="px-4 py-3 text-label-sm">
        <button class="text-on-surface-variant hover:text-error text-[12px]" onclick="pauseMarket('${idx.name}')">Pause</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  if (indices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-label-sm text-on-surface-variant text-center">Tidak ada data indeks</td></tr>';
  }

  renderStocksMonitoring();
}

function renderStocksMonitoring() {
  const tbody = document.querySelector('#adminStocksMonitoringTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!adminStocks || adminStocks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-6 text-label-sm text-on-surface-variant text-center">Tidak ada data saham</td></tr>';
    return;
  }

  adminStocks.forEach(stock => {
    const change = stock.changePercent ?? 0;
    const changeColor = change > 0 ? 'text-primary' : change < 0 ? 'text-error' : 'text-on-surface-variant';
    const changeStr = change > 0 ? `+${change}%` : `${change}%`;
    const row = document.createElement('tr');
    row.className = 'hover:bg-white/5 transition-colors';
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm font-bold font-data-tabular text-primary">${stock.stockCode}</td>
      <td class="px-4 py-3 text-label-sm">${stock.companyName || '—'}</td>
      <td class="px-4 py-3 text-label-sm font-data-tabular font-bold">Rp ${(stock.price||0).toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm font-bold font-data-tabular ${changeColor}">${changeStr}</td>
      <td class="px-4 py-3 text-label-sm font-data-tabular text-on-surface-variant">${(stock.volume||0).toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm">
        <button class="text-primary hover:underline text-[12px]" onclick="editStockPrice('${stock.stockCode}')">Edit Harga</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Global functions for deposits and monitoring
window.pauseMarket = async (marketName) => {
  const ok = await NusaConfirm({ title: `Pause Market ${marketName}?`, message: 'Semua trading pada indeks ini akan dihentikan sementara.', danger: true, confirmText: 'Pause' });
  if (ok) NusaToast(`Market ${marketName} telah di-pause`, 'warning');
};

window.editStockPrice = async (stockCode) => {
  const stock = adminStocks.find(s => s.stockCode === stockCode);
  const newPrice = await NusaEditPriceModal(stockCode, stock?.price || 0);
  if (!newPrice || newPrice <= 0) return;
  try {
    const response = await fetch(`/api/stocks/${stock._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify({ price: newPrice })
    });
    if (response.ok) {
      NusaToast(`Harga ${stockCode} diperbarui menjadi Rp ${newPrice.toLocaleString('id-ID')}`, 'success');
      await loadAdminDashboard();
      renderAdminStocksTable();
    } else {
      NusaToast('Gagal memperbarui harga', 'error');
    }
  } catch (err) {
    NusaToast('Error: ' + err.message, 'error');
  }
};
