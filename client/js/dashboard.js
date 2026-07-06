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
          const card = document.createElement('div');
          card.className = 'glass-card p-md rounded-xl hover:border-primary/40 transition-all cursor-pointer';
          const change = (Math.random() * 4 - 2).toFixed(2);
          const changeColor = change > 0 ? 'text-primary' : 'text-secondary';
          card.innerHTML = `
            <div class="flex justify-between mb-xs">
              <span class="font-bold">${s.stockCode}</span>
              <span class="${changeColor} text-label-sm">${change > 0 ? '+' : ''}${change}%</span>
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
      if (result) {
        NusaToast('Permintaan deposit sedang diproses. Tim kami akan menghubungi Anda.', 'info', 4000);
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
    const change = (Math.random() * 4 - 2).toFixed(2);
    const changeColor = change > 0 ? 'text-primary' : 'text-secondary';
    const card = document.createElement('div');
    card.className = 'glass-card p-5 rounded-xl cursor-pointer hover:border-primary/40 transition-all';
    card.innerHTML = `
      <div class="flex justify-between mb-3">
        <span class="font-bold text-headline-md">${stock.stockCode}</span>
        <span class="${changeColor} text-label-sm font-bold">${change > 0 ? '+' : ''}${change}%</span>
      </div>
      <p class="text-label-sm text-on-surface-variant mb-3">${stock.companyName}</p>
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
    const userNameEl = document.querySelector('#settingUserName');
    const userEmailEl = document.querySelector('#settingUserEmail');
    const userBalanceEl = document.querySelector('#settingUserBalance');
    if (userNameEl) userNameEl.innerText = `Nama: ${currentUser.name}`;
    if (userEmailEl) userEmailEl.innerText = `Email: ${currentUser.email}`;
    if (userBalanceEl) userBalanceEl.innerText = `Saldo: ${formatCurrency(currentUser.balance)}`;
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
  try {
    const users = await API.users();
    adminUsers = users || [];
    loadUsersTable(adminUsers);
    adminStocks = await API.stocks();
    loadStocksTable(adminStocks);
    const transactions = await API.transactions();
    adminTransactions = transactions || [];
    loadTransactionsTable(adminTransactions);
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
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

// Load users table
function loadUsersTable(users) {
  const container = document.querySelector('[data-table="users"]') ||
                   createTableContainer('Users');
  
  if (!container) return;
  
  const tbody = container.querySelector('tbody') || container;
  tbody.innerHTML = '';
  
  (users || []).forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm">${user.name}</td>
      <td class="px-4 py-3 text-label-sm">${user.email}</td>
      <td class="px-4 py-3 text-label-sm font-bold">Rp ${user.balance.toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm">
        <span class="px-2 py-1 rounded text-[10px] font-bold ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-surface-variant'}">${user.role}</span>
      </td>
      <td class="px-4 py-3 text-label-sm">
        <button class="text-primary hover:underline text-[12px]" onclick="editUser('${user._id}')">Edit</button>
        <button class="text-secondary ml-2 hover:underline text-[12px]" onclick="deleteUser('${user._id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Load stocks table
function loadStocksTable(stocks) {
  const container = document.querySelector('[data-table="stocks"]') ||
                   createTableContainer('Stocks');
  
  if (!container) return;
  
  const tbody = container.querySelector('tbody') || container;
  tbody.innerHTML = '';
  
  (stocks || []).forEach(stock => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm font-bold">${stock.stockCode}</td>
      <td class="px-4 py-3 text-label-sm">${stock.companyName}</td>
      <td class="px-4 py-3 text-label-sm">Rp ${stock.price.toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm">${stock.volume.toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm">
        <button class="text-primary hover:underline text-[12px]" onclick="editStock('${stock._id}')">Edit</button>
        <button class="text-secondary ml-2 hover:underline text-[12px]" onclick="deleteStock('${stock._id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Load transactions table
function loadTransactionsTable(transactions) {
  const container = document.querySelector('[data-table="transactions"]') ||
                   createTableContainer('Transactions');
  
  if (!container) return;
  
  const tbody = container.querySelector('tbody') || container;
  tbody.innerHTML = '';
  
  (transactions || []).forEach(tx => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm">${tx.userId}</td>
      <td class="px-4 py-3 text-label-sm font-bold">${tx.stockCode}</td>
      <td class="px-4 py-3 text-label-sm">
        <span class="px-2 py-1 rounded text-[10px] font-bold ${tx.type === 'buy' ? 'bg-primary/20 text-primary' : 'bg-secondary-container/20 text-secondary'}">
          ${tx.type.toUpperCase()}
        </span>
      </td>
      <td class="px-4 py-3 text-label-sm">${tx.quantity}</td>
      <td class="px-4 py-3 text-label-sm">Rp ${tx.total.toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm text-on-surface-variant text-[10px]">${new Date(tx.createdAt).toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });
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

// Render admin deposits table
function renderAdminDepositsTable() {
  const tbody = document.querySelector('#adminDepositsTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const deposits = [
    { user: 'Ahmad Wijaya', amount: 50000000, method: 'Bank Transfer', status: 'Completed', date: '2026-06-01 10:30' },
    { user: 'Siti Nurhaliza', amount: 25000000, method: 'E-Wallet', status: 'Pending', date: '2026-06-01 09:15' },
    { user: 'Budi Santoso', amount: 100000000, method: 'Bank Transfer', status: 'Completed', date: '2026-05-31 16:45' },
    { user: 'Dewi Lestari', amount: 15000000, method: 'E-Wallet', status: 'Completed', date: '2026-05-31 14:20' },
    { user: 'Rizky Pratama', amount: 75000000, method: 'Bank Transfer', status: 'Rejected', date: '2026-05-30 11:00' }
  ];
  
  deposits.forEach(deposit => {
    const row = document.createElement('tr');
    const statusClass = deposit.status === 'Completed' ? 'bg-primary/20 text-primary' : 
                        deposit.status === 'Pending' ? 'bg-tertiary/20 text-tertiary' : 
                        'bg-error/20 text-error';
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm">${deposit.user}</td>
      <td class="px-4 py-3 text-label-sm font-bold">Rp ${deposit.amount.toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm">${deposit.method}</td>
      <td class="px-4 py-3 text-label-sm">
        <span class="px-2 py-1 rounded text-[10px] font-bold ${statusClass}">${deposit.status}</span>
      </td>
      <td class="px-4 py-3 text-label-sm text-on-surface-variant">${deposit.date}</td>
      <td class="px-4 py-3 text-label-sm">
        ${deposit.status === 'Pending' ? `
          <button class="text-primary hover:underline text-[12px]" onclick="approveDeposit('${deposit.user}')">Approve</button>
          <button class="text-error ml-2 hover:underline text-[12px]" onclick="rejectDeposit('${deposit.user}')">Reject</button>
        ` : '-'}
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Render admin market monitoring
function renderAdminMonitoringTable() {
  const tbody = document.querySelector('#adminMonitoringTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const markets = [
    { name: 'IHSG', value: '7,205.12', change: '+0.45%', status: 'Active' },
    { name: 'IDX30', value: '485.22', change: '+0.32%', status: 'Active' },
    { name: 'LQ45', value: '912.45', change: '-0.12%', status: 'Active' },
    { name: 'KOMPAS100', value: '1,245.67', change: '+0.58%', status: 'Active' },
    { name: 'JII', value: '78.34', change: '+0.21%', status: 'Active' }
  ];
  
  markets.forEach(market => {
    const row = document.createElement('tr');
    const changeColor = market.change.startsWith('+') ? 'text-primary' : 'text-error';
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm font-bold">${market.name}</td>
      <td class="px-4 py-3 text-label-sm">${market.value}</td>
      <td class="px-4 py-3 text-label-sm ${changeColor} font-bold">${market.change}</td>
      <td class="px-4 py-3 text-label-sm">
        <span class="px-2 py-1 rounded text-[10px] font-bold bg-primary/20 text-primary flex items-center gap-1 w-fit">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          ${market.status}
        </span>
      </td>
      <td class="px-4 py-3 text-label-sm">
        <button class="text-primary hover:underline text-[12px]" onclick="pauseMarket('${market.name}')">Pause</button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  renderStocksMonitoring();
}

function renderStocksMonitoring() {
  const tbody = document.querySelector('#adminStocksMonitoringTable');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  stocks.forEach(stock => {
    const change = (Math.random() * 4 - 2).toFixed(2);
    const changeColor = change > 0 ? 'text-primary' : 'text-error';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="px-4 py-3 text-label-sm font-bold">${stock.stockCode}</td>
      <td class="px-4 py-3 text-label-sm">${stock.companyName}</td>
      <td class="px-4 py-3 text-label-sm">Rp ${stock.price.toLocaleString('id-ID')}</td>
      <td class="px-4 py-3 text-label-sm ${changeColor} font-bold">${change > 0 ? '+' : ''}${change}%</td>
      <td class="px-4 py-3 text-label-sm">${stock.volume?.toLocaleString('id-ID') || 'N/A'}</td>
      <td class="px-4 py-3 text-label-sm">
        <button class="text-primary hover:underline text-[12px]" onclick="editStockPrice('${stock.stockCode}')">Edit Harga</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Global functions for deposits and monitoring
window.approveDeposit = async (userId) => {
  const ok = await NusaConfirm({ title: 'Setujui Deposit?', message: `Deposit dari <strong>${userId}</strong> akan disetujui.`, confirmText: 'Setujui' });
  if (ok) NusaToast(`Deposit dari ${userId} telah disetujui`, 'success');
};

window.rejectDeposit = async (userId) => {
  const ok = await NusaConfirm({ title: 'Tolak Deposit?', message: `Deposit dari <strong>${userId}</strong> akan ditolak.`, danger: true, confirmText: 'Tolak' });
  if (ok) NusaToast(`Deposit dari ${userId} telah ditolak`, 'error');
};

window.pauseMarket = async (marketName) => {
  const ok = await NusaConfirm({ title: `Pause Market ${marketName}?`, message: 'Semua trading pada indeks ini akan dihentikan sementara.', danger: true, confirmText: 'Pause' });
  if (ok) NusaToast(`Market ${marketName} telah di-pause`, 'warning');
};

window.editStockPrice = async (stockCode) => {
  const stock = stocks.find(s => s.stockCode === stockCode) || adminStocks.find(s => s.stockCode === stockCode);
  const newPrice = await NusaEditPriceModal(stockCode, stock?.price || 0);
  if (newPrice && newPrice > 0) {
    NusaToast(`Harga ${stockCode} diperbarui menjadi Rp ${newPrice.toLocaleString('id-ID')}`, 'success');
  }
};
