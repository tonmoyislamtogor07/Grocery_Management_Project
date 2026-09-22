/**
 * GROCERY MANAGEMENT SYSTEM - PAYMENTS LOGIC (Pure Vanilla JavaScript)
 * Unified payment history (Customer Receipts & Supplier Payouts) and Payment Details Voucher.
 */

let allTransactions = [];

document.addEventListener('DOMContentLoaded', () => {
  loadPartyDropdown();
  refreshPaymentsLedger();
  setupPaymentFilters();
});

// ==========================================================================
// 1. AGGREGATE & RENDER PAYMENTS
// ==========================================================================
function refreshPaymentsLedger() {
  const sales = GMS_Store.getSales();
  const purchases = GMS_Store.getPurchases();
  const manualPayments = GMS_Store.get(GMS_Store.KEYS.PAYMENTS);

  allTransactions = [];

  // Inward customer payments from sales
  sales.forEach(s => {
    if (Number(s.paid || s.total) > 0) {
      allTransactions.push({
        id: 'PAY-' + s.id.replace('INV-', ''),
        type: 'INWARD',
        party: s.customer,
        partyType: 'Customer',
        amount: Number(s.paid || s.total),
        method: s.method || 'Cash',
        date: s.date,
        ref: `Invoice ${s.id}`,
        status: 'Success'
      });
    }
  });

  // Outward supplier payouts from purchases
  purchases.forEach(p => {
    if (Number(p.paid || p.total) > 0) {
      allTransactions.push({
        id: 'PAY-' + p.id.replace('PUR-', ''),
        type: 'OUTWARD',
        party: p.supplier,
        partyType: 'Supplier',
        amount: Number(p.paid || p.total),
        method: 'Bank / Cash',
        date: p.date,
        ref: `PO ${p.id}`,
        status: 'Success'
      });
    }
  });

  // Manual payment settlements
  manualPayments.forEach(m => {
    allTransactions.push(m);
  });

  // Sort descending
  allTransactions.sort((a, b) => b.id.localeCompare(a.id));

  updatePaymentStats();
  applyPaymentFilters();
}

function updatePaymentStats() {
  const totalInward = allTransactions
    .filter(t => t.type === 'INWARD')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalOutward = allTransactions
    .filter(t => t.type === 'OUTWARD')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netCash = totalInward - totalOutward;

  document.getElementById('stat-total-inward').textContent = formatCurrency(totalInward);
  document.getElementById('stat-total-outward').textContent = formatCurrency(totalOutward);
  
  const netEl = document.getElementById('stat-net-cash');
  if (netEl) {
    netEl.textContent = formatCurrency(netCash);
    netEl.style.color = netCash >= 0 ? 'var(--primary)' : 'var(--danger)';
  }
}

function setupPaymentFilters() {
  document.getElementById('payment-search')?.addEventListener('input', applyPaymentFilters);
  document.getElementById('payment-type-filter')?.addEventListener('change', applyPaymentFilters);
  document.getElementById('payment-method-filter')?.addEventListener('change', applyPaymentFilters);
}

function applyPaymentFilters() {
  const query = (document.getElementById('payment-search')?.value || '').toLowerCase().trim();
  const typeFilter = document.getElementById('payment-type-filter')?.value || 'ALL';
  const methodFilter = document.getElementById('payment-method-filter')?.value || 'ALL';

  const filtered = allTransactions.filter(t => {
    const matchQuery = t.id.toLowerCase().includes(query) ||
                       t.party.toLowerCase().includes(query) ||
                       t.date.toLowerCase().includes(query);

    const matchType = typeFilter === 'ALL' || t.type === typeFilter;
    const matchMethod = methodFilter === 'ALL' || t.method.toLowerCase().includes(methodFilter.toLowerCase());

    return matchQuery && matchType && matchMethod;
  });

  renderPaymentsTable(filtered);
}

