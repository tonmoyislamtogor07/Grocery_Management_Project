/**
 * GROCERY MANAGEMENT SYSTEM - INVENTORY LOGIC (Pure Vanilla JavaScript)
 * Live stock tracking, Stock In/Out adjustments, Expiry monitoring, and Movement logs.
 */

let activeInventoryFilter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  populateProductSelects();
  updateInventoryStats();
  renderInventoryTable();

  const searchInput = document.getElementById('inventory-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderInventoryTable();
    });
  }
});

// ==========================================================================
// 1. STATS & TAB FILTERING
// ==========================================================================
function updateInventoryStats() {
  const products = GMS_Store.getProducts();
  const totalUnits = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= GMS_Store.getLowThreshold(p)).length;
  const outOfStock = products.filter(p => p.stock <= 0).length;

  // Check items expiring within 30 days of 2026-09-06
  const expiringCount = products.filter(p => isExpiringSoon(p.expiry)).length;

  const totalEl = document.getElementById('stat-total-units');
  if (totalEl) totalEl.textContent = totalUnits.toLocaleString();

  const lowEl = document.getElementById('stat-low-stock-count');
  if (lowEl) lowEl.textContent = lowStock;

  const outEl = document.getElementById('stat-out-stock-count');
  if (outEl) outEl.textContent = outOfStock;

  const expEl = document.getElementById('stat-expiring-count');
  if (expEl) expEl.textContent = expiringCount;

  // Tab badge counts
  document.getElementById('badge-tab-all')?.replaceChildren(document.createTextNode(products.length));
  document.getElementById('badge-tab-low')?.replaceChildren(document.createTextNode(lowStock));
  document.getElementById('badge-tab-out')?.replaceChildren(document.createTextNode(outOfStock));
  document.getElementById('badge-tab-expiring')?.replaceChildren(document.createTextNode(expiringCount));
}

