/**
 * GROCERY MANAGEMENT SYSTEM - REPORTS ENGINE (Pure Vanilla JavaScript)
 * Zero external dependencies. All 10 report types, SVG charts, and CSV Export.
 */

let activeReport = 'daily-sales';

document.addEventListener('DOMContentLoaded', () => {
  setupReportNav();
  loadSelectedReport();
});

// ==========================================================================
// 1. REPORT NAVIGATION HANDLER
// ==========================================================================
function setupReportNav() {
  document.querySelectorAll('.report-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.report-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeReport = btn.getAttribute('data-report');
      loadSelectedReport();
    });
  });
}

function loadSelectedReport() {
  switch (activeReport) {
    case 'daily-sales': renderDailySalesReport(); break;
    case 'monthly-sales': renderMonthlySalesReport(); break;
    case 'yearly-sales': renderYearlySalesReport(); break;
    case 'purchase-report': renderPurchaseReport(); break;
    case 'profit-report': renderProfitReport(); break;
    case 'top-products': renderTopProductsReport(); break;
    case 'low-stock': renderLowStockReport(); break;
    case 'out-stock': renderOutOfStockReport(); break;
    case 'supplier-report': renderSupplierReport(); break;
    case 'expense-report': renderExpenseReport(); break;
  }
}

// ==========================================================================
// 2. REPORT RENDERERS
// ==========================================================================

// --- 1. DAILY SALES REPORT ---
function renderDailySalesReport() {
  const sales = GMS_Store.getSales();
  const todaySales = sales.filter(s => s.date.includes('2026-09-06'));
  const totalRev = todaySales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  updateReportHeader('Daily Sales Report', 'Detailed breakdown of all customer orders processed today (06 Sep 2026).');
  renderReportKPIs([
    { label: "Today's Gross Sales", val: formatCurrency(totalRev), color: 'var(--primary)' },
    { label: "Transactions Completed", val: todaySales.length, color: 'var(--text-main)' },
    { label: "Avg Transaction Value", val: formatCurrency(todaySales.length ? totalRev / todaySales.length : 0), color: 'var(--secondary)' }
  ]);

  renderSVGBarChart([
    { label: '09:00 AM', val: 350 },
    { label: '11:00 AM', val: 700 },
    { label: '01:00 PM', val: 1150 },
    { label: '03:00 PM', val: 288 },
    { label: '05:00 PM', val: 920 },
    { label: '07:00 PM', val: 1400 }
  ], 'Hourly Revenue (BDT ৳)');

  renderReportTable(
    ['Invoice ID', 'Time', 'Customer', 'Items Qty', 'Payment Method', 'Amount'],
    todaySales.map(s => [
      `<strong style="color: var(--primary);">${s.id}</strong>`,
      s.date.split(' ')[1] + ' ' + (s.date.split(' ')[2] || ''),
      s.customer,
      s.items ? s.items.length : 1,
      `<span class="badge badge-purple">${s.method}</span>`,
      `<strong>${formatCurrency(s.total)}</strong>`
    ])
  );
}

// --- 2. MONTHLY SALES REPORT ---
function renderMonthlySalesReport() {
  const sales = GMS_Store.getSales();
  const totalRev = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  updateReportHeader('Monthly Sales Report', 'Aggregated revenue trajectory for September 2026.');
  renderReportKPIs([
    { label: "Month-to-Date Revenue", val: formatCurrency(totalRev * 6.5), color: 'var(--primary)' },
    { label: "Total Orders (Sep)", val: sales.length * 6, color: 'var(--text-main)' },
    { label: "Sales Target Met", val: "78.4%", color: 'var(--primary)' }
  ]);

  renderSVGBarChart([
    { label: 'Week 1', val: 18400 },
    { label: 'Week 2', val: 24500 },
    { label: 'Week 3', val: 21900 },
    { label: 'Week 4', val: 29800 }
  ], 'Weekly Performance (September 2026)');

  renderReportTable(
    ['Week Period', 'Orders Count', 'Gross Revenue', 'Discounts Given', 'Net Collected'],
    [
      ['Week 1 (01-07 Sep)', '42 Orders', '৳ 18,400', '৳ 450', '৳ 17,950'],
      ['Week 2 (08-14 Sep)', '58 Orders', '৳ 24,500', '৳ 620', '৳ 23,880'],
      ['Week 3 (15-21 Sep)', '51 Orders', '৳ 21,900', '৳ 510', '৳ 21,390'],
      ['Week 4 (22-30 Sep)', '64 Orders', '৳ 29,800', '৳ 800', '৳ 29,000']
    ]
  );
}

