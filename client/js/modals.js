/**
 * NusaTrade Modal System
 * Replaces browser prompt/alert/confirm with beautiful custom modals
 */

// ── Inject global modal styles once ──────────────────────────────────────────
(function injectStyles() {
  if (document.getElementById('nusa-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'nusa-modal-styles';
  style.textContent = `
    .nusa-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
      animation: nusaFadeIn 0.2s ease;
    }
    .nusa-overlay.closing { animation: nusaFadeOut 0.18s ease forwards; }
    @keyframes nusaFadeIn  { from { opacity:0 } to { opacity:1 } }
    @keyframes nusaFadeOut { from { opacity:1 } to { opacity:0 } }
    .nusa-card {
      background: #161616;
      border: 1px solid rgba(78,222,163,0.18);
      border-radius: 1rem;
      padding: 2rem;
      width: 100%; max-width: 440px;
      box-shadow: 0 0 60px rgba(78,222,163,0.08), 0 24px 48px rgba(0,0,0,0.6);
      animation: nusaSlideUp 0.22s cubic-bezier(.34,1.56,.64,1);
    }
    .nusa-card.sm { max-width: 360px; }
    .nusa-card.lg { max-width: 540px; }
    @keyframes nusaSlideUp {
      from { opacity:0; transform:translateY(20px) scale(0.97) }
      to   { opacity:1; transform:translateY(0)   scale(1)    }
    }
    .nusa-title {
      font-size: 1.25rem; font-weight: 700; color: #e5e2e1;
      margin-bottom: 0.35rem;
    }
    .nusa-subtitle {
      font-size: 0.8rem; color: #bbcabf; margin-bottom: 1.5rem;
    }
    .nusa-field { margin-bottom: 1.1rem; }
    .nusa-label {
      display: block; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: #bbcabf; margin-bottom: 0.4rem;
    }
    .nusa-input {
      width: 100%; padding: 0.7rem 1rem;
      background: #201f1f; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.5rem; color: #e5e2e1;
      font-size: 0.95rem; font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none; box-sizing: border-box;
    }
    .nusa-input:focus {
      border-color: #4edea3;
      box-shadow: 0 0 0 3px rgba(78,222,163,0.12);
    }
    .nusa-input::placeholder { color: #86948a; }
    .nusa-input-icon { position: relative; }
    .nusa-input-icon .nusa-input { padding-left: 2.6rem; }
    .nusa-input-icon .icon {
      position: absolute; left: 0.8rem; top: 50%;
      transform: translateY(-50%);
      color: #86948a; font-size: 1.1rem; pointer-events: none;
    }
    .nusa-toggle-pw {
      position: absolute; right: 0.8rem; top: 50%;
      transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: #86948a; padding: 0; line-height: 1;
    }
    .nusa-toggle-pw:hover { color: #4edea3; }
    .nusa-btn {
      width: 100%; padding: 0.75rem 1.5rem;
      border-radius: 0.6rem; font-weight: 700;
      font-size: 0.95rem; cursor: pointer; border: none;
      transition: opacity 0.15s, transform 0.1s;
    }
    .nusa-btn:hover { opacity: 0.88; }
    .nusa-btn:active { transform: scale(0.98); }
    .nusa-btn-primary { background: #4edea3; color: #003824; }
    .nusa-btn-danger  { background: #93000a; color: #ffdad6; }
    .nusa-btn-ghost   {
      background: transparent; border: 1px solid rgba(255,255,255,0.12);
      color: #e5e2e1;
    }
    .nusa-btn-ghost:hover { background: rgba(255,255,255,0.05); }
    .nusa-row { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
    .nusa-row .nusa-btn { flex: 1; }
    .nusa-divider {
      border: none; border-top: 1px solid rgba(255,255,255,0.07);
      margin: 1.25rem 0;
    }
    .nusa-link {
      color: #4edea3; text-decoration: none; font-size: 0.82rem;
      cursor: pointer; font-weight: 600;
    }
    .nusa-link:hover { text-decoration: underline; }
    .nusa-error {
      background: rgba(147,0,10,0.18); border: 1px solid rgba(255,180,171,0.25);
      color: #ffb4ab; border-radius: 0.5rem;
      padding: 0.6rem 0.85rem; font-size: 0.8rem;
      margin-bottom: 1rem; display: none;
    }
    .nusa-error.show { display: block; }
    .nusa-success-icon {
      width: 3.5rem; height: 3.5rem; border-radius: 50%;
      background: rgba(78,222,163,0.12); display: flex;
      align-items: center; justify-content: center;
      margin: 0 auto 1rem;
    }
    .nusa-toast {
      position: fixed; bottom: 1.5rem; left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: #161616; border: 1px solid rgba(78,222,163,0.3);
      border-radius: 0.6rem; padding: 0.75rem 1.25rem;
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 0.875rem; color: #e5e2e1;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      z-index: 10000; transition: transform 0.3s cubic-bezier(.34,1.56,.64,1);
      white-space: nowrap;
    }
    .nusa-toast.show { transform: translateX(-50%) translateY(0); }
    .nusa-toast.error { border-color: rgba(255,180,171,0.3); }
    .nusa-toast .t-icon { font-size: 1.1rem; }
    .nusa-select {
      width: 100%; padding: 0.7rem 1rem;
      background: #201f1f; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.5rem; color: #e5e2e1;
      font-size: 0.95rem; font-family: inherit;
      outline: none; box-sizing: border-box; cursor: pointer;
    }
    .nusa-select:focus { border-color: #4edea3; box-shadow: 0 0 0 3px rgba(78,222,163,0.12); }
    .nusa-badge-primary { display: inline-block; padding: 0.15rem 0.5rem;
      border-radius: 9999px; font-size: 0.7rem; font-weight: 700;
      background: rgba(78,222,163,0.15); color: #4edea3; }
    .nusa-spinner {
      width: 1rem; height: 1rem;
      border: 2px solid rgba(0,56,36,0.3);
      border-top-color: #003824; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg) } }
  `;
  document.head.appendChild(style);
})();

// ── Core helpers ──────────────────────────────────────────────────────────────
function closeModal(overlay) {
  overlay.classList.add('closing');
  setTimeout(() => overlay.remove(), 180);
}

/** Show a toast notification */
window.NusaToast = function(message, type = 'success', duration = 3000) {
  const icons = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' };
  const colors = { success: '#4edea3', error: '#ffb4ab', info: '#adc6ff', warning: '#ffb3ad' };
  const t = document.createElement('div');
  t.className = `nusa-toast${type === 'error' ? ' error' : ''}`;
  t.innerHTML = `
    <span class="material-symbols-outlined t-icon" style="color:${colors[type]}">${icons[type] || 'info'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, duration);
};

/** Generic confirm dialog */
window.NusaConfirm = function({ title, message, confirmText = 'Ya', cancelText = 'Batal', danger = false }) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card sm">
        <div style="text-align:center;margin-bottom:1rem">
          <div class="nusa-success-icon" style="${danger ? 'background:rgba(147,0,10,0.15)' : ''}">
            <span class="material-symbols-outlined" style="font-size:1.8rem;color:${danger ? '#ffb4ab' : '#4edea3'}">${danger ? 'warning' : 'help'}</span>
          </div>
          <p class="nusa-title" style="text-align:center">${title}</p>
          <p class="nusa-subtitle" style="text-align:center;margin-bottom:0">${message}</p>
        </div>
        <div class="nusa-row">
          <button class="nusa-btn nusa-btn-ghost" id="nusa-cancel">${cancelText}</button>
          <button class="nusa-btn ${danger ? 'nusa-btn-danger' : 'nusa-btn-primary'}" id="nusa-confirm">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#nusa-confirm').onclick = () => { closeModal(overlay); resolve(true); };
    overlay.querySelector('#nusa-cancel').onclick  = () => { closeModal(overlay); resolve(false); };
  });
};

// ── LOGIN MODAL ───────────────────────────────────────────────────────────────
window.NusaLoginModal = function() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
          <div style="width:2.5rem;height:2.5rem;border-radius:0.6rem;background:rgba(78,222,163,0.12);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="color:#4edea3">lock</span>
          </div>
          <div>
            <p class="nusa-title" style="margin-bottom:0">Masuk ke NusaTrade</p>
            <p style="font-size:0.78rem;color:#bbcabf">Selamat datang kembali 👋</p>
          </div>
        </div>
        <div class="nusa-error" id="loginErr"></div>
        <div class="nusa-field">
          <label class="nusa-label">Email</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">mail</span>
            <input class="nusa-input" id="loginEmail" type="email" placeholder="nama@email.com" autocomplete="email"/>
          </div>
        </div>
        <div class="nusa-field">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem">
            <label class="nusa-label" style="margin-bottom:0">Password</label>
          </div>
          <div class="nusa-input-icon" style="position:relative">
            <span class="material-symbols-outlined icon">key</span>
            <input class="nusa-input" id="loginPass" type="password" placeholder="••••••••" autocomplete="current-password" style="padding-right:2.8rem"/>
            <button class="nusa-toggle-pw" id="togglePw" tabindex="-1" type="button">
              <span class="material-symbols-outlined" style="font-size:1.1rem;vertical-align:middle">visibility</span>
            </button>
          </div>
        </div>
        <button class="nusa-btn nusa-btn-primary" id="loginSubmit" style="margin-top:0.5rem">
          Masuk
        </button>
        <hr class="nusa-divider"/>
        <p style="text-align:center;font-size:0.82rem;color:#bbcabf">
          Belum punya akun? <a class="nusa-link" id="switchRegister">Daftar sekarang</a>
        </p>
        <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:#86948a" id="closeLogin">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`;
    overlay.querySelector('.nusa-card').style.position = 'relative';
    document.body.appendChild(overlay);

    const emailEl   = overlay.querySelector('#loginEmail');
    const passEl    = overlay.querySelector('#loginPass');
    const errEl     = overlay.querySelector('#loginErr');
    const submitBtn = overlay.querySelector('#loginSubmit');

    overlay.querySelector('#togglePw').onclick = () => {
      const shown = passEl.type === 'text';
      passEl.type = shown ? 'password' : 'text';
      overlay.querySelector('#togglePw span').textContent = shown ? 'visibility' : 'visibility_off';
    };
    overlay.querySelector('#closeLogin').onclick = () => { closeModal(overlay); resolve(null); };

    overlay.querySelector('#switchRegister').onclick = () => {
      closeModal(overlay);
      setTimeout(() => NusaRegisterModal().then(resolve), 200);
    };

    submitBtn.onclick = async () => {
      const email = emailEl.value.trim();
      const pass  = passEl.value;
      errEl.classList.remove('show');
      if (!email || !pass) { errEl.textContent = 'Email dan password wajib diisi.'; errEl.classList.add('show'); return; }
      submitBtn.innerHTML = '<span class="nusa-spinner"></span> Memproses...';
      submitBtn.disabled = true;
      try {
        const result = await API.login({ email, password: pass });
        if (result.token) {
          closeModal(overlay);
          resolve(result);
        } else {
          errEl.textContent = result.message || 'Login gagal. Periksa email dan password.';
          errEl.classList.add('show');
          submitBtn.innerHTML = 'Masuk'; submitBtn.disabled = false;
        }
      } catch (e) {
        errEl.textContent = 'Terjadi kesalahan: ' + e.message;
        errEl.classList.add('show');
        submitBtn.innerHTML = 'Masuk'; submitBtn.disabled = false;
      }
    };
    emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') passEl.focus(); });
    passEl.addEventListener('keydown',  e => { if (e.key === 'Enter') submitBtn.click(); });
    setTimeout(() => emailEl.focus(), 100);
  });
};

