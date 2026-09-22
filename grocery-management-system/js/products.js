/**
 * GROCERY MANAGEMENT SYSTEM - PRODUCTS LOGIC (Pure Vanilla JavaScript)
 * Zero external libraries. Full CRUD, search, and filtering.
 */

let activeProducts = [];
let editingProductId = null;

// Product category emoji mapper
const categoryIcons = {
  'Grains & Pulses': '🌾',
  'Dairy & Eggs': '🥛',
  'Oils & Ghee': '🛢️',
  'Spices & Seasoning': '🌶️',
  'Beverages & Tea': '☕',
  'Snacks & Bakery': '🍪',
  'Household & Cleaning': '🧼'
};

document.addEventListener('DOMContentLoaded', () => {
  loadCategoryDropdowns();
  refreshProductTable();
  setupFilterListeners();
});

// ==========================================================================
// 1. POPULATE CATEGORIES IN FILTER & MODAL
// ==========================================================================
function loadCategoryDropdowns() {
  const categories = GMS_Store.getCategories();
  
  const filterSelect = document.getElementById('category-filter');
  const modalSelect = document.getElementById('prod-category');

  if (filterSelect) {
    filterSelect.innerHTML = `<option value="ALL">All Categories (${categories.length})</option>` +
      categories.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  }

  if (modalSelect) {
    modalSelect.innerHTML = categories.map(c => `<option value="${c.name}">${c.icon} ${c.name}</option>`).join('');
  }
}

// ==========================================================================
// 2. REFRESH PRODUCT TABLE & STAT CHIPS
// ==========================================================================
function refreshProductTable() {
  activeProducts = GMS_Store.getProducts();
  applyFilters();
  updateProductStats();
}

function updateProductStats() {
  const products = GMS_Store.getProducts();
  const totalCount = products.length;
  const inStockCount = products.filter(p => p.stock > GMS_Store.getLowThreshold(p)).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= GMS_Store.getLowThreshold(p)).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);

  const totalEl = document.getElementById('stat-total-products');
  if (totalEl) totalEl.textContent = totalCount;

  const inStockEl = document.getElementById('stat-instock');
  if (inStockEl) inStockEl.textContent = inStockCount;

  const lowStockEl = document.getElementById('stat-lowstock');
  if (lowStockEl) lowStockEl.textContent = `${lowStockCount} (Out: ${outOfStockCount})`;

  const valueEl = document.getElementById('stat-inventory-val');
  if (valueEl) valueEl.textContent = formatCurrency(totalValue);
}

// ==========================================================================
// 3. SEARCH & FILTERS
// ==========================================================================
function setupFilterListeners() {
  const searchInput = document.getElementById('product-search');
  const categoryFilter = document.getElementById('category-filter');
  const stockFilter = document.getElementById('stock-filter');

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
  if (stockFilter) stockFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
  const query = (document.getElementById('product-search')?.value || '').toLowerCase().trim();
  const selectedCategory = document.getElementById('category-filter')?.value || 'ALL';
  const selectedStock = document.getElementById('stock-filter')?.value || 'ALL';

  const filtered = activeProducts.filter(item => {
    // Search query match
    const matchSearch = item.name.toLowerCase().includes(query) ||
                        item.barcode.includes(query) ||
                        item.id.toLowerCase().includes(query);

    // Category filter match
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    // Stock filter match (per-product low-stock threshold)
    let matchStock = true;
    if (selectedStock === 'INSTOCK') matchStock = item.stock > GMS_Store.getLowThreshold(item);
    else if (selectedStock === 'LOW') matchStock = item.stock > 0 && item.stock <= GMS_Store.getLowThreshold(item);
    else if (selectedStock === 'OUT') matchStock = item.stock <= 0;

    return matchSearch && matchCategory && matchStock;
  });

  renderTableRows(filtered);
}

