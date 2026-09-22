/**
 * GROCERY MANAGEMENT SYSTEM - ADMIN LOGIN LOGIC (Pure Vanilla JavaScript)
 * Zero external libraries. Multi-admin authentication and session management.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const currentAdmin = GMS_Store.getCurrentAdmin();
  if (currentAdmin && window.location.search.includes('logout=true')) {
    GMS_Store.logout();
  }

  setupLoginForm();
  renderDemoAdminButtons();
});

function setupLoginForm() {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const passInput = document.getElementById('login-password');
  const togglePassBtn = document.getElementById('toggle-password-btn');

  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.textContent = isPass ? '🙈' : '👁️';
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';

      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value.trim();

      const admins = GMS_Store.getAdmins();
      const matchedAdmin = admins.find(a => 
        (a.email.toLowerCase() === email || a.name.toLowerCase() === email) && 
        a.password === password
      );

      if (matchedAdmin) {
        GMS_Store.setCurrentAdmin(matchedAdmin);
        
        // Button loading feedback
        const btn = document.getElementById('btn-submit-login');
        btn.innerHTML = '<span>⏳</span> Authenticating...';
        btn.disabled = true;

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 600);
      } else {
        errorBox.textContent = 'Invalid admin email or password. Please try again.';
        errorBox.style.display = 'block';
      }
    });
  }
}

function renderDemoAdminButtons() {
  const container = document.getElementById('demo-admin-list');
  if (!container) return;

  const admins = GMS_Store.getAdmins();
  container.innerHTML = admins.map(a => `
    <button type="button" class="demo-quick-btn" onclick="quickLoginAs('${a.email}', '${a.password}')">
      <div>
        <span>${a.name}</span>
        <span style="font-size: 0.72rem; color: #64748b; margin-left: 4px;">(${a.email})</span>
      </div>
      <span class="demo-role-tag">${a.role}</span>
    </button>
  `).join('');
}

function quickLoginAs(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  document.getElementById('login-form').dispatchEvent(new Event('submit'));
}
