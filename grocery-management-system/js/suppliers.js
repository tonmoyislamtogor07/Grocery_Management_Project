/**
 * GROCERY MANAGEMENT SYSTEM - SUPPLIERS LOGIC (Pure Vanilla JavaScript)
 * Zero external libraries. Full CRUD, Purchase History, and Due management.
 */

let editingSupplierId = null;

document.addEventListener('DOMContentLoaded', () => {
  renderSuppliers();
  updateSupplierStats();

  const searchInput = document.getElementById('supplier-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSuppliers(e.target.value.toLowerCase().trim());
    });
  }
});

// ==========================================================================
// 1. RENDER SUPPLIERS
// ==========================================================================
function renderSuppliers(query = '') {
  const container = document.getElementById('suppliers-container');
  if (!container) return;

  const suppliers = GMS_Store.getSuppliers();
  const purchases = GMS_Store.getPurchases();

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(query) ||
    (s.contact && s.contact.includes(query)) ||
    (s.address && s.address.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <span style="font-size: 2.5rem;">🚚</span>
        <h3 style="margin-top: 12px; color: var(--text-main);">No Suppliers Found</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">Try a different keyword or click "+ Add Supplier".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(sup => {
    // Calculate total purchased amount from this supplier
    const supPurchases = purchases.filter(p => p.supplier.toLowerCase() === sup.name.toLowerCase());
    const totalSupplied = supPurchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
    const initials = sup.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return `
      <div class="supplier-card">
        <div class="supplier-header">
          <div class="supplier-avatar">${initials}</div>
          <div class="supplier-name-box">
            <h3>${sup.name}</h3>
            <span>ID: ${sup.id}</span>
          </div>
        </div>

        <div class="supplier-meta-list">
          <div class="supplier-meta-row">
            <span>📞</span> <span>${sup.contact || 'No phone'}</span>
          </div>
          <div class="supplier-meta-row">
            <span>✉️</span> <span>${sup.email || 'N/A'}</span>
          </div>
          <div class="supplier-meta-row">
            <span>📍</span> <span>${sup.address || 'Dhaka, Bangladesh'}</span>
          </div>
        </div>

        <div class="supplier-due-strip">
          <div>
            <div class="label">Total Supplied</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-main);">${formatCurrency(totalSupplied)}</div>
          </div>
          <div style="text-align: right;">
            <div class="label">Outstanding Due</div>
            <div class="amount" style="color: ${sup.due > 0 ? 'var(--danger)' : 'var(--primary)'};">
              ${formatCurrency(sup.due || 0)}
            </div>
          </div>
        </div>

        <div class="supplier-actions">
          <button class="quick-btn" style="font-size: 0.78rem; padding: 6px 12px;" onclick="viewSupplierHistory('${sup.name}')">
            📜 History (${supPurchases.length})
          </button>
          <div style="display: flex; gap: 4px;">
            <button class="action-btn" title="View Details" onclick="viewSupplierDetails('${sup.id}')">👁️</button>
            <button class="action-btn" title="Edit Supplier" onclick="openEditSupplierModal('${sup.id}')">✏️</button>
            <button class="action-btn delete" title="Delete Supplier" onclick="deleteSupplier('${sup.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateSupplierStats() {
  const suppliers = GMS_Store.getSuppliers();
  const totalDue = suppliers.reduce((sum, s) => sum + Number(s.due || 0), 0);
  const withDueCount = suppliers.filter(s => s.due > 0).length;

  const totalEl = document.getElementById('stat-total-suppliers');
  if (totalEl) totalEl.textContent = suppliers.length;

  const dueEl = document.getElementById('stat-total-due');
  if (dueEl) dueEl.textContent = formatCurrency(totalDue);

  const activeEl = document.getElementById('stat-active-vendors');
  if (activeEl) activeEl.textContent = `${suppliers.length - withDueCount} Clear / ${withDueCount} Due`;
}

// ==========================================================================
// 2. ADD & EDIT SUPPLIER MODALS
// ==========================================================================
function openAddSupplierModal() {
  editingSupplierId = null;
  document.getElementById('supplier-modal-title').textContent = 'Add New Grocery Supplier';
  document.getElementById('supplier-form').reset();
  openModal('supplier-form-modal');
}

function openEditSupplierModal(supId) {
  const suppliers = GMS_Store.getSuppliers();
  const sup = suppliers.find(s => s.id === supId);
  if (!sup) return;

  editingSupplierId = supId;
  document.getElementById('supplier-modal-title').textContent = `Edit: ${sup.name}`;
  document.getElementById('sup-name').value = sup.name;
  document.getElementById('sup-contact').value = sup.contact;
  document.getElementById('sup-email').value = sup.email || '';
  document.getElementById('sup-address').value = sup.address || '';
  document.getElementById('sup-due').value = sup.due || 0;

  openModal('supplier-form-modal');
}

function handleSaveSupplier(e) {
  e.preventDefault();

  const name = document.getElementById('sup-name').value.trim();
  const contact = document.getElementById('sup-contact').value.trim();
  const email = document.getElementById('sup-email').value.trim();
  const address = document.getElementById('sup-address').value.trim();
  const due = parseFloat(document.getElementById('sup-due').value) || 0;

  if (!name || !contact) {
    showToast('Supplier Name and Contact Phone are required.', 'danger');
    return;
  }

  let suppliers = GMS_Store.getSuppliers();

  if (editingSupplierId) {
    suppliers = suppliers.map(s => {
      if (s.id === editingSupplierId) {
        return { ...s, name, contact, email, address, due };
      }
      return s;
    });
    showToast(`Supplier "${name}" updated successfully!`, 'success');
  } else {
    const newId = 'SUP' + String(suppliers.length + 1).padStart(2, '0');
    suppliers.push({ id: newId, name, contact, email, address, due });
    showToast(`New supplier "${name}" added!`, 'success');
  }

  GMS_Store.set(GMS_Store.KEYS.SUPPLIERS, suppliers);
  closeModal('supplier-form-modal');
  renderSuppliers();
  updateSupplierStats();
}

// ==========================================================================
// 3. SUPPLIER DETAILS & PURCHASE HISTORY
// ==========================================================================
function viewSupplierDetails(supId) {
  const suppliers = GMS_Store.getSuppliers();
  const sup = suppliers.find(s => s.id === supId);
  if (!sup) return;

  const purchases = GMS_Store.getPurchases().filter(p => p.supplier.toLowerCase() === sup.name.toLowerCase());
  const totalSupply = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);

  const modalBody = document.getElementById('supplier-details-body');
  modalBody.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
      <div class="supplier-avatar" style="width: 60px; height: 60px; margin: 0 auto 12px; font-size: 1.5rem;">
        ${sup.name.slice(0, 2).toUpperCase()}
      </div>
      <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main);">${sup.name}</h3>
      <span class="badge badge-purple">Registered Vendor (${sup.id})</span>
    </div>

    <div class="product-detail-grid">
      <div class="detail-info-box">
        <div class="label">Phone / Contact</div>
        <div class="val">${sup.contact}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Email Address</div>
        <div class="val">${sup.email || 'N/A'}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Warehouse Address</div>
        <div class="val">${sup.address || 'Dhaka'}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Payable Due Balance</div>
        <div class="val" style="color: ${sup.due > 0 ? 'var(--danger)' : 'var(--primary)'};">
          ${formatCurrency(sup.due || 0)}
        </div>
      </div>
      <div class="detail-info-box" style="grid-column: span 2;">
        <div class="label">Total Lifetime Purchases</div>
        <div class="val" style="color: var(--primary);">${formatCurrency(totalSupply)} (${purchases.length} Orders)</div>
      </div>
    </div>
  `;

  openModal('supplier-details-modal');
}

function viewSupplierHistory(supplierName) {
  const purchases = GMS_Store.getPurchases().filter(p => p.supplier.toLowerCase() === supplierName.toLowerCase());

  document.getElementById('sup-history-title').textContent = `Purchase History: ${supplierName}`;
  const tbody = document.getElementById('sup-history-tbody');

  if (purchases.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No purchase orders recorded for this supplier yet.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = purchases.map(pur => `
      <tr>
        <td><strong style="color: var(--primary);">${pur.id}</strong></td>
        <td>${pur.date}</td>
        <td><strong>${formatCurrency(pur.total)}</strong></td>
        <td>${formatCurrency(pur.paid)}</td>
        <td>
          <span class="badge ${pur.due > 0 ? 'badge-warning' : 'badge-success'}">
            ${pur.status || (pur.due > 0 ? 'Partial' : 'Paid')}
          </span>
        </td>
      </tr>
    `).join('');
  }

  openModal('supplier-history-modal');
}

// ==========================================================================
// 4. DELETE SUPPLIER
// ==========================================================================
function deleteSupplier(supId) {
  const suppliers = GMS_Store.getSuppliers();
  const sup = suppliers.find(s => s.id === supId);
  if (!sup) return;

  if (confirm(`Are you sure you want to remove supplier "${sup.name}"?`)) {
    const updated = suppliers.filter(s => s.id !== supId);
    GMS_Store.set(GMS_Store.KEYS.SUPPLIERS, updated);
    showToast(`Supplier "${sup.name}" removed.`, 'info');
    renderSuppliers();
    updateSupplierStats();
  }
}