function renderPaymentsTable(transactions) {
  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">
          No payment transactions found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(t => {
    const isInward = t.type === 'INWARD';
    return `
      <tr>
        <td><strong style="color: var(--primary);">${t.id}</strong></td>
        <td>${t.date}</td>
        <td>
          <span class="payment-type-badge ${isInward ? 'inward' : 'outward'}">
            ${isInward ? '↓ Customer Receipt' : '↑ Supplier Payout'}
          </span>
        </td>
        <td>
          <strong>${t.party}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${t.partyType} • ${t.ref || ''}</div>
        </td>
        <td>
          <span class="badge ${t.method === 'Cash' ? 'badge-success' : 'badge-purple'}">${t.method}</span>
        </td>
        <td>
          <strong style="color: ${isInward ? 'var(--primary)' : 'var(--danger)'};">
            ${isInward ? '+' : '-'}${formatCurrency(t.amount)}
          </strong>
        </td>
        <td>
          <button class="action-btn" title="View Voucher" onclick="viewPaymentVoucher('${t.id}')">👁️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 2. PAYMENT DETAILS VOUCHER MODAL
// ==========================================================================
function viewPaymentVoucher(txnId) {
  const txn = allTransactions.find(t => t.id === txnId);
  if (!txn) return;

  const modalBody = document.getElementById('payment-voucher-body');
  const isInward = txn.type === 'INWARD';

  modalBody.innerHTML = `
    <div class="voucher-box">
      <div style="text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 14px;">
        <h2 style="color: var(--primary); font-size: 1.3rem;">FreshMart Grocery</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Official Payment Money Voucher</p>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 12px;">
        <div><strong>Voucher ID:</strong> ${txn.id}</div>
        <div><strong>Date:</strong> ${txn.date}</div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 12px;">
        <div><strong>Party:</strong> ${txn.party} (${txn.partyType})</div>
        <div><strong>Method:</strong> ${txn.method}</div>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 12px;">
        <div><strong>Reference:</strong> ${txn.ref || 'N/A'}</div>
        <div><strong>Type:</strong> ${isInward ? 'Received (+)' : 'Disbursed (-)'}</div>
      </div>

      <div style="text-align: center; padding: 14px; background: #fff; border-radius: var(--radius-sm); border: 1px solid var(--border); margin: 16px 0;">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Transaction Amount</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: ${isInward ? 'var(--primary)' : 'var(--danger)'};">
          ${formatCurrency(txn.amount)}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 30px; padding-top: 10px; border-top: 1px dashed var(--border); font-size: 0.78rem; color: var(--text-muted);">
        <div>Prepared by: Cashier</div>
        <div>Authorized Signatory</div>
      </div>
    </div>
  `;

  openModal('payment-voucher-modal');
}

// ==========================================================================
// 3. RECORD DIRECT SETTLEMENT PAYMENT
// ==========================================================================
function loadPartyDropdown() {
  const typeSelect = document.getElementById('new-pay-type');
  const partySelect = document.getElementById('new-pay-party');
  if (!typeSelect || !partySelect) return;

  const isCustomer = typeSelect.value === 'INWARD';
  if (isCustomer) {
    const customers = GMS_Store.getCustomers();
    partySelect.innerHTML = customers.map(c => `
      <option value="${c.name}">${c.name} ${c.due > 0 ? `(Due: ৳${c.due})` : ''}</option>
    `).join('');
  } else {
    const suppliers = GMS_Store.getSuppliers();
    partySelect.innerHTML = suppliers.map(s => `
      <option value="${s.name}">${s.name} ${s.due > 0 ? `(Due: ৳${s.due})` : ''}</option>
    `).join('');
  }
}

function handleSaveNewPayment(e) {
  e.preventDefault();

  const type = document.getElementById('new-pay-type').value;
  const party = document.getElementById('new-pay-party').value;
  const amount = parseFloat(document.getElementById('new-pay-amount').value);
  const method = document.getElementById('new-pay-method').value;
  const note = document.getElementById('new-pay-note').value.trim();

  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid payment amount.', 'warning');
    return;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newTxnId = 'PAY-' + Math.floor(1000 + Math.random() * 9000);

  const newTxn = {
    id: newTxnId,
    type,
    party,
    partyType: type === 'INWARD' ? 'Customer' : 'Supplier',
    amount,
    method,
    date: dateStr,
    ref: note || 'Due settlement',
    status: 'Success'
  };

  let manualPayments = GMS_Store.get(GMS_Store.KEYS.PAYMENTS);
  manualPayments.unshift(newTxn);
  GMS_Store.set(GMS_Store.KEYS.PAYMENTS, manualPayments);

  // If customer settlement, reduce customer due
  if (type === 'INWARD') {
    let customers = GMS_Store.getCustomers();
    customers = customers.map(c => {
      if (c.name.toLowerCase() === party.toLowerCase()) {
        return { ...c, due: Math.max(0, (c.due || 0) - amount) };
      }
      return c;
    });
    GMS_Store.set(GMS_Store.KEYS.CUSTOMERS, customers);
  } else {
    // Supplier settlement, reduce supplier due
    let suppliers = GMS_Store.getSuppliers();
    suppliers = suppliers.map(s => {
      if (s.name.toLowerCase() === party.toLowerCase()) {
        return { ...s, due: Math.max(0, (s.due || 0) - amount) };
      }
      return s;
    });
    GMS_Store.set(GMS_Store.KEYS.SUPPLIERS, suppliers);
  }

  showToast(`Payment of ৳${amount} recorded successfully!`, 'success');
  closeModal('new-payment-modal');
  refreshPaymentsLedger();
}
