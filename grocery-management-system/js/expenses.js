/**
 * GROCERY MANAGEMENT SYSTEM - EXPENSES LOGIC (Pure Vanilla JavaScript)
 * Full CRUD for store operating expenses, category breakdowns, and totals.
 */

let editingExpenseId = null;

const expenseCategoryIcons = {
  'Utilities': '⚡',
  'Salary': '👨‍💼',
  'Rent': '🏢',
  'Transport': '🚚',
  'Maintenance': '🛠️',
  'Packaging': '🛍️',
  'Misc': '📦'
};

document.addEventListener('DOMContentLoaded', () => {
  renderExpenses();
  updateExpenseStats();
  setupExpenseListeners();
});

// ==========================================================================
// 1. RENDER EXPENSES HISTORY & STATS
// ==========================================================================
function renderExpenses() {
  const tbody = document.getElementById('expenses-tbody');
  if (!tbody) return;

  const expenses = GMS_Store.getExpenses();
  const query = (document.getElementById('expense-search')?.value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('expense-category-filter')?.value || 'ALL';

  const filtered = expenses.filter(e => {
    const matchQuery = e.title.toLowerCase().includes(query) ||
                       (e.note && e.note.toLowerCase().includes(query)) ||
                       e.date.includes(query);
    const matchCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchQuery && matchCategory;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 36px; color: var(--text-muted);">
          No operating expense records found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(e => {
    const icon = expenseCategoryIcons[e.category] || '💸';
    return `
      <tr>
        <td><strong style="color: var(--primary);">${e.id}</strong></td>
        <td>${e.date}</td>
        <td>
          <span class="expense-cat-badge">
            <span>${icon}</span> <span>${e.category}</span>
          </span>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${e.title}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${e.note || 'No additional note'}</div>
        </td>
        <td>
          <strong style="color: var(--danger);">${formatCurrency(e.amount)}</strong>
        </td>
        <td>
          <button class="action-btn" title="Edit Expense" onclick="openEditExpenseModal('${e.id}')">✏️</button>
          <button class="action-btn delete" title="Delete Expense" onclick="deleteExpense('${e.id}')">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateExpenseStats() {
  const expenses = GMS_Store.getExpenses();
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const avgAmount = expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0;

  // Find top expense category
  const catSums = {};
  expenses.forEach(e => {
    catSums[e.category] = (catSums[e.category] || 0) + Number(e.amount || 0);
  });

  let topCategory = 'None';
  let maxCatAmount = 0;
  for (const cat in catSums) {
    if (catSums[cat] > maxCatAmount) {
      maxCatAmount = catSums[cat];
      topCategory = cat;
    }
  }

  document.getElementById('stat-total-expenses').textContent = formatCurrency(totalAmount);
  document.getElementById('stat-avg-expense').textContent = formatCurrency(avgAmount);
  document.getElementById('stat-top-expense-cat').textContent = topCategory;
}

function setupExpenseListeners() {
  document.getElementById('expense-search')?.addEventListener('input', renderExpenses);
  document.getElementById('expense-category-filter')?.addEventListener('change', renderExpenses);
}

// ==========================================================================
// 2. ADD & EDIT EXPENSE MODAL
// ==========================================================================
function openAddExpenseModal() {
  editingExpenseId = null;
  document.getElementById('expense-modal-title').textContent = 'Record Store Expense';
  document.getElementById('expense-form').reset();
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('exp-date').value = today;

  openModal('expense-form-modal');
}

function openEditExpenseModal(expId) {
  const expenses = GMS_Store.getExpenses();
  const exp = expenses.find(e => e.id === expId);
  if (!exp) return;

  editingExpenseId = expId;
  document.getElementById('expense-modal-title').textContent = `Edit Expense: ${exp.title}`;
  document.getElementById('exp-title').value = exp.title;
  document.getElementById('exp-category').value = exp.category;
  document.getElementById('exp-amount').value = exp.amount;
  document.getElementById('exp-date').value = exp.date;
  document.getElementById('exp-note').value = exp.note || '';

  openModal('expense-form-modal');
}

function handleSaveExpense(e) {
  e.preventDefault();

  const title = document.getElementById('exp-title').value.trim();
  const category = document.getElementById('exp-category').value;
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const date = document.getElementById('exp-date').value;
  const note = document.getElementById('exp-note').value.trim();

  if (!title || isNaN(amount) || amount <= 0) {
    showToast('Please provide a valid title and expense amount.', 'warning');
    return;
  }

  let expenses = GMS_Store.getExpenses();

  if (editingExpenseId) {
    expenses = expenses.map(item => {
      if (item.id === editingExpenseId) {
        return { ...item, title, category, amount, date, note };
      }
      return item;
    });
    showToast(`Expense "${title}" updated!`, 'success');
  } else {
    const newId = 'EXP-' + String(expenses.length + 1).padStart(2, '0');
    expenses.unshift({ id: newId, title, category, amount, date, note });
    showToast(`Expense of ৳${amount} recorded!`, 'success');
  }

  GMS_Store.set(GMS_Store.KEYS.EXPENSES, expenses);
  closeModal('expense-form-modal');
  renderExpenses();
  updateExpenseStats();
}

// ==========================================================================
// 3. DELETE EXPENSE
// ==========================================================================
function deleteExpense(expId) {
  if (confirm(`Are you sure you want to delete this expense record?`)) {
    const expenses = GMS_Store.getExpenses().filter(e => e.id !== expId);
    GMS_Store.set(GMS_Store.KEYS.EXPENSES, expenses);
    showToast(`Expense deleted.`, 'info');
    renderExpenses();
    updateExpenseStats();
  }
}