// ── REGISTER MODAL ────────────────────────────────────────────────────────────
window.NusaRegisterModal = function() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card" style="position:relative">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
          <div style="width:2.5rem;height:2.5rem;border-radius:0.6rem;background:rgba(78,222,163,0.12);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="color:#4edea3">person_add</span>
          </div>
          <div>
            <p class="nusa-title" style="margin-bottom:0">Buat Akun Baru</p>
            <p style="font-size:0.78rem;color:#bbcabf">Mulai trading hari ini 🚀</p>
          </div>
        </div>
        <div class="nusa-error" id="regErr"></div>
        <div class="nusa-field">
          <label class="nusa-label">Nama Lengkap</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">badge</span>
            <input class="nusa-input" id="regName" type="text" placeholder="Nama Lengkap Anda" autocomplete="name"/>
          </div>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Email</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">mail</span>
            <input class="nusa-input" id="regEmail" type="email" placeholder="nama@email.com" autocomplete="email"/>
          </div>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Password</label>
          <div class="nusa-input-icon" style="position:relative">
            <span class="material-symbols-outlined icon">key</span>
            <input class="nusa-input" id="regPass" type="password" placeholder="Min. 6 karakter" autocomplete="new-password" style="padding-right:2.8rem"/>
            <button class="nusa-toggle-pw" id="toggleRegPw" tabindex="-1" type="button">
              <span class="material-symbols-outlined" style="font-size:1.1rem;vertical-align:middle">visibility</span>
            </button>
          </div>
        </div>
        <button class="nusa-btn nusa-btn-primary" id="regSubmit" style="margin-top:0.5rem">
          Daftar Sekarang
        </button>
        <hr class="nusa-divider"/>
        <p style="text-align:center;font-size:0.82rem;color:#bbcabf">
          Sudah punya akun? <a class="nusa-link" id="switchLogin">Masuk di sini</a>
        </p>
        <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:#86948a" id="closeReg">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`;
    document.body.appendChild(overlay);

    const nameEl    = overlay.querySelector('#regName');
    const emailEl   = overlay.querySelector('#regEmail');
    const passEl    = overlay.querySelector('#regPass');
    const errEl     = overlay.querySelector('#regErr');
    const submitBtn = overlay.querySelector('#regSubmit');

    overlay.querySelector('#toggleRegPw').onclick = () => {
      const shown = passEl.type === 'text';
      passEl.type = shown ? 'password' : 'text';
      overlay.querySelector('#toggleRegPw span').textContent = shown ? 'visibility' : 'visibility_off';
    };
    overlay.querySelector('#closeReg').onclick    = () => { closeModal(overlay); resolve(null); };
    overlay.querySelector('#switchLogin').onclick  = () => {
      closeModal(overlay);
      setTimeout(() => NusaLoginModal().then(resolve), 200);
    };

    submitBtn.onclick = async () => {
      const name  = nameEl.value.trim();
      const email = emailEl.value.trim();
      const pass  = passEl.value;
      errEl.classList.remove('show');
      if (!name || !email || !pass) { errEl.textContent = 'Semua field wajib diisi.'; errEl.classList.add('show'); return; }
      if (pass.length < 6) { errEl.textContent = 'Password minimal 6 karakter.'; errEl.classList.add('show'); return; }
      submitBtn.innerHTML = '<span class="nusa-spinner"></span> Mendaftarkan...';
      submitBtn.disabled = true;
      try {
        const result = await API.register({ name, email, password: pass });
        if (result.token) {
          closeModal(overlay);
          resolve(result);
        } else {
          errEl.textContent = result.message || 'Registrasi gagal.';
          errEl.classList.add('show');
          submitBtn.innerHTML = 'Daftar Sekarang'; submitBtn.disabled = false;
        }
      } catch(e) {
        errEl.textContent = 'Terjadi kesalahan: ' + e.message;
        errEl.classList.add('show');
        submitBtn.innerHTML = 'Daftar Sekarang'; submitBtn.disabled = false;
      }
    };
    setTimeout(() => nameEl.focus(), 100);
  });
};

