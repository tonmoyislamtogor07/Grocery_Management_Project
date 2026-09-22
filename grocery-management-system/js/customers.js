/**
 * GROCERY MANAGEMENT SYSTEM - CUSTOMERS LOGIC (Pure Vanilla JavaScript)
 * Zero external libraries. Full CRUD, Purchase History, and Receivables.
 */

let editingCustomerId = null;

document.addEventListener('DOMContentLoaded', () => {
  renderCustomers();
  updateCustomerStats();

  const searchInput = document.getElementById('customer-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderCustomers(e.target.value.toLowerCase().trim());
    });
  }
});

// ==========================================================================
// 1. RENDER CUSTOMERS TABLE
// ==========================================================================
function renderCustomers(query = '') {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  const customers = GMS_Store.getCustomers();
  const sales = GMS_Store.getSales();

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(query) ||
    (c.phone && c.phone.includes(query)) ||
    (c.email && c.email.toLowerCase().includes(query))
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 36px; color: var(--text-muted);">
          🔍 No customers found matching your search.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    // Customer purchase statistics from sales ledger (Customer -> Sale -> SaleItems)
    const customerSales = GMS_Store.getCustomerSalesHistory(c);
    const totalSpent = customerSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return `
      <tr>
        <td>
          <div class="customer-avatar-cell">
            <div class="customer-avatar-circle">${initials}</div>
            <div>
              <div class="customer-name-bold">${c.name}</div>
              <div class="customer-phone-sub">ID: ${c.id}</div>
            </div>
          </div>
        </td>
        <td>
          <div>📞 ${c.phone || 'N/A'}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${c.email || 'No email registered'}</div>
        </td>
        <td>
          <div><strong>${formatCurrency(totalSpent)}</strong></div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${customerSales.length} Orders</div>
        </td>
        <td>
          <span class="badge ${c.due > 0 ? 'badge-danger' : 'badge-success'}">
            ${c.due > 0 ? `Due: ${formatCurrency(c.due)}` : 'Cleared (৳0)'}
          </span>
        </td>
        <td>
          <button class="action-btn" title="Purchase History" onclick="viewCustomerHistory('${c.name}')">📜</button>
          <button class="action-btn" title="View Profile" onclick="viewCustomerDetails('${c.id}')">👁️</button>
          <button class="action-btn" title="Edit Customer" onclick="openEditCustomerModal('${c.id}')">✏️</button>
          <button class="action-btn delete" title="Delete Customer" onclick="deleteCustomer('${c.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateCustomerStats() {
  const customers = GMS_Store.getCustomers();
  const totalReceivable = customers.reduce((sum, c) => sum + Number(c.due || 0), 0);

  const totalEl = document.getElementById('stat-total-customers');
  if (totalEl) totalEl.textContent = customers.length;

  const dueEl = document.getElementById('stat-total-receivable');
  if (dueEl) dueEl.textContent = formatCurrency(totalReceivable);
}

// ==========================================================================
// 2. ADD & EDIT CUSTOMER MODALS
// ==========================================================================
function openAddCustomerModal() {
  editingCustomerId = null;
  document.getElementById('customer-modal-title').textContent = 'Add New Customer Profile';
  document.getElementById('customer-form').reset();
  openModal('customer-form-modal');
}

function openEditCustomerModal(custId) {
  const customers = GMS_Store.getCustomers();
  const c = customers.find(item => item.id === custId);
  if (!c) return;

  editingCustomerId = custId;
  document.getElementById('customer-modal-title').textContent = `Edit: ${c.name}`;
  document.getElementById('cust-name').value = c.name;
  document.getElementById('cust-phone').value = c.phone;
  document.getElementById('cust-email').value = c.email || '';
  document.getElementById('cust-due').value = c.due || 0;

  openModal('customer-form-modal');
}

function handleSaveCustomer(e) {
  e.preventDefault();

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const due = parseFloat(document.getElementById('cust-due').value) || 0;

  if (!name) {
    showToast('Customer Name is required.', 'danger');
    return;
  }

  let customers = GMS_Store.getCustomers();

  if (editingCustomerId) {
    customers = customers.map(c => {
      if (c.id === editingCustomerId) {
        return { ...c, name, phone, email, due };
      }
      return c;
    });
    showToast(`Customer "${name}" profile updated!`, 'success');
  } else {
    const newId = 'CUST' + String(customers.length + 1).padStart(2, '0');
    customers.push({ id: newId, name, phone: phone || 'N/A', email: email || 'N/A', due });
    showToast(`New customer "${name}" registered!`, 'success');
  }

  GMS_Store.set(GMS_Store.KEYS.CUSTOMERS, customers);
  closeModal('customer-form-modal');
  renderCustomers();
  updateCustomerStats();
}

// ==========================================================================
// 3. CUSTOMER DETAILS & PURCHASE HISTORY
// ==========================================================================
function viewCustomerDetails(custId) {
  const customers = GMS_Store.getCustomers();
  const c = customers.find(item => item.id === custId);
  if (!c) return;

  const sales = GMS_Store.getCustomerSalesHistory(c);
  const totalSpent = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const modalBody = document.getElementById('customer-details-body');
  modalBody.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border);">
      <div class="customer-avatar-circle" style="width: 60px; height: 60px; margin: 0 auto 12px; font-size: 1.5rem;">
        ${c.name.slice(0, 2).toUpperCase()}
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${c.name}</h3>
      <span class="badge badge-purple">${c.id}</span>
    </div>

    <div class="product-detail-grid">
      <div class="detail-info-box">
        <div class="label">Mobile Number</div>
        <div class="val">${c.phone}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Email Address</div>
        <div class="val">${c.email || 'N/A'}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Total Lifetime Spend</div>
        <div class="val" style="color: var(--primary);">${formatCurrency(totalSpent)}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Total Orders Placed</div>
        <div class="val">${sales.length} Invoices</div>
      </div>
      <div class="detail-info-box" style="grid-column: span 2;">
        <div class="label">Store Credit / Due Balance</div>
        <div class="val" style="color: ${c.due > 0 ? 'var(--danger)' : 'var(--primary)'};">
          ${formatCurrency(c.due || 0)}
        </div>
      </div>
    </div>
  `;

  openModal('customer-details-modal');
}

