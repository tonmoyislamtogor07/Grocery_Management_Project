/**
 * GROCERY MANAGEMENT SYSTEM - ADMIN PROFILE & MULTI-ADMIN LOGIC (Pure Vanilla JavaScript)
 * Profile edits, password change, and multi-admin user management.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCurrentAdminProfile();
  renderAllAdminsTable();
});

// ==========================================================================
// 1. RENDER CURRENT ADMIN
// ==========================================================================
function renderCurrentAdminProfile() {
  const admin = GMS_Store.getCurrentAdmin();
  if (!admin) return;

  // Hero Card
  document.getElementById('profile-avatar-large').textContent = admin.avatar || admin.name.slice(0, 2).toUpperCase();
  document.getElementById('profile-name-title').textContent = admin.name;
  document.getElementById('profile-email-sub').textContent = admin.email;
  document.getElementById('profile-role-badge').textContent = admin.role || 'Super Admin';

  document.getElementById('profile-meta-id').textContent = admin.id;
  document.getElementById('profile-meta-phone').textContent = admin.phone || 'N/A';
  document.getElementById('profile-meta-joined').textContent = admin.joined || '2025-01-10';

  // Edit Form Fields
  document.getElementById('edit-admin-name').value = admin.name;
  document.getElementById('edit-admin-email').value = admin.email;
  document.getElementById('edit-admin-phone').value = admin.phone || '';
}

// ==========================================================================
// 2. SAVE PROFILE EDITS
// ==========================================================================
function handleSaveProfile(e) {
  e.preventDefault();

  const name = document.getElementById('edit-admin-name').value.trim();
  const email = document.getElementById('edit-admin-email').value.trim().toLowerCase();
  const phone = document.getElementById('edit-admin-phone').value.trim();

  if (!name || !email) {
    showToast('Name and Email are required.', 'danger');
    return;
  }

  let current = GMS_Store.getCurrentAdmin();
  const avatar = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  current = { ...current, name, email, phone, avatar };
  GMS_Store.setCurrentAdmin(current);

  // Sync with admins list
  let admins = GMS_Store.getAdmins();
  admins = admins.map(a => a.id === current.id ? current : a);
  GMS_Store.set(GMS_Store.KEYS.ADMINS, admins);

  showToast('Profile information updated successfully!', 'success');
  renderCurrentAdminProfile();
  renderAllAdminsTable();

  // Update sidebar immediately
  const sidebarName = document.querySelector('.user-name');
  const sidebarAvatar = document.querySelector('.user-avatar');
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarAvatar) sidebarAvatar.textContent = avatar;
}

// ==========================================================================
// 3. CHANGE PASSWORD
// ==========================================================================
function handleChangePassword(e) {
  e.preventDefault();

  const currentPass = document.getElementById('pass-current').value;
  const newPass = document.getElementById('pass-new').value;
  const confirmPass = document.getElementById('pass-confirm').value;

  const admin = GMS_Store.getCurrentAdmin();

  if (admin.password && admin.password !== currentPass) {
    showToast('Current password does not match.', 'danger');
    return;
  }

  if (newPass.length < 4) {
    showToast('New password must be at least 4 characters.', 'warning');
    return;
  }

  if (newPass !== confirmPass) {
    showToast('New password and confirmation do not match.', 'danger');
    return;
  }

  // Update password in current session & store
  admin.password = newPass;
  GMS_Store.setCurrentAdmin(admin);

  let admins = GMS_Store.getAdmins();
  admins = admins.map(a => a.id === admin.id ? { ...a, password: newPass } : a);
  GMS_Store.set(GMS_Store.KEYS.ADMINS, admins);

  showToast('Password changed successfully!', 'success');
  document.getElementById('form-change-password').reset();
}

// ==========================================================================
// 4. MULTI-ADMINS MANAGEMENT
// ==========================================================================
function renderAllAdminsTable() {
  const tbody = document.getElementById('admins-table-tbody');
  if (!tbody) return;

  const admins = GMS_Store.getAdmins();
  const currentAdmin = GMS_Store.getCurrentAdmin();

  tbody.innerHTML = admins.map(a => {
    const isSelf = currentAdmin && a.id === currentAdmin.id;
    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="admin-avatar-small">${a.avatar || a.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <div style="font-weight: 700; color: var(--text-main);">${a.name} ${isSelf ? '<span class="badge badge-success" style="font-size: 0.68rem;">You</span>' : ''}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${a.id} • Joined: ${a.joined || '2025'}</div>
            </div>
          </div>
        </td>
        <td>${a.email}</td>
        <td>
          <span class="badge ${a.role === 'Super Admin' ? 'badge-purple' : 'badge-info'}">
            ${a.role}
          </span>
        </td>
        <td>
          <span class="badge badge-success">Active</span>
        </td>
        <td>
          ${!isSelf ? `
            <button class="action-btn" title="Switch to this admin" onclick="switchAdminSession('${a.id}')">🔄</button>
            <button class="action-btn delete" title="Remove admin" onclick="deleteAdmin('${a.id}')">🗑️</button>
          ` : '<span style="font-size: 0.75rem; color: var(--text-muted);">Current Active</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

function openAddAdminModal() {
  document.getElementById('form-add-admin').reset();
  openModal('modal-add-admin');
}

function handleSaveNewAdmin(e) {
  e.preventDefault();

  const name = document.getElementById('new-admin-name').value.trim();
  const email = document.getElementById('new-admin-email').value.trim().toLowerCase();
  const password = document.getElementById('new-admin-pass').value.trim();
  const phone = document.getElementById('new-admin-phone').value.trim();
  const role = document.getElementById('new-admin-role').value;

  let admins = GMS_Store.getAdmins();

  if (admins.some(a => a.email.toLowerCase() === email)) {
    showToast('An admin with this email already exists.', 'danger');
    return;
  }

  const newId = 'ADM' + String(admins.length + 1).padStart(2, '0');
  const avatar = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const today = new Date().toISOString().split('T')[0];

  const newAdmin = {
    id: newId,
    name,
    email,
    password: password || 'admin123',
    phone: phone || 'N/A',
    role,
    avatar,
    joined: today,
    status: 'Active'
  };

  admins.push(newAdmin);
  GMS_Store.set(GMS_Store.KEYS.ADMINS, admins);

  showToast(`New admin "${name}" registered!`, 'success');
  closeModal('modal-add-admin');
  renderAllAdminsTable();
}

function switchAdminSession(adminId) {
  const admins = GMS_Store.getAdmins();
  const target = admins.find(a => a.id === adminId);
  if (!target) return;

  GMS_Store.setCurrentAdmin(target);
  showToast(`Switched active session to ${target.name} (${target.role})!`, 'info');

  setTimeout(() => {
    window.location.reload();
  }, 400);
}

function deleteAdmin(adminId) {
  const current = GMS_Store.getCurrentAdmin();
  if (current && current.id === adminId) {
    showToast('You cannot delete your own active admin account!', 'danger');
    return;
  }

  const admins = GMS_Store.getAdmins();
  const target = admins.find(a => a.id === adminId);
  if (!target) return;

  if (confirm(`Are you sure you want to remove admin "${target.name}"?`)) {
    const updated = admins.filter(a => a.id !== adminId);
    GMS_Store.set(GMS_Store.KEYS.ADMINS, updated);
    showToast(`Admin "${target.name}" removed.`, 'info');
    renderAllAdminsTable();
  }
}