// --- 3. YEARLY SALES REPORT ---
function renderYearlySalesReport() {
  updateReportHeader('Yearly Sales Report', 'Annual fiscal overview for 2026.');
  renderReportKPIs([
    { label: "Total Annual Gross", val: "৳ 8,45,200", color: 'var(--primary)' },
    { label: "Highest Month", val: "April (Eid Festival)", color: 'var(--purple)' },
    { label: "Annual Growth (YoY)", val: "+24.8%", color: 'var(--primary)' }
  ]);

  renderSVGBarChart([
    { label: 'Jan', val: 62000 },
    { label: 'Feb', val: 58000 },
    { label: 'Mar', val: 78000 },
    { label: 'Apr', val: 112000 },
    { label: 'May', val: 68000 },
    { label: 'Jun', val: 74000 },
    { label: 'Jul', val: 82000 },
    { label: 'Aug', val: 89000 },
    { label: 'Sep', val: 94600 }
  ], 'Monthly Trajectory 2026');

  renderReportTable(
    ['Month', 'Total Orders', 'Revenue (৳)', 'Growth vs Prev Month'],
    [
      ['January 2026', '180 Orders', '৳ 62,000', '-'],
      ['February 2026', '165 Orders', '৳ 58,000', '-6.4%'],
      ['March 2026', '210 Orders', '৳ 78,000', '+34.5%'],
      ['April 2026 (Eid)', '295 Orders', '৳ 1,12,000', '+43.5%'],
      ['May 2026', '190 Orders', '৳ 68,000', '-39.2%'],
      ['June 2026', '205 Orders', '৳ 74,000', '+8.8%'],
      ['July 2026', '225 Orders', '৳ 82,000', '+10.8%'],
      ['August 2026', '240 Orders', '৳ 89,000', '+8.5%'],
      ['September 2026 (MTD)', '260 Orders', '৳ 94,600', '+6.2%']
    ]
  );
}

// --- 4. PURCHASE REPORT ---
function renderPurchaseReport() {
  const purchases = GMS_Store.getPurchases();
  const totalCost = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalDue = purchases.reduce((sum, p) => sum + Number(p.due || 0), 0);

  updateReportHeader('Wholesale Purchase Report', 'Inventory procurement logs and vendor payment breakdowns.');
  renderReportKPIs([
    { label: "Total Purchases", val: formatCurrency(totalCost), color: 'var(--text-main)' },
    { label: "Total Paid Out", val: formatCurrency(totalCost - totalDue), color: 'var(--primary)' },
    { label: "Supplier Payables Due", val: formatCurrency(totalDue), color: 'var(--danger)' }
  ]);

  renderSVGBarChart(
    purchases.map(p => ({ label: p.id, val: p.total })),
    'PO Amount by Order'
  );

  renderReportTable(
    ['PO #', 'Date', 'Supplier', 'Items Total', 'Paid', 'Due Balance', 'Status'],
    purchases.map(p => [
      `<strong style="color: var(--primary);">${p.id}</strong>`,
      p.date,
      p.supplier,
      `<strong>${formatCurrency(p.total)}</strong>`,
      formatCurrency(p.paid || p.total),
      `<span style="color: ${p.due > 0 ? 'var(--danger)' : 'var(--primary)'};">${formatCurrency(p.due || 0)}</span>`,
      `<span class="badge ${p.due > 0 ? 'badge-warning' : 'badge-success'}">${p.status || (p.due > 0 ? 'Partial' : 'Paid')}</span>`
    ])
  );
}

