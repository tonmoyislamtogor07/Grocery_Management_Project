/**
 * GROCERY MANAGEMENT SYSTEM - CATEGORIES LOGIC (Pure Vanilla JavaScript)
 * Full CRUD, product count linkage, and Products-by-Category view.
 */

let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', () => {
  renderCategories();

  const searchInput = document.getElementById('category-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      renderCategories(q);
    });
  }
});

// ==========================================================================
// 1. RENDER CATEGORIES CARDS
// ==========================================================================
function renderCategories(filterQuery = '') {
  const container = document.getElementById('categories-container');
  if (!container) return;

  const categories = GMS_Store.getCategories();
  const products = GMS_Store.getProducts();

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(filterQuery) ||
    (c.description && c.description.toLowerCase().includes(filterQuery))
  );

  const totalCatCountEl = document.getElementById('total-categories-count');
  if (totalCatCountEl) totalCatCountEl.textContent = categories.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: #fff; border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <span style="font-size: 2.5rem;">📂</span>
        <h3 style="margin-top: 12px; color: var(--text-main);">No Categories Found</h3>
        <p style="color: var(--text-muted); font-size: 0.88rem;">Try adjusting your search query or click "Add Category" above.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(cat => {
    // Count linked products
    const linkedProducts = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase());
    const count = linkedProducts.length;

    return `
      <div class="category-card">
        <div class="category-card-top">
          <div class="category-icon-box">${cat.icon || '📁'}</div>
          <div class="category-menu-actions">
            <button class="action-btn" title="Edit Category" onclick="openEditCategoryModal('${cat.id}')">✏️</button>
            <button class="action-btn delete" title="Delete Category" onclick="deleteCategory('${cat.id}')">🗑️</button>
          </div>
        </div>

        <h3 class="category-title">${cat.name}</h3>
        <p class="category-desc">${cat.description || 'All items and grocery products under this classification.'}</p>

        <div class="category-card-bottom">
          <span class="product-count-chip">📦 ${count} ${count === 1 ? 'Product' : 'Products'}</span>
          <button class="view-products-btn" onclick="viewProductsByCategory('${cat.name}', '${cat.icon || '📁'}')">
            View Items →
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// 2. ADD & EDIT CATEGORY MODAL
// ==========================================================================
function openAddCategoryModal() {
  editingCategoryId = null;
  document.getElementById('category-modal-title').textContent = 'Add New Grocery Category';
  document.getElementById('category-form').reset();
  openModal('category-form-modal');
}

function openEditCategoryModal(catId) {
  const categories = GMS_Store.getCategories();
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;

  editingCategoryId = catId;
  document.getElementById('category-modal-title').textContent = `Edit: ${cat.name}`;
  document.getElementById('cat-name').value = cat.name;
  document.getElementById('cat-icon').value = cat.icon || '📦';
  document.getElementById('cat-desc').value = cat.description || '';

  openModal('category-form-modal');
}

function handleSaveCategory(e) {
  e.preventDefault();

  const name = document.getElementById('cat-name').value.trim();
  const icon = document.getElementById('cat-icon').value.trim() || '📦';
  const description = document.getElementById('cat-desc').value.trim();

  if (!name) {
    showToast('Category name is required.', 'danger');
    return;
  }

  let categories = GMS_Store.getCategories();

  if (editingCategoryId) {
    categories = categories.map(c => {
      if (c.id === editingCategoryId) {
        return { ...c, name, icon, description };
      }
      return c;
    });
    showToast(`Category "${name}" updated!`, 'success');
  } else {
    const newId = 'CAT' + String(categories.length + 1).padStart(2, '0');
    categories.push({ id: newId, name, icon, description });
    showToast(`Category "${name}" added successfully!`, 'success');
  }

  GMS_Store.set(GMS_Store.KEYS.CATEGORIES, categories);
  closeModal('category-form-modal');
  renderCategories();
}

// ==========================================================================
// 3. DELETE CATEGORY
// ==========================================================================
function deleteCategory(catId) {
  const categories = GMS_Store.getCategories();
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;

  const products = GMS_Store.getProducts();
  const linkedCount = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;

  if (linkedCount > 0) {
    if (!confirm(`Warning: There are ${linkedCount} product(s) linked to "${cat.name}". Are you sure you want to delete this category?`)) {
      return;
    }
  } else {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
  }

  const updated = categories.filter(c => c.id !== catId);
  GMS_Store.set(GMS_Store.KEYS.CATEGORIES, updated);
  showToast(`Category "${cat.name}" deleted.`, 'info');
  renderCategories();
}

// ==========================================================================
// 4. VIEW PRODUCTS BY CATEGORY
// ==========================================================================
function viewProductsByCategory(categoryName, categoryIcon) {
  const products = GMS_Store.getProducts();
  const categoryProducts = products.filter(p => p.category.toLowerCase() === categoryName.toLowerCase());

  document.getElementById('cat-products-title').textContent = `${categoryIcon} ${categoryName}`;
  const countEl = document.getElementById('cat-products-count');
  if (countEl) countEl.textContent = `${categoryProducts.length} items found`;

  const tbody = document.getElementById('cat-products-tbody');
  if (!tbody) return;

  if (categoryProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">
          No products currently assigned to this category.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = categoryProducts.map(p => `
      <tr>
        <td>
          <strong style="color: var(--text-main);">${p.name}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${p.barcode}</div>
        </td>
        <td><strong>${formatCurrency(p.sellPrice)}</strong></td>
        <td>
          <span class="badge ${p.stock <= 0 ? 'badge-danger' : (p.stock <= GMS_Store.getLowThreshold(p) ? 'badge-warning' : 'badge-success')}">
            ${p.stock} ${p.unit}
          </span>
        </td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${p.expiry}</td>
        <td>
          <a href="products.html" class="quick-btn" style="padding: 4px 10px; font-size: 0.75rem;">Manage ↗</a>
        </td>
      </tr>
    `).join('');
  }

  openModal('category-products-modal');
}
