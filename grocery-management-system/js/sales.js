/**
 * GROCERY MANAGEMENT SYSTEM - SALES & POS LOGIC (Pure Vanilla JavaScript)
 * Interactive POS terminal, live cart, discount/tax calculations, stock deduction, and thermal invoice generator.
 */

let cart = [];
let selectedPaymentMethod = 'Cash';
let activeCategoryFilter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadCustomerDropdown();
  renderCategoryPills();
  renderPOSProductGrid();
  renderSalesHistory();
  setupPOSListeners();
});

// ==========================================================================
// 1. TABS MANAGEMENT (POS Terminal vs Sales History)
// ==========================================================================
function setupTabs() {
  const tabPos = document.getElementById('tab-btn-pos');
  const tabHistory = document.getElementById('tab-btn-history');
  const viewPos = document.getElementById('pos-view-section');
  const viewHistory = document.getElementById('history-view-section');

  if (tabPos && tabHistory) {
    tabPos.addEventListener('click', () => {
      tabPos.classList.add('active');
      tabHistory.classList.remove('active');
      viewPos.style.display = 'grid';
      viewHistory.style.display = 'none';
      renderPOSProductGrid();
    });

    tabHistory.addEventListener('click', () => {
      tabHistory.classList.add('active');
      tabPos.classList.remove('active');
      viewPos.style.display = 'none';
      viewHistory.style.display = 'block';
      renderSalesHistory();
    });
  }
}

// ==========================================================================
// 2. POS PRODUCT CATALOG & CATEGORY PILLS
// ==========================================================================
function renderCategoryPills() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  const categories = GMS_Store.getCategories();
  container.innerHTML = `
    <button class="category-pill active" onclick="filterPOSCategory('ALL', this)">All Items</button>
    ${categories.map(c => `
      <button class="category-pill" onclick="filterPOSCategory('${c.name}', this)">
        ${c.icon} ${c.name}
      </button>
    `).join('')}
  `;
}

function filterPOSCategory(catName, btnElem) {
  activeCategoryFilter = catName;
  document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
  if (btnElem) btnElem.classList.add('active');
  renderPOSProductGrid();
}