// ── DEPOSIT MODAL ─────────────────────────────────────────────────────────────
window.NusaDepositModal = function(currentBalance) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card" style="position:relative">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
          <div style="width:2.5rem;height:2.5rem;border-radius:0.6rem;background:rgba(78,222,163,0.12);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="color:#4edea3">payments</span>
          </div>
          <div>
            <p class="nusa-title" style="margin-bottom:0">Deposit Saldo</p>
            <p style="font-size:0.78rem;color:#bbcabf">Saldo saat ini: <strong style="color:#e5e2e1">Rp ${Number(currentBalance||0).toLocaleString('id-ID')}</strong></p>
          </div>
        </div>
        <div class="nusa-error" id="depErr"></div>
        <div class="nusa-field">
          <label class="nusa-label">Jumlah Deposit (IDR)</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">attach_money</span>
            <input class="nusa-input" id="depAmount" type="number" min="10000" step="10000" placeholder="Contoh: 1000000"/>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap">
          ${[500000,1000000,5000000,10000000].map(v =>
            `<button class="dep-quick" style="flex:1;min-width:5rem;padding:0.4rem 0.6rem;background:#201f1f;border:1px solid rgba(255,255,255,0.1);border-radius:0.4rem;color:#e5e2e1;font-size:0.75rem;cursor:pointer" data-val="${v}">
              Rp ${(v/1e6).toFixed(v<1e6?1:0)}jt
            </button>`).join('')}
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Metode Pembayaran</label>
          <select class="nusa-select" id="depMethod">
            <option value="transfer">Transfer Bank (BCA / Mandiri / BRI)</option>
            <option value="ewallet">E-Wallet (GoPay / OVO / DANA)</option>
            <option value="virtual">Virtual Account</option>
          </select>
        </div>
        <div class="nusa-row">
          <button class="nusa-btn nusa-btn-ghost" id="depCancel">Batal</button>
          <button class="nusa-btn nusa-btn-primary" id="depSubmit">Konfirmasi Deposit</button>
        </div>
        <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:#86948a" id="depClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`;
    document.body.appendChild(overlay);

    const amtEl  = overlay.querySelector('#depAmount');
    const errEl  = overlay.querySelector('#depErr');
    overlay.querySelectorAll('.dep-quick').forEach(btn => {
      btn.onclick = () => { amtEl.value = btn.dataset.val; };
    });
    overlay.querySelector('#depClose').onclick  = () => { closeModal(overlay); resolve(null); };
    overlay.querySelector('#depCancel').onclick  = () => { closeModal(overlay); resolve(null); };
    overlay.querySelector('#depSubmit').onclick = () => {
      const amount = parseInt(amtEl.value);
      const method = overlay.querySelector('#depMethod').value;
      errEl.classList.remove('show');
      if (!amount || amount < 10000) { errEl.textContent = 'Minimum deposit Rp 10.000.'; errEl.classList.add('show'); return; }
      closeModal(overlay);
      resolve({ amount, method });
    };
    setTimeout(() => amtEl.focus(), 100);
  });
};