// --- 5. PROFIT & LOSS REPORT ---
function renderProfitReport() {
  const sales = GMS_Store.getSales();
  const products = GMS_Store.getProducts();
  const expenses = GMS_Store.getExpenses();

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  
  // Cost of goods sold estimated at ~78%
  const estimatedCOGS = Math.round(totalRevenue * 0.78);
  const grossProfit = totalRevenue - estimatedCOGS;
  const netProfit = grossProfit - (totalExpenses * 0.15);
  const netMargin = Math.round((netProfit / totalRevenue) * 100);

  updateReportHeader('Profit & Loss Report', 'Comprehensive evaluation of Revenue, Cost of Goods Sold, and Net Profit.');
  renderReportKPIs([
    { label: "Gross Revenue", val: formatCurrency(totalRevenue), color: 'var(--primary)' },
    { label: "COGS (Cost of Goods)", val: formatCurrency(estimatedCOGS), color: 'var(--text-muted)' },
    { label: "Operating Overhead", val: formatCurrency(Math.round(totalExpenses * 0.15)), color: 'var(--danger)' },
    { label: "Net Operating Profit", val: `${formatCurrency(netProfit)} (${netMargin}%)`, color: 'var(--primary)' }
  ]);

  renderSVGBarChart([
    { label: 'Revenue', val: totalRevenue },
    { label: 'COGS', val: estimatedCOGS },
    { label: 'Gross Profit', val: grossProfit },
    { label: 'Net Profit', val: Math.max(0, netProfit) }
  ], 'Financial Breakdown Comparison');

  renderReportTable(
    ['Financial Component', 'Calculation Basis', 'BDT Amount (৳)', 'Ratio / Margin'],
    [
      ['Total Sales Turnover', 'Gross receipts from retail register', formatCurrency(totalRevenue), '100%'],
      ['Cost of Goods Sold (COGS)', 'Wholesale procurement cost of sold inventory', formatCurrency(estimatedCOGS), '78% of Turnover'],
      ['Gross Profit', 'Turnover minus COGS', formatCurrency(grossProfit), '22% Margin'],
      ['Operating Expenses', 'Shop rent, electricity, transport, packaging', formatCurrency(Math.round(totalExpenses * 0.15)), '4% of Turnover'],
      ['Net Profit (EBITDA)', 'Gross Profit minus Operating Expenses', formatCurrency(netProfit), `+${netMargin}% Net Margin`]
    ]
  );
}

// --- 6. TOP SELLING PRODUCTS ---
function renderTopProductsReport() {
  const products = GMS_Store.getProducts();

  updateReportHeader('Top Selling Products Leaderboard', 'High velocity grocery items ranked by units sold and revenue contribution.');
  renderReportKPIs([
    { label: "#1 Best Seller", val: "Nazirshail Rice", color: 'var(--primary)' },
    { label: "Fast-Moving Share", val: "68% of Revenue", color: 'var(--purple)' },
    { label: "Top Category", val: "Grains & Dairy", color: 'var(--secondary)' }
  ]);

  const topItems = [
    { name: 'Nazirshail Premium Rice', cat: 'Grains & Pulses', soldQty: 320, rev: 27200, icon: '🌾' },
    { name: 'Fresh Fortified Soybean Oil 5L', cat: 'Oils & Ghee', soldQty: 185, rev: 159100, icon: '🛢️' },
    { name: 'Farm Fresh Brown Eggs (12 pcs)', cat: 'Dairy & Eggs', soldQty: 160, rev: 24800, icon: '🥚' },
    { name: 'Deshi Red Lentils (Moshur Dal)', cat: 'Grains & Pulses', soldQty: 140, rev: 20300, icon: '🌾' },
    { name: 'Aarong Pasteurised Milk 1L', cat: 'Dairy & Eggs', soldQty: 125, rev: 11875, icon: '🥛' }
  ];

  renderSVGBarChart(
    topItems.map(i => ({ label: i.name.split(' ')[0], val: i.soldQty })),
    'Top Items by Quantity Sold (Units)'
  );

  renderReportTable(
    ['Rank', 'Item & Category', 'Units Sold', 'Selling Price', 'Revenue Generated'],
    topItems.map((it, idx) => [
      `<span class="rank-badge ${idx === 0 ? 'top1' : (idx === 1 ? 'top2' : (idx === 2 ? 'top3' : ''))}">${idx + 1}</span>`,
      `<strong>${it.icon} ${it.name}</strong><div style="font-size: 0.72rem; color: var(--text-muted);">${it.cat}</div>`,
      `<strong>${it.soldQty} units</strong>`,
      formatCurrency(Math.round(it.rev / it.soldQty)),
      `<strong style="color: var(--primary);">${formatCurrency(it.rev)}</strong>`
    ])
  );
}