function isExpiringSoon(expiryDateStr) {
  if (!expiryDateStr) return false;
  const expDate = new Date(expiryDateStr);
  const baseDate = new Date('2026-09-06');
  const diffDays = Math.ceil((expDate - baseDate) / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && diffDays >= 0;
}

function setInventoryFilter(filterType, btnElem) {
  activeInventoryFilter = filterType;
  document.querySelectorAll('.inv-tab-btn').forEach(b => b.classList.remove('active'));
  if (btnElem) btnElem.classList.add('active');

  const stockTableWrap = document.getElementById('stock-table-card');
  const historyTableWrap = document.getElementById('history-table-card');

  if (filterType === 'HISTORY') {
    stockTableWrap.style.display = 'none';
    historyTableWrap.style.display = 'block';
    renderInventoryHistory();
  } else {
    stockTableWrap.style.display = 'block';
    historyTableWrap.style.display = 'none';
    renderInventoryTable();
  }
}

// ==========================================================================
// 2. RENDER CURRENT STOCK TABLE
// ==========================================================================
function renderInventoryTable() {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  const products = GMS_Store.getProducts();
  const query = (document.getElementById('inventory-search')?.value || '').toLowerCase().trim();

  const filtered = products.filter(p => {
    const matchQuery = p.name.toLowerCase().includes(query) ||
                       p.barcode.includes(query) ||
                       p.category.toLowerCase().includes(query);

    let matchTab = true;
    if (activeInventoryFilter === 'LOW') matchTab = p.stock > 0 && p.stock <= GMS_Store.getLowThreshold(p);
    else if (activeInventoryFilter === 'OUT') matchTab = p.stock <= 0;
    else if (activeInventoryFilter === 'EXPIRING') matchTab = isExpiringSoon(p.expiry);

    return matchQuery && matchTab;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
          No items found for this inventory filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const isOut = p.stock <= 0;
    const isLow = p.stock > 0 && p.stock <= GMS_Store.getLowThreshold(p);
    const isExp = isExpiringSoon(p.expiry);
    const statusText = isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'Available');

    let badgeClass = 'badge-success';
    let badgeText = statusText;
    let barColor = 'healthy';
    let barWidth = Math.min(100, Math.round((p.stock / 50) * 100));

    if (isOut) {
      badgeClass = 'badge-danger';
      barColor = 'danger';
      barWidth = 0;
    } else if (isLow) {
      badgeClass = 'badge-warning';
      barColor = 'warning';
    }

    const unitDisplay = p.unit ? (/^\d/.test(p.unit) ? p.unit : `1 ${p.unit}`) : '1 pcs';

    return `
      <tr>
        <td>
          <span class="barcode-tag">${p.barcode}</span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${p.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${p.category}</div>
        </td>
        <td>
          <div><strong>${p.stock} ${p.unit}</strong></div>
          <div class="stock-bar-track">
            <div class="stock-bar-fill ${barColor}" style="width: ${barWidth}%;"></div>
          </div>
        </td>
        <td>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </td>
        <td>
          <div>${p.expiry}</div>
          ${isExp ? '<span class="badge badge-danger" style="font-size: 0.7rem; margin-top: 2px;">⚡ Expiring Soon</span>' : ''}
        </td>
        <td><strong>${formatCurrency(p.sellPrice)}</strong> <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">/ ${unitDisplay}</span></td>
        <td>
          <button class="action-btn" title="Stock In / Restock" onclick="quickStockIn('${p.id}')">📥</button>
          <button class="action-btn" title="Stock Out / Damage" onclick="quickStockOut('${p.id}')">📤</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 3. STOCK IN & STOCK OUT MODALS
// ==========================================================================
function populateProductSelects() {
  const products = GMS_Store.getProducts();
  const options = products.map(p => `<option value="${p.id}">${p.name} (Cur: ${p.stock} ${p.unit})</option>`).join('');

  const inSelect = document.getElementById('stock-in-product');
  const outSelect = document.getElementById('stock-out-product');

  if (inSelect) inSelect.innerHTML = options;
  if (outSelect) outSelect.innerHTML = options;
}

function quickStockIn(productId) {
  populateProductSelects();
  const inSelect = document.getElementById('stock-in-product');
  if (inSelect) inSelect.value = productId;
  document.getElementById('stock-in-qty').value = '10';
  document.getElementById('stock-in-note').value = 'Routine restock';
  openModal('stock-in-modal');
}

function quickStockOut(productId) {
  populateProductSelects();
  const outSelect = document.getElementById('stock-out-product');
  if (outSelect) outSelect.value = productId;
  document.getElementById('stock-out-qty').value = '1';
  document.getElementById('stock-out-reason').value = 'Damaged';
  openModal('stock-out-modal');
}

function handleSaveStockIn(e) {
  e.preventDefault();

  const prodId = document.getElementById('stock-in-product').value;
  const qty = parseInt(document.getElementById('stock-in-qty').value, 10);
  const note = document.getElementById('stock-in-note').value.trim();

  if (isNaN(qty) || qty <= 0) {
    showToast('Enter a valid stock quantity.', 'warning');
    return;
  }

  let products = GMS_Store.getProducts();
  let productName = '';
  products = products.map(p => {
    if (p.id === prodId) {
      productName = p.name;
      return { ...p, stock: p.stock + qty };
    }
    return p;
  });
  GMS_Store.set(GMS_Store.KEYS.PRODUCTS, products);

  // Log movement
  logStockMovement({
    type: 'STOCK_IN',
    productName,
    qty: `+${qty}`,
    note: note || 'Supplier restock'
  });

  showToast(`Added +${qty} units to "${productName}"!`, 'success');
  closeModal('stock-in-modal');
  updateInventoryStats();
  renderInventoryTable();
}

function handleSaveStockOut(e) {
  e.preventDefault();

  const prodId = document.getElementById('stock-out-product').value;
  const qty = parseInt(document.getElementById('stock-out-qty').value, 10);
  const reason = document.getElementById('stock-out-reason').value;

  if (isNaN(qty) || qty <= 0) {
    showToast('Enter a valid stock quantity.', 'warning');
    return;
  }

  let products = GMS_Store.getProducts();
  let productName = '';
  let available = 0;

  products.forEach(p => {
    if (p.id === prodId) {
      productName = p.name;
      available = p.stock;
    }
  });

  if (qty > available) {
    showToast(`Cannot remove ${qty}. Current stock is only ${available}!`, 'danger');
    return;
  }

  products = products.map(p => {
    if (p.id === prodId) {
      return { ...p, stock: p.stock - qty };
    }
    return p;
  });
  GMS_Store.set(GMS_Store.KEYS.PRODUCTS, products);

  // Log movement
  logStockMovement({
    type: 'STOCK_OUT',
    productName,
    qty: `-${qty}`,
    note: `Reason: ${reason}`
  });

  showToast(`Deducted -${qty} units from "${productName}"!`, 'info');
  closeModal('stock-out-modal');
  updateInventoryStats();
  renderInventoryTable();
}

// ==========================================================================
// 4. INVENTORY MOVEMENT HISTORY
// ==========================================================================
// Keep global name for backwards compatibility; delegates to the central store.
function logStockMovement(entry) {
  GMS_Store.logInventoryMovement(entry);
}

function renderInventoryHistory() {
  const tbody = document.getElementById('inv-history-tbody');
  if (!tbody) return;

  let logs = GMS_Store.get(GMS_Store.KEYS.INVENTORY_LOGS);

  // Seed some initial movements if empty
  if (logs.length === 0) {
    logs = [
      { id: 'LOG-101', date: '2026-09-06 09:30 AM', type: 'STOCK_IN', productName: 'Nazirshail Premium Rice', qty: '+50', note: 'Restock from Meghna Agro' },
      { id: 'LOG-102', date: '2026-09-05 04:15 PM', type: 'STOCK_OUT', productName: 'Aarong Pasteurised Milk 1L', qty: '-2', note: 'Reason: Damaged pack leakage' },
      { id: 'LOG-103', date: '2026-09-04 11:00 AM', type: 'STOCK_IN', productName: 'Fresh Fortified Soybean Oil 5L', qty: '+20', note: 'Restock shipment' }
    ];
    GMS_Store.set(GMS_Store.KEYS.INVENTORY_LOGS, logs);
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td><strong>${l.id}</strong></td>
      <td>${l.date}</td>
      <td>
        <span class="badge ${l.type === 'STOCK_IN' ? 'badge-success' : 'badge-danger'}">
          ${l.type === 'STOCK_IN' ? '📥 Stock In' : '📤 Stock Out'}
        </span>
        ${l.ref ? `<div style="font-size:0.72rem;color:var(--text-muted);">${l.ref}</div>` : ''}
      </td>
      <td><strong>${l.productName}</strong></td>
      <td><strong style="color: ${l.type === 'STOCK_IN' ? 'var(--primary)' : 'var(--danger)'};">${l.qty}</strong></td>
      <td><span style="color: var(--text-muted); font-size: 0.85rem;">${l.note}</span></td>
    </tr>
  `).join('');
}