// ── EDIT USER MODAL ───────────────────────────────────────────────────────────
window.NusaEditUserModal = function(user) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card" style="position:relative">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
          <div style="width:2.5rem;height:2.5rem;border-radius:0.6rem;background:rgba(78,222,163,0.12);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="color:#4edea3">manage_accounts</span>
          </div>
          <div>
            <p class="nusa-title" style="margin-bottom:0">Edit Pengguna</p>
            <p style="font-size:0.78rem;color:#bbcabf">${user.name || user.email}</p>
          </div>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Nama</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">badge</span>
            <input class="nusa-input" id="euName" type="text" value="${user.name || ''}"/>
          </div>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Email</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">mail</span>
            <input class="nusa-input" id="euEmail" type="email" value="${user.email || ''}"/>
          </div>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Saldo (IDR)</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">account_balance_wallet</span>
            <input class="nusa-input" id="euBalance" type="number" min="0" value="${user.balance || 0}"/>
          </div>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Role</label>
          <select class="nusa-select" id="euRole">
            <option value="user"  ${(user.role==='user'  || !user.role) ? 'selected' : ''}>User</option>
            <option value="admin" ${user.role==='admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div class="nusa-row">
          <button class="nusa-btn nusa-btn-ghost" id="euCancel">Batal</button>
          <button class="nusa-btn nusa-btn-primary" id="euSave">Simpan Perubahan</button>
        </div>
        <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:#86948a" id="euClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => { closeModal(overlay); resolve(null); };
    overlay.querySelector('#euClose').onclick  = close;
    overlay.querySelector('#euCancel').onclick = close;
    overlay.querySelector('#euSave').onclick   = () => {
      closeModal(overlay);
      resolve({
        name:    overlay.querySelector('#euName').value.trim(),
        email:   overlay.querySelector('#euEmail').value.trim(),
        balance: parseInt(overlay.querySelector('#euBalance').value) || 0,
        role:    overlay.querySelector('#euRole').value,
      });
    };
  });
};