// --- 7. LOW STOCK REPORT ---
function renderLowStockReport() {
  const products = GMS_Store.getProducts();
  const lowItems = products.filter(p => p.stock > 0 && p.stock <= GMS_Store.getLowThreshold(p));

  updateReportHeader('Low Stock Alert Report', 'Items nearing critical thresholds that require purchase replenishment.');
  renderReportKPIs([
    { label: "Items Under Threshold", val: lowItems.length, color: 'var(--warning)' },
    { label: "Restock Cost Estimate", val: formatCurrency(lowItems.reduce((s, i) => s + (i.buyPrice * 20), 0)), color: 'var(--primary)' },
    { label: "Action Status", val: "Reorder Required", color: 'var(--danger)' }
  ]);

  renderReportTable(
    ['Barcode', 'Product Name', 'Category', 'Current Stock', 'Reorder Suggestion', 'Unit Cost'],
    lowItems.map(p => [
      `<span class="barcode-tag">${p.barcode}</span>`,
      `<strong>${p.name}</strong>`,
      p.category,
      `<span class="badge badge-warning">${p.stock} ${p.unit} left</span>`,
      `Order +${20} ${p.unit}`,
      formatCurrency(p.buyPrice)
    ])
  );
}

// --- 8. OUT OF STOCK REPORT ---
function renderOutOfStockReport() {
  const products = GMS_Store.getProducts();
  const outItems = products.filter(p => p.stock <= 0);

  updateReportHeader('Out of Stock Incident Report', 'Zero inventory products currently unavailable on store shelves.');
  renderReportKPIs([
    { label: "Zero Stock Items", val: outItems.length, color: 'var(--danger)' },
    { label: "Lost Opportunity Est.", val: "৳ 4,500 / day", color: 'var(--text-muted)' },
    { label: "Status", val: "Critical Replenishment", color: 'var(--danger)' }
  ]);

  renderReportTable(
    ['Barcode', 'Product Name', 'Category', 'Status', 'Last Purchase Cost', 'Urgency'],
    outItems.length > 0 ? outItems.map(p => [
      `<span class="barcode-tag">${p.barcode}</span>`,
      `<strong>${p.name}</strong>`,
      p.category,
      `<span class="badge badge-danger">Out of Stock (0)</span>`,
      formatCurrency(p.buyPrice),
      `<span style="color: var(--danger); font-weight: 800;">High Priority</span>`
    ]) : [['-', 'No items currently out of stock!', '-', '-', '-', '-']]
  );
}

// --- 9. SUPPLIER REPORT ---
function renderSupplierReport() {
  const suppliers = GMS_Store.getSuppliers();
  const purchases = GMS_Store.getPurchases();
  const totalDue = suppliers.reduce((sum, s) => sum + Number(s.due || 0), 0);

  updateReportHeader('Supplier Performance Report', 'Procurement volume, payment status, and vendor account ledgers.');
  renderReportKPIs([
    { label: "Registered Vendors", val: suppliers.length, color: 'var(--text-main)' },
    { label: "Total Payable Balance", val: formatCurrency(totalDue), color: 'var(--danger)' },
    { label: "Vendors with Dues", val: suppliers.filter(s => s.due > 0).length, color: 'var(--warning)' }
  ]);

  renderReportTable(
    ['Supplier Name', 'Contact Phone', 'Warehouse Location', 'Total Orders', 'Outstanding Payable'],
    suppliers.map(s => {
      const orders = purchases.filter(p => p.supplier.toLowerCase() === s.name.toLowerCase());
      return [
        `<strong>${s.name}</strong>`,
        s.contact,
        s.address || 'Dhaka',
        `${orders.length} Orders`,
        `<span style="color: ${s.due > 0 ? 'var(--danger)' : 'var(--primary)'}; font-weight: 700;">${formatCurrency(s.due || 0)}</span>`
      ];
    })
  );
}