function viewCustomerHistory(customerName) {
  const customer = GMS_Store.findCustomerByName(customerName);
  const sales = customer ? GMS_Store.getCustomerSalesHistory(customer) : [];
  const totalSpent = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  document.getElementById('cust-history-title').textContent = `Purchase History: ${customerName} — ${sales.length} sale(s), ${formatCurrency(totalSpent)}`;
  const tbody = document.getElementById('cust-history-tbody');

  if (sales.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">
          No invoices recorded for this customer yet.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = sales.map(sale => {
      const inv = sale.invoiceNo || sale.id;
      const itemsText = (sale.items || []).map(it => {
        const qty = it.quantity ?? it.qty;
        const price = it.unit_price ?? it.price;
        return `${it.name} — ${qty}${it.unit ? ' ' + it.unit : ''} × ৳${price}`;
      }).join('<br>');
      return `
      <tr>
        <td><strong style="color: var(--primary);">${inv}</strong><div style="font-size:0.72rem;color:var(--text-muted);">${sale.date}</div></td>
        <td style="font-size:0.8rem;">${itemsText || '—'}</td>
        <td><span class="badge badge-gray">${sale.items ? sale.items.length : 1} items</span></td>
        <td><strong>${formatCurrency(sale.total)}</strong></td>
        <td><span class="badge ${sale.method === 'Cash' ? 'badge-success' : 'badge-purple'}">${sale.method || 'Cash'}</span></td>
        <td>
          <span class="badge ${sale.status === 'Completed' ? 'badge-success' : 'badge-warning'}">
            ${sale.status || 'Completed'}
          </span>
        </td>
      </tr>`;
    }).join('');
  }

  openModal('customer-history-modal');
}

// ==========================================================================
// 4. DELETE CUSTOMER (safe: historical sales are NEVER destroyed)
// ==========================================================================
function deleteCustomer(custId) {
  const customers = GMS_Store.getCustomers();
  const c = customers.find(item => item.id === custId);
  if (!c) return;

  const linkedSales = GMS_Store.getCustomerSalesHistory(c);
  const warning = linkedSales.length > 0
    ? `\n\nNote: ${linkedSales.length} historical sale(s) belong to this customer. They will be KEPT for reports (shown under "${c.name}").`
    : '';
  if (confirm(`Are you sure you want to remove customer "${c.name}"?${warning}`)) {
    const updated = customers.filter(item => item.id !== custId);
    GMS_Store.set(GMS_Store.KEYS.CUSTOMERS, updated);
    showToast(`Customer "${c.name}" profile removed. Sales history preserved.`, 'info');
    renderCustomers();
    updateCustomerStats();
  }
}