// ── EDIT STOCK MODAL ──────────────────────────────────────────────────────────
window.NusaEditStockModal = function(stock) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card" style="position:relative">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
          <div style="width:2.5rem;height:2.5rem;border-radius:0.6rem;background:rgba(78,222,163,0.12);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="color:#4edea3">edit_note</span>
          </div>
          <div>
            <p class="nusa-title" style="margin-bottom:0">Edit Saham</p>
            <p style="font-size:0.78rem;color:#bbcabf">${stock.stockCode} — ${stock.companyName || ''}</p>
          </div>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Nama Perusahaan</label>
          <input class="nusa-input" id="esName" type="text" value="${stock.companyName || ''}"/>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Harga (IDR)</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">attach_money</span>
            <input class="nusa-input" id="esPrice" type="number" min="1" value="${stock.price || 0}"/>
          </div>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Volume</label>
          <input class="nusa-input" id="esVolume" type="number" min="0" value="${stock.volume || 0}"/>
        </div>
        <div class="nusa-row">
          <button class="nusa-btn nusa-btn-ghost" id="esCancel">Batal</button>
          <button class="nusa-btn nusa-btn-primary" id="esSave">Simpan</button>
        </div>
        <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:#86948a" id="esClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => { closeModal(overlay); resolve(null); };
    overlay.querySelector('#esClose').onclick  = close;
    overlay.querySelector('#esCancel').onclick = close;
    overlay.querySelector('#esSave').onclick   = () => {
      closeModal(overlay);
      resolve({
        companyName: overlay.querySelector('#esName').value.trim(),
        price:  parseInt(overlay.querySelector('#esPrice').value) || 0,
        volume: parseInt(overlay.querySelector('#esVolume').value) || 0,
      });
    };
  });
};