function renderPOSProductGrid() {
  const container = document.getElementById('pos-products-grid');
  if (!container) return;

  const query = (document.getElementById('pos-search-input')?.value || '').toLowerCase().trim();
  const products = GMS_Store.getProducts();

  const filtered = products.filter(p => {
    const matchCat = activeCategoryFilter === 'ALL' || p.category === activeCategoryFilter;
    const matchQuery = p.name.toLowerCase().includes(query) || p.barcode.includes(query);
    return matchCat && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 32px; color: var(--text-muted);">
        No products found in this category.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const status = GMS_Store.getProductAvailability(p);
    const isOut = status === 'Out of Stock';
    const isLow = status === 'Low Stock';
    const unitDisplay = p.unit ? (/^\d/.test(p.unit) ? p.unit : `1 ${p.unit}`) : '1 pcs';
    const badgeBg = isOut ? 'var(--danger)' : (isLow ? 'var(--warning)' : 'var(--primary)');
    return `
      <div class="pos-item-card ${isOut ? 'out-of-stock' : ''}" onclick="addToCart('${p.id}')">
        <div class="pos-item-icon">📦</div>
        <div>
          <div class="pos-item-name">${p.name}</div>
          <div class="pos-item-price">${formatCurrency(p.sellPrice)} <span style="font-size:0.75rem; font-weight:normal; opacity:0.85;">/ ${unitDisplay}</span></div>
          <div class="pos-item-stock">
            ${isOut ? '0 ' + p.unit + ' available' : `${p.stock} ${p.unit} available`}
          </div>
          <div style="margin-top:6px;"><span class="pos-status-badge" style="background:${badgeBg};">${status}</span></div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// 3. LIVE CART & BILL REGISTER
// ==========================================================================
function loadCustomerDropdown() {
  const select = document.getElementById('pos-customer-select');
  if (!select) return;

  const customers = GMS_Store.getCustomers();
  select.innerHTML = customers.map(c => `
    <option value="${c.name}">${c.name} ${c.phone !== 'N/A' ? `(${c.phone})` : ''}</option>
  `).join('');
}

function addToCart(productId, qtyToAdd = 1) {
  // Always validate against the LATEST stored stock (not a cached copy).
  const check = validateStock(productId, qtyToAdd);
  const products = GMS_Store.getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  const existing = cart.find(item => item.productId === productId);
  const wanted = (existing ? existing.qty : 0) + qtyToAdd;
  const recheck = validateStock(productId, wanted);
  if (!recheck.ok) {
    showToast(recheck.message, 'danger');
    return;
  }
  void check;

  if (existing) {
    // Case 3: same product added twice -> merge into one cart line.
    existing.qty = wanted;
  } else {
    cart.push({
      productId: prod.id,
      name: prod.name,
      price: prod.sellPrice,   // unit_price frozen at add time; re-frozen at checkout
      qty: qtyToAdd,
      unit: prod.unit
    });
  }

  renderCart();
}

function updateCartQty(index, delta) {
  const item = cart[index];
  if (!item) return;
  setCartQty(index, item.qty + delta);
}

// Manual quantity edits (typing a number) go through the same fresh-stock check.
function setCartQty(index, newQty) {
  const item = cart[index];
  if (!item) return;
  const qty = Math.floor(Number(newQty));
  if (isNaN(qty) || qty <= 0) {
    cart.splice(index, 1);
    renderCart();
    return;
  }
  const check = validateStock(item.productId, qty);
  if (!check.ok) {
    showToast(check.message, 'warning');
    renderCart(); // reset the typed value to the last valid qty
    return;
  }
  item.qty = qty;
  renderCart();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items-container');
  const countBadge = document.getElementById('cart-badge-count');
  if (countBadge) countBadge.textContent = cart.reduce((sum, i) => sum + i.qty, 0);

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 16px; color: var(--text-muted);">
        <span style="font-size: 2rem;">🛒</span>
        <p style="margin-top: 8px; font-size: 0.85rem;">Cart is empty. Click any item on the left to add.</p>
      </div>
    `;
    recalcCartTotals();
    return;
  }

  container.innerHTML = cart.map((item, idx) => `
    <div class="cart-item-row" title="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-unit-price">${formatCurrency(item.price)} / ${item.unit}</div>
      </div>
      <div class="cart-qty-stepper">
        <button class="qty-btn" onclick="updateCartQty(${idx}, -1)">-</button>
        <input class="qty-input" type="number" min="1" value="${item.qty}" onchange="setCartQty(${idx}, this.value)" aria-label="Quantity for ${item.name}">
        <button class="qty-btn" onclick="updateCartQty(${idx}, 1)">+</button>
      </div>
      <div class="cart-item-unit">${item.unit}</div>
      <div class="cart-item-total">${formatCurrency(calculateSubtotal(item.qty, item.price))}</div>
      <button class="btn-remove-row" style="font-size: 0.9rem;" onclick="removeCartItem(${idx})">✕</button>
    </div>
  `).join('');

  recalcCartTotals();
}

function recalcCartTotals() {
  const subtotal = calculateCartTotal(cart);
  const discountInput = document.getElementById('pos-discount');
  const discount = Math.min(subtotal, parseFloat(discountInput?.value) || 0);
  const grandTotal = Math.max(0, subtotal - discount);

  const subtotalEl = document.getElementById('pos-subtotal');
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

  const grandTotalEl = document.getElementById('pos-grand-total');
  if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);

  const paidInput = document.getElementById('pos-paid-amount');
  if (paidInput && (!paidInput.value || parseFloat(paidInput.value) === 0)) {
    paidInput.value = grandTotal;
  }

  const paidVal = parseFloat(paidInput?.value) || 0;
  const changeVal = Math.max(0, paidVal - grandTotal);
  
  const changeEl = document.getElementById('pos-change-return');
  if (changeEl) changeEl.textContent = formatCurrency(changeVal);
}

function setupPOSListeners() {
  const searchInput = document.getElementById('pos-search-input');
  if (searchInput) searchInput.addEventListener('input', renderPOSProductGrid);

  const discountInput = document.getElementById('pos-discount');
  if (discountInput) discountInput.addEventListener('input', recalcCartTotals);

  const paidInput = document.getElementById('pos-paid-amount');
  if (paidInput) paidInput.addEventListener('input', recalcCartTotals);

  // Method selector buttons
  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPaymentMethod = btn.getAttribute('data-method');
    });
  });
}