// --- 10. EXPENSE REPORT ---
function renderExpenseReport() {
  const expenses = GMS_Store.getExpenses();
  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  updateReportHeader('Store Operating Expense Report', 'Itemized breakdown of rent, utility bills, salaries, and transit overhead.');
  renderReportKPIs([
    { label: "Total Overhead (MTD)", val: formatCurrency(total), color: 'var(--danger)' },
    { label: "Expense Count", val: expenses.length, color: 'var(--text-main)' },
    { label: "Daily Burn Rate", val: formatCurrency(Math.round(total / 6)), color: 'var(--text-muted)' }
  ]);

  renderSVGBarChart(
    expenses.map(e => ({ label: e.category, val: e.amount })),
    'Expense Breakdown by Category'
  );

  renderReportTable(
    ['Voucher #', 'Date', 'Category', 'Expense Description', 'Amount'],
    expenses.map(e => [
      `<strong style="color: var(--primary);">${e.id}</strong>`,
      e.date,
      `<span class="badge badge-purple">${e.category}</span>`,
      e.title,
      `<strong style="color: var(--danger);">${formatCurrency(e.amount)}</strong>`
    ])
  );
}

// ==========================================================================
// 3. UI HELPERS: HEADER, KPIS, TABLE & SVG BAR CHART
// ==========================================================================
function updateReportHeader(title, subtitle) {
  document.getElementById('report-view-title').textContent = title;
  document.getElementById('report-view-subtitle').textContent = subtitle;
}

function renderReportKPIs(kpis) {
  const container = document.getElementById('report-kpis-container');
  if (!container) return;

  container.innerHTML = kpis.map(k => `
    <div class="card" style="padding: 16px 20px;">
      <div style="font-size: 0.76rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">
        ${k.label}
      </div>
      <div style="font-size: 1.4rem; font-weight: 800; color: ${k.color || 'var(--text-main)'}; margin-top: 4px;">
        ${k.val}
      </div>
    </div>
  `).join('');
}

function renderReportTable(headers, rows) {
  const headEl = document.getElementById('report-thead');
  const bodyEl = document.getElementById('report-tbody');
  if (!headEl || !bodyEl) return;

  headEl.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
  bodyEl.innerHTML = rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
}

function renderSVGBarChart(data, chartTitle) {
  const chartWrapper = document.getElementById('report-chart-container');
  const chartCard = document.getElementById('report-chart-card');
  if (!chartWrapper || !chartCard) return;

  if (!data || data.length === 0) {
    chartCard.style.display = 'none';
    return;
  }
  chartCard.style.display = 'block';
  document.getElementById('report-chart-title').textContent = chartTitle || 'Analytics Chart';

  const width = 640;
  const height = 220;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;

  const maxVal = Math.max(...data.map(d => d.val)) * 1.15 || 100;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const barWidth = Math.min(48, Math.floor(plotWidth / data.length) - 14);

  let barsSvg = '';
  data.forEach((d, i) => {
    const barHeight = (d.val / maxVal) * plotHeight;
    const x = padLeft + (i * (plotWidth / data.length)) + ((plotWidth / data.length - barWidth) / 2);
    const y = padTop + plotHeight - barHeight;

    barsSvg += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="url(#barGradient)">
        <title>${d.label}: ৳${d.val}</title>
      </rect>
      <text x="${x + barWidth / 2}" y="${height - 12}" class="chart-axis-text" text-anchor="middle">
        ${d.label}
      </text>
      <text x="${x + barWidth / 2}" y="${y - 6}" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">
        ${d.val >= 1000 ? Math.round(d.val / 1000) + 'k' : d.val}
      </text>
    `;
  });

  chartWrapper.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
      <defs>
        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
      </defs>
      <line x1="${padLeft}" y1="${padTop + plotHeight}" x2="${width - padRight}" y2="${padTop + plotHeight}" stroke="#e2e8f0" stroke-width="1.5" />
      ${barsSvg}
    </svg>
  `;
}

// ==========================================================================
// 4. EXPORT TO CSV (Pure Vanilla JS Blob)
// ==========================================================================
function exportReportCSV() {
  const table = document.getElementById('report-table');
  if (!table) return;

  let csvContent = '';
  const rows = table.querySelectorAll('tr');

  rows.forEach(row => {
    const cols = row.querySelectorAll('th, td');
    const rowData = [];
    cols.forEach(col => {
      let text = col.innerText.replace(/"/g, '""').trim();
      rowData.push(`"${text}"`);
    });
    csvContent += rowData.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FreshMart_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Report downloaded as CSV file!', 'success');
}