// ── CREATE STOCK MODAL ────────────────────────────────────────────────────────
window.NusaCreateStockModal = function() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card" style="position:relative">
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem">
          <div style="width:2.5rem;height:2.5rem;border-radius:0.6rem;background:rgba(78,222,163,0.12);display:flex;align-items:center;justify-content:center">
            <span class="material-symbols-outlined" style="color:#4edea3">add_chart</span>
          </div>
          <div>
            <p class="nusa-title" style="margin-bottom:0">Tambah Saham Baru</p>
            <p style="font-size:0.78rem;color:#bbcabf">Listing emiten ke platform</p>
          </div>
        </div>
        <div class="nusa-error" id="csErr"></div>
        <div class="nusa-field">
          <label class="nusa-label">Kode Saham</label>
          <input class="nusa-input" id="csCode" type="text" placeholder="Contoh: BBCA" maxlength="6"
            style="text-transform:uppercase;font-family:'JetBrains Mono',monospace;letter-spacing:0.08em"/>
        </div>
        <div class="nusa-field">
          <label class="nusa-label">Nama Perusahaan</label>
          <input class="nusa-input" id="csCompany" type="text" placeholder="Bank Central Asia Tbk."/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
          <div class="nusa-field">
            <label class="nusa-label">Harga Awal (IDR)</label>
            <div class="nusa-input-icon">
              <span class="material-symbols-outlined icon">attach_money</span>
              <input class="nusa-input" id="csPrice" type="number" min="1" placeholder="10000"/>
            </div>
          </div>
          <div class="nusa-field">
            <label class="nusa-label">Volume Awal</label>
            <input class="nusa-input" id="csVolume" type="number" min="0" placeholder="1000000"/>
          </div>
        </div>
        <div class="nusa-row">
          <button class="nusa-btn nusa-btn-ghost" id="csCancel">Batal</button>
          <button class="nusa-btn nusa-btn-primary" id="csSave">Tambahkan Saham</button>
        </div>
        <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:#86948a" id="csClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`;
    document.body.appendChild(overlay);
    const errEl = overlay.querySelector('#csErr');
    const codeEl = overlay.querySelector('#csCode');
    codeEl.addEventListener('input', () => { codeEl.value = codeEl.value.toUpperCase(); });
    const close = () => { closeModal(overlay); resolve(null); };
    overlay.querySelector('#csClose').onclick  = close;
    overlay.querySelector('#csCancel').onclick = close;
    overlay.querySelector('#csSave').onclick   = () => {
      errEl.classList.remove('show');
      const code = codeEl.value.trim().toUpperCase();
      const company = overlay.querySelector('#csCompany').value.trim();
      const price   = parseInt(overlay.querySelector('#csPrice').value);
      const volume  = parseInt(overlay.querySelector('#csVolume').value) || 0;
      if (!code || !company || !price) {
        errEl.textContent = 'Kode saham, nama perusahaan, dan harga wajib diisi.';
        errEl.classList.add('show'); return;
      }
      closeModal(overlay);
      resolve({ stockCode: code, companyName: company, price, volume });
    };
    setTimeout(() => codeEl.focus(), 100);
  });
};