// ==========================================================================
// 4. COMPLETE SALE (transaction-like: validate -> create -> commit / rollback)
//    Conceptual SQL equivalent:
//      START TRANSACTION;
//        INSERT INTO Sale ...; INSERT INTO SaleItem ...;
//        UPDATE Product SET stock = stock - qty ...;
//      COMMIT;  -- on any failure: ROLLBACK;
//    localStorage has no real transactions, so we snapshot the three affected
//    collections first and restore them if any step fails (closest safe equivalent).
// ==========================================================================
function handleCompleteSale() {
  if (cart.length === 0) {
    showToast('Cannot checkout with an empty cart!', 'warning');
    return;
  }

  // --- STEP 1: validate customer (optional; walk-in allowed, no junk records) ---
  const customerName = document.getElementById('pos-customer-select').value || 'Walk-in Customer';
  const customer = GMS_Store.findCustomerByName(customerName);
  const isWalkIn = !customer || customer.name === 'Walk-in Customer';

  // --- STEP 2 + 3: validate cart + re-check LATEST stock (final gate) ---
  const latestProducts = GMS_Store.getProducts();
  for (const item of cart) {
    const prod = latestProducts.find(p => p.id === item.productId);
    if (!prod) {
      showToast(`"${item.name}" no longer exists. Remove it from the cart.`, 'danger');
      return;
    }
    // Re-freeze the price display to latest sell price BEFORE charging? No:
    // keep the price captured when added (spec Case 4 needs old receipts stable),
    // but stock must always be the latest value.
    if (Number(prod.stock) <= 0) {
      showToast(`"${prod.name}" just went out of stock. Remove it from the cart.`, 'danger');
      renderPOSProductGrid();
      renderCart();
      return;
    }
    if (Number(item.qty) > Number(prod.stock)) {
      showToast(`Insufficient stock. Only ${prod.stock} ${prod.unit} of ${prod.name} is available.`, 'danger');
      return;
    }
  }

  const subtotal = calculateCartTotal(cart);
  const discount = Math.min(subtotal, parseFloat(document.getElementById('pos-discount')?.value) || 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const paid = parseFloat(document.getElementById('pos-paid-amount')?.value);
  const paidAmount = isNaN(paid) ? grandTotal : paid;
  if (paidAmount < grandTotal) {
    showToast(`Paid amount (৳${paidAmount}) is less than total (৳${grandTotal}).`, 'warning');
    return;
  }
  const due = Math.max(0, grandTotal - paidAmount);

  // --- Snapshots for ROLLBACK ---
  const snapSales = JSON.stringify(GMS_Store.getSales());
  const snapProducts = JSON.stringify(GMS_Store.getProducts());
  const snapCustomers = JSON.stringify(GMS_Store.getCustomers());

  try {
    // --- STEP 4 + 5: create Sale + SaleItems (DB-ready shape, legacy keys kept) ---
    const invoiceNo = GMS_Store.generateInvoiceNumber();
    const saleId = GMS_Store.getNextSaleId();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const saleRecord = {
      saleId,                    // internal numeric PK (new, DB-friendly)
      invoiceNo,                 // human-readable invoice (new, DB-friendly)
      id: invoiceNo,             // legacy key kept so history/receipt lookups keep working
      date: dateStr,
      sale_date: now.toISOString(),
      customerId: isWalkIn ? null : customer.id,
      customer: isWalkIn ? 'Walk-in Customer' : customer.name,
      customerPhone: isWalkIn ? '' : (customer.phone || ''),
      customerEmail: isWalkIn ? '' : (customer.email || ''),
      items: cart.map((i, n) => ({
        sale_item_id: saleId + '-' + (n + 1),
        product_id: i.productId,   // FK -> Product (no duplicated product info)
        productId: i.productId,    // legacy alias
        name: i.name,
        quantity: i.qty,
        qty: i.qty,                // legacy alias
        unit: i.unit,
        unit_price: i.price,       // frozen at sale time (Case 4: old receipts stay correct)
        price: i.price,            // legacy alias
        subtotal: calculateSubtotal(i.qty, i.price),
        total: calculateSubtotal(i.qty, i.price) // legacy alias
      })),
      subtotal,
      discount,
      tax: 0,
      total: grandTotal,
      paid: paidAmount,
      due,
      method: selectedPaymentMethod,   // Cash today; column ready for future methods
      payment_method: selectedPaymentMethod,
      status: due > 0 ? 'Partial' : 'Completed'
    };

    // --- STEP 6: decrease product stock (automatic, cashier does nothing manual) ---
    let products = GMS_Store.getProducts();
    cart.forEach(cartItem => {
      products = products.map(p => {
        if (p.id === cartItem.productId) {
          const next = Number(p.stock) - Number(cartItem.qty);
          if (next < 0) throw new Error(`Insufficient stock. Only ${p.stock} ${p.unit} of ${p.name} is available.`);
          return { ...p, stock: next };
        }
        return p;
      });
    });

    // --- STEP 7 + 8: persist sale + stock + due linkage, log STOCK_OUT movements ---
    const sales = GMS_Store.getSales();
    sales.unshift(saleRecord);
    GMS_Store.set(GMS_Store.KEYS.SALES, sales);
    GMS_Store.set(GMS_Store.KEYS.PRODUCTS, products);

    cart.forEach(cartItem => {
      GMS_Store.logInventoryMovement({
        type: 'STOCK_OUT',
        productId: cartItem.productId,
        productName: cartItem.name,
        qty: `-${cartItem.qty} ${cartItem.unit}`,
        note: 'Customer Sale',
        ref: invoiceNo
      });
    });

    if (due > 0 && !isWalkIn) {
      const customers = GMS_Store.getCustomers().map(c => {
        if (c.id === customer.id) return { ...c, due: (Number(c.due) || 0) + due };
        return c;
      });
      GMS_Store.set(GMS_Store.KEYS.CUSTOMERS, customers);
    }

    // --- STEP 9 + 10: receipt + COMMIT (clear cart, refresh) ---
    showToast(`Sale #${invoiceNo} completed!`, 'success');
    const completedCartCount = cart.length;
    void completedCartCount;
    cart = [];
    renderCart();
    renderPOSProductGrid();
    renderThermalReceipt(saleRecord);
  } catch (err) {
    // --- ROLLBACK: restore every collection, save nothing partial ---
    GMS_Store.set(GMS_Store.KEYS.SALES, JSON.parse(snapSales));
    GMS_Store.set(GMS_Store.KEYS.PRODUCTS, JSON.parse(snapProducts));
    GMS_Store.set(GMS_Store.KEYS.CUSTOMERS, JSON.parse(snapCustomers));
    showToast('Sale failed and was rolled back. ' + (err && err.message ? err.message : ''), 'danger');
  }
}

// ==========================================================================
// 5. THERMAL INVOICE / RECEIPT MODAL
// ==========================================================================
function renderThermalReceipt(sale) {
  const container = document.getElementById('thermal-receipt-content');
  if (!container) return;

  const invoiceNo = sale.invoiceNo || sale.id;
  // Snapshot contact at sale time; fall back to live customer record (safe if deleted -> blank).
  const linked = sale.customer && sale.customer !== 'Walk-in Customer' ? GMS_Store.findCustomerByName(sale.customer) : null;
  const custName = sale.customer || 'Walk-in Customer';
  const custPhone = sale.customerPhone || (linked ? linked.phone : '') || '';
  const custEmail = sale.customerEmail || (linked ? linked.email : '') || '';
  const showPhone = custPhone && custPhone !== 'N/A' ? custPhone : '';
  const showEmail = custEmail && custEmail !== 'N/A' ? custEmail : '';

  container.innerHTML = `
    <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 12px;">
      <h2 style="font-size: 1.3rem; margin: 0; text-transform: uppercase;">FreshMart Grocery</h2>
      <p style="font-size: 0.75rem; margin: 2px 0;">House #12, Road #4, Dhanmondi, Dhaka</p>
      <p style="font-size: 0.75rem; margin: 0;">Tel: 01700-112233 • VAT: 99182736</p>
      <p style="font-size: 0.8rem; font-weight: bold; margin: 6px 0 0;">Sales Receipt</p>
    </div>

    <div style="font-size: 0.8rem; margin-bottom: 12px;">
      <div><strong>Invoice No:</strong> ${invoiceNo}</div>
      <div><strong>Date:</strong> ${sale.date}</div>
      <div><strong>Customer:</strong> ${custName}</div>
      ${showPhone ? `<div><strong>Mobile:</strong> ${showPhone}</div>` : ''}
      ${showEmail ? `<div><strong>Email:</strong> ${showEmail}</div>` : ''}
      <div><strong>Payment:</strong> ${sale.method}</div>
    </div>

    <table style="width: 100%; font-size: 0.8rem; border-collapse: collapse; margin-bottom: 12px;">
      <thead>
        <tr style="border-bottom: 1px dashed #000; text-align: left;">
          <th style="padding: 4px 0;">Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items.map(it => {
          const qty = it.quantity ?? it.qty;
          const unit = it.unit ? ' ' + it.unit : '';
          const price = it.unit_price ?? it.price;
          const sub = it.subtotal ?? it.total ?? (qty * price);
          return `
          <tr>
            <td style="padding: 4px 0;">${it.name}</td>
            <td style="text-align: center;">${qty}${unit} × ৳${price}</td>
            <td style="text-align: right;">৳${price}</td>
            <td style="text-align: right;">৳${sub}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div style="border-top: 1px dashed #000; padding-top: 8px; font-size: 0.85rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Subtotal:</span>
        <span>৳${sale.subtotal}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span>Discount:</span>
        <span>-৳${sale.discount || 0}</span>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px;">
        <span>Grand Total:</span>
        <span>৳${sale.total}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 4px;">
        <span>Paid Amount:</span>
        <span>৳${sale.paid}</span>
      </div>
      ${sale.due > 0 ? `
        <div style="display: flex; justify-content: space-between; color: red; font-weight: bold;">
          <span>Due Balance:</span>
          <span>৳${sale.due}</span>
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin-top: 16px; border-top: 2px dashed #000; padding-top: 12px; font-size: 0.72rem;">
      *** THANK YOU FOR YOUR SHOPPING ***<br>
      Goods once sold can be exchanged within 24h with receipt.
    </div>
  `;

  openModal('sale-receipt-modal');
}

// ==========================================================================
// 6. SALES HISTORY TAB LOGIC
// ==========================================================================
function renderSalesHistory() {
  const tbody = document.getElementById('sales-history-tbody');
  if (!tbody) return;

  const sales = GMS_Store.getSales();
  const query = (document.getElementById('history-search-input')?.value || '').toLowerCase().trim();

  const filtered = sales.filter(s => {
    const inv = (s.invoiceNo || s.id || '').toLowerCase();
    return inv.includes(query) ||
      (s.customer || '').toLowerCase().includes(query) ||
      (s.date || '').toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
          No sales transactions recorded matching your search.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const inv = s.invoiceNo || s.id;
    const itemCount = s.items ? s.items.reduce((n, it) => n + Number(it.quantity ?? it.qty ?? 1), 0) : 1;
    const lineCount = s.items ? s.items.length : 1;
    return `
    <tr>
      <td><strong style="color: var(--primary);">${inv}</strong></td>
      <td>${s.date}</td>
      <td><strong>${s.customer}</strong></td>
      <td><span class="badge badge-gray">${lineCount} items (${itemCount} qty)</span></td>
      <td><strong>${formatCurrency(s.total)}</strong></td>
      <td><span class="badge ${s.method === 'Cash' ? 'badge-success' : 'badge-purple'}">${s.method}</span></td>
      <td>
        <button class="action-btn" title="View & Print Receipt" onclick="viewHistoryInvoice('${inv}')">👁️</button>
        <button class="action-btn delete" title="Delete Sale" onclick="deleteSale('${inv}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

function findSaleByInvoice(inv) {
  const sales = GMS_Store.getSales();
  return sales.find(s => (s.invoiceNo || s.id) === inv) || sales.find(s => s.id === inv);
}

function viewHistoryInvoice(saleId) {
  const sale = findSaleByInvoice(saleId);
  if (sale) renderThermalReceipt(sale);
}

function deleteSale(saleId) {
  if (confirm(`Are you sure you want to remove sale record "${saleId}"? Stock will NOT be restored.`)) {
    const sales = GMS_Store.getSales().filter(s => (s.invoiceNo || s.id) !== saleId && s.id !== saleId);
    GMS_Store.set(GMS_Store.KEYS.SALES, sales);
    showToast(`Invoice ${saleId} deleted.`, 'info');
    renderSalesHistory();
  }
}

// Quick customer registration from inside POS (name/mobile/email all optional;
// walk-in checkout stays possible without creating any record).
function openQuickCustomerModal() {
  const form = document.getElementById('quick-customer-form');
  if (form) form.reset();
  openModal('quick-customer-modal');
}

function handleSaveQuickCustomer(e) {
  e.preventDefault();
  const name = document.getElementById('quick-cust-name').value.trim();
  const phone = document.getElementById('quick-cust-phone').value.trim();
  const email = document.getElementById('quick-cust-email').value.trim();
  if (!name && !phone && !email) {
    showToast('Enter at least a name, mobile, or email — or use Walk-in Customer.', 'warning');
    return;
  }
  const customers = GMS_Store.getCustomers();
  const newId = 'CUST' + String(customers.length + 1).padStart(2, '0');
  const label = name || ('Customer ' + phone) || 'New Customer';
  customers.push({ id: newId, name: label, phone: phone || 'N/A', email: email || 'N/A', due: 0 });
  GMS_Store.set(GMS_Store.KEYS.CUSTOMERS, customers);
  loadCustomerDropdown();
  document.getElementById('pos-customer-select').value = label;
  closeModal('quick-customer-modal');
  showToast(`Customer "${label}" added and selected!`, 'success');
}
