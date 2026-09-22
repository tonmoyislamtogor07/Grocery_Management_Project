/**
 * GROCERY MANAGEMENT SYSTEM - PURCHASES LOGIC (Pure Vanilla JavaScript)
 * Multi-item purchase builder, stock increment sync, and supplier due tracking.
 */

let purchaseRows = [];

document.addEventListener('DOMContentLoaded', () => {
  renderPurchases();
  updatePurchaseStats();
  populateSupplierSelect();

  const searchInput = document.getElementById('purchase-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderPurchases(e.target.value.toLowerCase().trim());
    });
  }

  const statusFilter = document.getElementById('purchase-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      renderPurchases();
    });
  }
});

// ==========================================================================
// 1. RENDER PURCHASES TABLE
// ==========================================================================
function renderPurchases(query = '') {
  const tbody = document.getElementById('purchases-tbody');
  if (!tbody) return;

  const purchases = GMS_Store.getPurchases();
  const selectedStatus = document.getElementById('purchase-status-filter')?.value || 'ALL';

  const filtered = purchases.filter(p => {
    const matchQuery = p.id.toLowerCase().includes(query) ||
                       p.supplier.toLowerCase().includes(query) ||
                       p.date.includes(query);

    let matchStatus = true;
    if (selectedStatus === 'PAID') matchStatus = Number(p.due || 0) === 0;
    else if (selectedStatus === 'DUE') matchStatus = Number(p.due || 0) > 0;

    return matchQuery && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 36px; color: var(--text-muted);">
          🔍 No purchase orders found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(pur => {
    const isDue = Number(pur.due || 0) > 0;
    return `
      <tr>
        <td><strong style="color: var(--primary);">${pur.id}</strong></td>
        <td>${pur.date}</td>
        <td><strong>${pur.supplier}</strong></td>
        <td><strong>${formatCurrency(pur.total)}</strong></td>
        <td><span style="color: var(--primary);">${formatCurrency(pur.paid || pur.total)}</span></td>
        <td>
          <span class="badge ${isDue ? 'badge-warning' : 'badge-success'}">
            ${isDue ? `Due: ${formatCurrency(pur.due)}` : 'Full Paid'}
          </span>
        </td>
        <td>
          <button class="action-btn" title="View PO Details" onclick="viewPurchaseDetails('${pur.id}')">👁️</button>
          <button class="action-btn delete" title="Delete PO" onclick="deletePurchase('${pur.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updatePurchaseStats() {
  const purchases = GMS_Store.getPurchases();
  const totalAmount = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalDue = purchases.reduce((sum, p) => sum + Number(p.due || 0), 0);

  const totalCountEl = document.getElementById('stat-total-purchases');
  if (totalCountEl) totalCountEl.textContent = purchases.length;

  const totalSpentEl = document.getElementById('stat-total-spent');
  if (totalSpentEl) totalSpentEl.textContent = formatCurrency(totalAmount);

  const totalDueEl = document.getElementById('stat-purchases-due');
  if (totalDueEl) totalDueEl.textContent = formatCurrency(totalDue);
}

// ==========================================================================
// 2. MULTI-ITEM PURCHASE BUILDER MODAL
// ==========================================================================
function populateSupplierSelect() {
  const suppliers = GMS_Store.getSuppliers();
  const select = document.getElementById('pur-supplier-select');
  if (select) {
    select.innerHTML = suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  }
}

function openCreatePurchaseModal() {
  populateSupplierSelect();
  purchaseRows = [];
  
  // Set default today's date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('pur-date').value = today;
  
  // Add first row
  addPurchaseItemRow();
  
  document.getElementById('pur-paid').value = '0';
  recalcPurchaseTotals();
  openModal('create-purchase-modal');
}

function addPurchaseItemRow() {
  const products = GMS_Store.getProducts();
  const newRow = {
    productId: products[0]?.id || '',
    productName: products[0]?.name || 'Grocery Item',
    cost: products[0]?.buyPrice || 50,
    qty: 10,
    unit: products[0]?.unit || 'kg'
  };

  purchaseRows.push(newRow);
  renderPurchaseBuilderTable();
  recalcPurchaseTotals();
}

function removePurchaseItemRow(index) {
  if (purchaseRows.length <= 1) {
    showToast('A purchase order must have at least 1 item.', 'warning');
    return;
  }
  purchaseRows.splice(index, 1);
  renderPurchaseBuilderTable();
  recalcPurchaseTotals();
}

function renderPurchaseBuilderTable() {
  const tbody = document.getElementById('purchase-builder-tbody');
  if (!tbody) return;

  const products = GMS_Store.getProducts();

  tbody.innerHTML = purchaseRows.map((row, idx) => `
    <tr>
      <td>
        <select class="form-control" onchange="onPurchaseProductSelect(${idx}, this.value)">
          ${products.map(p => `
            <option value="${p.id}" ${p.id === row.productId ? 'selected' : ''}>
              ${p.name} (${p.unit})
            </option>
          `).join('')}
        </select>
      </td>
      <td>
        <input type="number" step="0.5" min="0" value="${row.cost}" class="form-control"
          oninput="onPurchaseCostChange(${idx}, this.value)">
      </td>
      <td>
        <input type="number" min="1" value="${row.qty}" class="form-control"
          oninput="onPurchaseQtyChange(${idx}, this.value)">
      </td>
      <td>
        <strong>${formatCurrency(row.cost * row.qty)}</strong>
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn-remove-row" onclick="removePurchaseItemRow(${idx})">✕</button>
      </td>
    </tr>
  `).join('');
}

function onPurchaseProductSelect(index, prodId) {
  const products = GMS_Store.getProducts();
  const prod = products.find(p => p.id === prodId);
  if (!prod) return;

  purchaseRows[index].productId = prod.id;
  purchaseRows[index].productName = prod.name;
  purchaseRows[index].cost = prod.buyPrice;
  purchaseRows[index].unit = prod.unit;

  renderPurchaseBuilderTable();
  recalcPurchaseTotals();
}

function onPurchaseCostChange(index, value) {
  purchaseRows[index].cost = parseFloat(value) || 0;
  recalcPurchaseTotals();
}

function onPurchaseQtyChange(index, value) {
  purchaseRows[index].qty = parseInt(value, 10) || 0;
  recalcPurchaseTotals();
}

function recalcPurchaseTotals() {
  const grandTotal = purchaseRows.reduce((sum, r) => sum + (r.cost * r.qty), 0);
  
  const totalEl = document.getElementById('pur-grand-total');
  if (totalEl) totalEl.textContent = formatCurrency(grandTotal);

  const paidInput = document.getElementById('pur-paid');
  let paid = parseFloat(paidInput?.value) || 0;
  
  // If paid was not manually typed or 0, default paid to grandTotal
  const due = Math.max(0, grandTotal - paid);
  
  const dueEl = document.getElementById('pur-due-amount');
  if (dueEl) dueEl.textContent = formatCurrency(due);
}

function handleSavePurchase(e) {
  e.preventDefault();

  const supplier = document.getElementById('pur-supplier-select').value;
  const date = document.getElementById('pur-date').value;
  const grandTotal = purchaseRows.reduce((sum, r) => sum + (r.cost * r.qty), 0);
  const paid = parseFloat(document.getElementById('pur-paid').value) || 0;
  const due = Math.max(0, grandTotal - paid);

  if (grandTotal <= 0) {
    showToast('Purchase total cannot be zero.', 'danger');
    return;
  }

  let purchases = GMS_Store.getPurchases();
  const newPOId = 'PUR-' + Math.floor(100 + Math.random() * 900);

  const newPO = {
    id: newPOId,
    date,
    supplier,
    items: [...purchaseRows],
    total: grandTotal,
    paid,
    due,
    status: due === 0 ? 'Paid' : 'Partial'
  };

  purchases.unshift(newPO);
  GMS_Store.set(GMS_Store.KEYS.PURCHASES, purchases);

  // 1. Auto-increment products stock in Inventory
  let products = GMS_Store.getProducts();
  purchaseRows.forEach(row => {
    products = products.map(p => {
      if (p.id === row.productId) {
        return { ...p, stock: p.stock + row.qty, buyPrice: row.cost };
      }
      return p;
    });
  });
  GMS_Store.set(GMS_Store.KEYS.PRODUCTS, products);

  // 1b. Log STOCK_IN movements (Supplier Purchase -> Purchase Items -> stock increase)
  purchaseRows.forEach(row => {
    GMS_Store.logInventoryMovement({
      type: 'STOCK_IN',
      productId: row.productId,
      productName: row.productName,
      qty: `+${row.qty} ${row.unit || ''}`.trim(),
      note: `Supplier Purchase from ${supplier}`,
      ref: newPOId
    });
  });

  // 2. If due balance, increase supplier's payable due
  if (due > 0) {
    let suppliers = GMS_Store.getSuppliers();
    suppliers = suppliers.map(s => {
      if (s.name.toLowerCase() === supplier.toLowerCase()) {
        return { ...s, due: (s.due || 0) + due };
      }
      return s;
    });
    GMS_Store.set(GMS_Store.KEYS.SUPPLIERS, suppliers);
  }

  showToast(`Purchase order ${newPOId} created and inventory restocked!`, 'success');
  closeModal('create-purchase-modal');
  renderPurchases();
  updatePurchaseStats();
}

// ==========================================================================
// 3. VIEW PURCHASE DETAILS
// ==========================================================================
function viewPurchaseDetails(purchaseId) {
  const purchases = GMS_Store.getPurchases();
  const po = purchases.find(p => p.id === purchaseId);
  if (!po) return;

  const modalBody = document.getElementById('purchase-details-body');
  modalBody.innerHTML = `
    <div style="display: flex; justify-content: space-between; border-bottom: 2px solid var(--border); padding-bottom: 14px; margin-bottom: 16px;">
      <div>
        <h2 style="color: var(--primary);">FreshMart Grocery</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Purchase Order Voucher</p>
      </div>
      <div style="text-align: right;">
        <div><strong>PO Number:</strong> ${po.id}</div>
        <div><strong>Date:</strong> ${po.date}</div>
      </div>
    </div>

    <div style="margin-bottom: 16px; font-size: 0.9rem;">
      <strong>Supplier:</strong> ${po.supplier}
    </div>

    <table class="purchase-items-table" style="margin-bottom: 16px;">
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Unit Cost</th>
          <th>Qty</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${(po.items || []).map(it => `
          <tr>
            <td><strong>${it.productName || 'Grocery Item'}</strong></td>
            <td>${formatCurrency(it.cost || 0)}</td>
            <td>${it.qty}</td>
            <td>${formatCurrency((it.cost || 0) * (it.qty || 1))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="border-top: 1px solid var(--border); padding-top: 10px; font-size: 0.9rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>Grand Total:</span>
        <strong>${formatCurrency(po.total)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--primary);">
        <span>Paid Amount:</span>
        <span>${formatCurrency(po.paid)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: 800; color: ${po.due > 0 ? 'var(--danger)' : 'var(--primary)'};">
        <span>Due Payable:</span>
        <span>${formatCurrency(po.due || 0)}</span>
      </div>
    </div>
  `;

  openModal('purchase-details-modal');
}

// ==========================================================================
// 4. DELETE PURCHASE
// ==========================================================================
function deletePurchase(purchaseId) {
  if (confirm(`Are you sure you want to delete PO "${purchaseId}"?`)) {
    const purchases = GMS_Store.getPurchases().filter(p => p.id !== purchaseId);
    GMS_Store.set(GMS_Store.KEYS.PURCHASES, purchases);
    showToast(`Purchase order ${purchaseId} deleted.`, 'info');
    renderPurchases();
    updatePurchaseStats();
  }
}