// ── TRADE CONFIRM MODAL ───────────────────────────────────────────────────────
window.NusaTradeConfirmModal = function({ type, stockCode, lots, price, fee, total }) {
  return new Promise(resolve => {
    const isBuy = type === 'buy';
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card sm" style="position:relative">
        <div style="text-align:center;margin-bottom:1.5rem">
          <div style="width:3rem;height:3rem;border-radius:0.75rem;margin:0 auto 0.75rem;display:flex;align-items:center;justify-content:center;background:${isBuy ? 'rgba(78,222,163,0.12)' : 'rgba(147,0,10,0.15)'}">
            <span class="material-symbols-outlined" style="font-size:1.5rem;color:${isBuy ? '#4edea3' : '#ffb4ab'}">${isBuy ? 'trending_up' : 'trending_down'}</span>
          </div>
          <p class="nusa-title">Konfirmasi ${isBuy ? 'Pembelian' : 'Penjualan'}</p>
          <p style="font-size:0.8rem;color:#bbcabf">Periksa detail transaksi sebelum melanjutkan</p>
        </div>
        <div style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.07);border-radius:0.75rem;overflow:hidden;margin-bottom:1.25rem">
          ${[
            ['Emiten', `<strong style="font-family:monospace;color:#e5e2e1">${stockCode}</strong>`],
            ['Tipe Order', `<span style="padding:0.15rem 0.6rem;border-radius:9999px;font-size:0.7rem;font-weight:700;background:${isBuy?'rgba(78,222,163,0.15)':'rgba(147,0,10,0.2)'};color:${isBuy?'#4edea3':'#ffb4ab'}">${isBuy?'BELI':'JUAL'}</span>`],
            ['Jumlah', `${lots} Lot (${(lots*100).toLocaleString('id-ID')} saham)`],
            ['Harga per Lot', `Rp ${Number(price).toLocaleString('id-ID')}`],
            ['Nilai Transaksi', `Rp ${Number(lots*100*price).toLocaleString('id-ID')}`],
            ['Biaya (0.15%)', `Rp ${Number(fee).toLocaleString('id-ID')}`],
          ].map(([k,v]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.65rem 1rem;border-bottom:1px solid rgba(255,255,255,0.05)">
              <span style="font-size:0.8rem;color:#bbcabf">${k}</span>
              <span style="font-size:0.82rem">${v}</span>
            </div>`).join('')}
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;background:rgba(78,222,163,0.05)">
            <span style="font-size:0.9rem;font-weight:700">Total</span>
            <span style="font-size:1rem;font-weight:700;color:#4edea3">Rp ${Number(total).toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div class="nusa-row">
          <button class="nusa-btn nusa-btn-ghost" id="tcCancel">Batal</button>
          <button class="nusa-btn ${isBuy ? 'nusa-btn-primary' : 'nusa-btn-danger'}" id="tcConfirm">
            ${isBuy ? 'Beli Sekarang' : 'Jual Sekarang'}
          </button>
        </div>
        <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:#86948a" id="tcClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => { closeModal(overlay); resolve(false); };
    overlay.querySelector('#tcClose').onclick   = close;
    overlay.querySelector('#tcCancel').onclick  = close;
    overlay.querySelector('#tcConfirm').onclick = () => { closeModal(overlay); resolve(true); };
  });
};

// ── EDIT STOCK PRICE MODAL (monitoring) ───────────────────────────────────────
window.NusaEditPriceModal = function(stockCode, currentPrice) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'nusa-overlay';
    overlay.innerHTML = `
      <div class="nusa-card sm" style="position:relative">
        <p class="nusa-title">Update Harga ${stockCode}</p>
        <p class="nusa-subtitle">Harga saat ini: <strong style="color:#e5e2e1">Rp ${Number(currentPrice||0).toLocaleString('id-ID')}</strong></p>
        <div class="nusa-field">
          <label class="nusa-label">Harga Baru (IDR)</label>
          <div class="nusa-input-icon">
            <span class="material-symbols-outlined icon">attach_money</span>
            <input class="nusa-input" id="epPrice" type="number" min="1" value="${currentPrice||0}"/>
          </div>
        </div>
        <div class="nusa-row">
          <button class="nusa-btn nusa-btn-ghost" id="epCancel">Batal</button>
          <button class="nusa-btn nusa-btn-primary" id="epSave">Update</button>
        </div>
        <button style="position:absolute;top:1rem;right:1rem;background:none;border:none;cursor:pointer;color:#86948a" id="epClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`;
    document.body.appendChild(overlay);
    const inp = overlay.querySelector('#epPrice');
    const close = () => { closeModal(overlay); resolve(null); };
    overlay.querySelector('#epClose').onclick  = close;
    overlay.querySelector('#epCancel').onclick = close;
    overlay.querySelector('#epSave').onclick   = () => {
      const p = parseInt(inp.value);
      if (!p || p <= 0) return;
      closeModal(overlay);
      resolve(p);
    };
    setTimeout(() => { inp.focus(); inp.select(); }, 100);
  });
};