function renderTableRows(items) {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
          🔍 No products found matching your search or filter.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = items.map(p => {
    const margin = Math.round(((p.sellPrice - p.buyPrice) / p.buyPrice) * 100);
    const icon = categoryIcons[p.category] || '📦';
    
    let stockBadgeClass = 'badge-success';
    let stockLabel = `${p.stock} ${p.unit}`;
    const threshold = GMS_Store.getLowThreshold(p);
    if (p.stock <= 0) {
      stockBadgeClass = 'badge-danger';
      stockLabel = 'Out of Stock (0)';
    } else if (p.stock <= threshold) {
      stockBadgeClass = 'badge-warning';
      stockLabel = `Low (${p.stock} ${p.unit})`;
    }

    const unitDisplay = p.unit ? (/^\d/.test(p.unit) ? p.unit : `1 ${p.unit}`) : '1 pcs';

    return `
      <tr>
        <td>
          <span class="barcode-tag">${p.barcode}</span>
        </td>
        <td>
          <div class="product-item-cell">
            <div class="product-icon-avatar">${icon}</div>
            <div>
              <div class="product-name-txt">${p.name}</div>
              <div class="product-category-txt">${p.category}</div>
            </div>
          </div>
        </td>
        <td>
          <div><strong>${formatCurrency(p.sellPrice)}</strong> <span style="font-size: 0.75rem; color: var(--text-muted);">/ ${unitDisplay}</span></div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Buy: ${formatCurrency(p.buyPrice)}</div>
          <span class="margin-badge">+${margin}% Margin</span>
        </td>
        <td>
          <span class="badge ${stockBadgeClass}">${stockLabel}</span>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Low at ≤ ${threshold} ${p.unit} • ${formatCurrency(p.sellPrice)}/ ${p.unit}</div>
        </td>
        <td>
          <span style="font-size: 0.85rem; color: var(--text-main);">${p.expiry}</span>
        </td>
        <td>
          <button class="action-btn" title="View Details" onclick="viewProductDetails('${p.id}')">👁️</button>
          <button class="action-btn" title="Edit Product" onclick="openEditProductModal('${p.id}')">✏️</button>
          <button class="action-btn delete" title="Delete Product" onclick="deleteProduct('${p.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 4. ADD & EDIT PRODUCT MODAL HANDLERS
// ==========================================================================
function openAddProductModal() {
  editingProductId = null;
  document.getElementById('product-modal-title').textContent = 'Add New Grocery Product';
  document.getElementById('product-form').reset();
  
  // Auto generate random barcode
  const randomBarcode = '8941' + Math.floor(1000 + Math.random() * 9000);
  document.getElementById('prod-barcode').value = randomBarcode;
  
  openModal('product-form-modal');
}

function openEditProductModal(productId) {
  const products = GMS_Store.getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  editingProductId = productId;
  document.getElementById('product-modal-title').textContent = `Edit: ${product.name}`;
  
  document.getElementById('prod-name').value = product.name;
  document.getElementById('prod-barcode').value = product.barcode;
  document.getElementById('prod-category').value = product.category;
  document.getElementById('prod-buy-price').value = product.buyPrice;
  document.getElementById('prod-sell-price').value = product.sellPrice;
  document.getElementById('prod-stock').value = product.stock;
  document.getElementById('prod-unit').value = product.unit;
  document.getElementById('prod-expiry').value = product.expiry;
  document.getElementById('prod-threshold').value = GMS_Store.getLowThreshold(product);

  openModal('product-form-modal');
}

function handleSaveProduct(e) {
  e.preventDefault();

  const name = document.getElementById('prod-name').value.trim();
  const barcode = document.getElementById('prod-barcode').value.trim();
  const category = document.getElementById('prod-category').value;
  const buyPrice = parseFloat(document.getElementById('prod-buy-price').value);
  const sellPrice = parseFloat(document.getElementById('prod-sell-price').value);
  const stock = parseInt(document.getElementById('prod-stock').value, 10);
  const unit = document.getElementById('prod-unit').value.trim();
  const expiry = document.getElementById('prod-expiry').value;
  const lowThreshold = Math.max(0, parseInt(document.getElementById('prod-threshold').value, 10) || 0);

  if (!name || isNaN(buyPrice) || isNaN(sellPrice) || isNaN(stock)) {
    showToast('Please fill all required numeric and text fields correctly.', 'danger');
    return;
  }

  let products = GMS_Store.getProducts();

  if (editingProductId) {
    // Edit existing product
    products = products.map(p => {
      if (p.id === editingProductId) {
        return { ...p, name, barcode, category, buyPrice, sellPrice, stock, unit, expiry, lowThreshold };
      }
      return p;
    });
    showToast(`"${name}" updated successfully!`, 'success');
  } else {
    // Create new product
    const newId = 'PROD' + String(products.length + 1).padStart(2, '0');
    const newProduct = {
      id: newId,
      barcode: barcode || '8941' + Math.floor(1000 + Math.random() * 9000),
      name,
      category,
      buyPrice,
      sellPrice,
      stock,
      unit: unit || 'pcs',
      lowThreshold,
      expiry: expiry || '2027-12-31'
    };
    products.unshift(newProduct);
    showToast(`New item "${name}" added to inventory!`, 'success');
  }

  GMS_Store.set(GMS_Store.KEYS.PRODUCTS, products);
  closeModal('product-form-modal');
  refreshProductTable();
}

// ==========================================================================
// 5. VIEW DETAILS MODAL
// ==========================================================================
function viewProductDetails(productId) {
  const products = GMS_Store.getProducts();
  const p = products.find(prod => prod.id === productId);
  if (!p) return;

  const modalBody = document.getElementById('product-details-body');
  const icon = categoryIcons[p.category] || '📦';
  const marginAmt = p.sellPrice - p.buyPrice;
  const marginPct = Math.round((marginAmt / p.buyPrice) * 100);
  const unitDisplay = p.unit ? (/^\d/.test(p.unit) ? p.unit : `1 ${p.unit}`) : '1 pcs';

  modalBody.innerHTML = `
    <div class="product-detail-hero">
      <div class="product-detail-icon">${icon}</div>
      <div>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">${p.name}</h3>
        <span class="badge badge-purple">${p.category}</span>
        <span class="barcode-tag" style="margin-left: 8px;">Barcode: ${p.barcode}</span>
      </div>
    </div>

    <div class="product-detail-grid">
      <div class="detail-info-box">
        <div class="label">Product Code (SKU)</div>
        <div class="val">${p.id}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Current Stock</div>
        <div class="val" style="color: ${p.stock <= GMS_Store.getLowThreshold(p) ? 'var(--danger)' : 'var(--primary)'};">
          ${p.stock} ${p.unit}
        </div>
      </div>
      <div class="detail-info-box">
        <div class="label">Purchase Cost</div>
        <div class="val">${formatCurrency(p.buyPrice)}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Selling Price</div>
        <div class="val">${formatCurrency(p.sellPrice)} / ${unitDisplay}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Estimated Profit Margin</div>
        <div class="val" style="color: var(--primary);">+${formatCurrency(marginAmt)} (${marginPct}%)</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Price per Unit</div>
        <div class="val">${formatCurrency(p.sellPrice)} / ${unitDisplay}</div>
      </div>
      <div class="detail-info-box">
        <div class="label">Low Stock Threshold</div>
        <div class="val">⚠️ ${GMS_Store.getLowThreshold(p)} ${p.unit}</div>
      </div>
      <div class="detail-info-box" style="grid-column: span 2;">
        <div class="label">Product Expiry Date</div>
        <div class="val">🗓️ ${p.expiry}</div>
      </div>
    </div>
  `;

  openModal('product-details-modal');
}

// ==========================================================================
// 6. DELETE PRODUCT
// ==========================================================================
function deleteProduct(productId) {
  const products = GMS_Store.getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
    const updated = products.filter(p => p.id !== productId);
    GMS_Store.set(GMS_Store.KEYS.PRODUCTS, updated);
    showToast(`"${product.name}" has been deleted.`, 'info');
    refreshProductTable();
  }
}
