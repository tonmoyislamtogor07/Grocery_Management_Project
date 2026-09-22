/**
 * GROCERY MANAGEMENT SYSTEM - DASHBOARD LOGIC (Pure Vanilla JavaScript)
 * Zero external libraries or chart plugins.
 */

document.addEventListener('DOMContentLoaded', () => {
  renderKPIs();
  renderSalesChart();
  renderCategoryDonut();
  renderRecentSales();
  renderStockAlerts();
});

// ==========================================================================
// 1. RENDER TOP KPI CARDS
// ==========================================================================
function renderKPIs() {
  const stats = GMS_Store.getDashboardStats();

  const todaySalesElem = document.getElementById('kpi-today-sales');
  if (todaySalesElem) todaySalesElem.textContent = formatCurrency(stats.todaySales);

  const totalRevenueElem = document.getElementById('kpi-total-revenue');
  if (totalRevenueElem) totalRevenueElem.textContent = formatCurrency(stats.totalSalesRevenue);

  const lowStockElem = document.getElementById('kpi-low-stock');
  if (lowStockElem) lowStockElem.textContent = stats.lowStockCount + stats.outOfStockCount;

  const totalProductsElem = document.getElementById('kpi-total-products');
  if (totalProductsElem) totalProductsElem.textContent = stats.totalProducts;
}

// ==========================================================================
// 2. PURE SVG SALES TREND CHART (Zero Dependency)
// ==========================================================================
function renderSalesChart() {
  const container = document.getElementById('sales-chart-container');
  if (!container) return;

  // Mock 7-day sales points [Day, Amount]
  const data = [
    { day: 'Mon', val: 1420 },
    { day: 'Tue', val: 2150 },
    { day: 'Wed', val: 1800 },
    { day: 'Thu', val: 2900 },
    { day: 'Fri', val: 3400 },
    { day: 'Sat', val: 4600 },
    { day: 'Sun', val: 3268 }
  ];

  const width = 600;
  const height = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;

  const maxVal = Math.max(...data.map(d => d.val)) * 1.15;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const getX = (index) => padLeft + (index / (data.length - 1)) * plotWidth;
  const getY = (val) => padTop + plotHeight - (val / maxVal) * plotHeight;

  // Build SVG Path
  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.val), ...d }));
  
  // Curved Line Path (Catmull-Rom or cubic Bezier)
  let lineD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i].x + points[i + 1].x) / 2;
    lineD += ` C ${cpX} ${points[i].y}, ${cpX} ${points[i + 1].y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }

  // Area path (closed at bottom)
  const areaD = `${lineD} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`;

  // Grid Lines & Labels
  let gridLines = '';
  const yTicks = [0, Math.round(maxVal * 0.5), Math.round(maxVal)];
  yTicks.forEach(tick => {
    const yPos = getY(tick);
    gridLines += `
      <line x1="${padLeft}" y1="${yPos}" x2="${width - padRight}" y2="${yPos}" class="chart-grid-line" />
      <text x="${padLeft - 8}" y="${yPos + 4}" class="chart-axis-text" text-anchor="end">৳${tick}</text>
    `;
  });

  // X Axis Day labels & dots
  let xLabelsAndDots = '';
  points.forEach(p => {
    xLabelsAndDots += `
      <text x="${p.x}" y="${height - 8}" class="chart-axis-text" text-anchor="middle">${p.day}</text>
      <circle cx="${p.x}" cy="${p.y}" r="5" class="chart-dot">
        <title>${p.day}: ৳${p.val}</title>
      </circle>
    `;
  });

  const svgHtml = `
    <svg viewBox="0 0 ${width} ${height}" class="sales-chart-svg">
      <defs>
        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaD}" class="chart-path-area" />
      <path d="${lineD}" class="chart-path-line" />
      ${xLabelsAndDots}
    </svg>
  `;

  container.innerHTML = svgHtml;
}

// ==========================================================================
// 3. PURE SVG CATEGORY DONUT CHART
// ==========================================================================
function renderCategoryDonut() {
  const container = document.getElementById('category-donut-container');
  if (!container) return;

  const categories = [
    { name: 'Grains & Pulses', share: 38, color: '#10b981' },
    { name: 'Dairy & Eggs', share: 24, color: '#6366f1' },
    { name: 'Oils & Ghee', share: 20, color: '#f59e0b' },
    { name: 'Spices & Others', share: 18, color: '#ec4899' }
  ];

  const size = 160;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let strokeOffset = 0;
  let circlesSvg = '';

  categories.forEach(cat => {
    const dash = (cat.share / 100) * circumference;
    circlesSvg += `
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}"
        fill="transparent"
        stroke="${cat.color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${dash} ${circumference}"
        stroke-dashoffset="${-strokeOffset}"
      >
        <title>${cat.name}: ${cat.share}%</title>
      </circle>
    `;
    strokeOffset += dash;
  });

  let legendHtml = '';
  categories.forEach(cat => {
    legendHtml += `
      <div class="legend-item">
        <div style="display: flex; align-items: center;">
          <span class="legend-color" style="background: ${cat.color};"></span>
          <span>${cat.name}</span>
        </div>
        <span style="font-weight: 700; color: var(--text-main);">${cat.share}%</span>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="donut-container">
      <svg class="donut-svg" viewBox="0 0 ${size} ${size}">
        ${circlesSvg}
      </svg>
      <div class="donut-legend">
        ${legendHtml}
      </div>
    </div>
  `;
}

// ==========================================================================
// 4. RECENT SALES TRANSACTIONS TABLE
// ==========================================================================
function renderRecentSales() {
  const tableBody = document.getElementById('recent-sales-tbody');
  if (!tableBody) return;

  const sales = GMS_Store.getSales().slice(0, 5);

  if (sales.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">No transactions recorded yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = sales.map(sale => `
    <tr>
      <td>
        <strong style="color: var(--primary);">${sale.id}</strong>
        <div style="font-size: 0.72rem; color: var(--text-muted);">${sale.date}</div>
      </td>
      <td>
        <strong>${sale.customer}</strong>
      </td>
      <td>
        <span class="badge badge-gray">${sale.items ? sale.items.length : 1} items</span>
      </td>
      <td>
        <strong>${formatCurrency(sale.total)}</strong>
      </td>
      <td>
        <span class="badge ${sale.method === 'Cash' ? 'badge-success' : 'badge-purple'}">${sale.method}</span>
      </td>
      <td>
        <button class="action-btn" title="View Receipt" onclick="viewDashboardInvoice('${sale.id}')">
          👁️
        </button>
      </td>
    </tr>
  `).join('');
}

// ==========================================================================
// 5. LOW STOCK & EXPIRING ALERTS FEED
// ==========================================================================
function renderStockAlerts() {
  const container = document.getElementById('stock-alerts-container');
  if (!container) return;

  const products = GMS_Store.getProducts();
  const alertProducts = products.filter(p => p.stock <= GMS_Store.getLowThreshold(p)).slice(0, 4);

  if (alertProducts.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--primary); font-weight: 600;">✓ All items have sufficient stock!</div>`;
    return;
  }

  container.innerHTML = alertProducts.map(prod => `
    <div class="stock-alert-item">
      <div class="stock-item-info">
        <div class="stock-item-icon">${prod.stock === 0 ? '❌' : '⚠️'}</div>
        <div>
          <div class="stock-item-name">${prod.name}</div>
          <div class="stock-item-meta">${prod.category} • Expiry: ${prod.expiry}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="stock-item-badge ${prod.stock === 0 ? 'danger' : 'warning'}">
          ${prod.stock === 0 ? 'Out of Stock' : `${prod.stock} ${prod.unit} left`}
        </span>
      </div>
    </div>
  `).join('');
}

// Quick Invoice preview modal on dashboard
window.viewDashboardInvoice = function(invoiceId) {
  const sales = GMS_Store.getSales();
  const sale = sales.find(s => s.id === invoiceId);
  if (!sale) return;

  const modalBody = document.getElementById('dashboard-invoice-body');
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 16px;">
        <h2 style="color: var(--primary); margin-bottom: 2px;">FreshMart Grocery</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted);">House #12, Road #4, Dhanmondi, Dhaka</p>
        <p style="font-size: 0.8rem; color: var(--text-muted);">Phone: 01700-112233 • VAT Reg: 1982734</p>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 14px;">
        <div>
          <div><strong>Invoice No:</strong> ${sale.id}</div>
          <div><strong>Customer:</strong> ${sale.customer}</div>
        </div>
        <div style="text-align: right;">
          <div><strong>Date:</strong> ${sale.date}</div>
          <div><strong>Payment:</strong> ${sale.method}</div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 16px;">
        <thead>
          <tr style="border-bottom: 1px solid #e2e8f0; text-align: left;">
            <th style="padding: 6px 0;">Item</th>
            <th style="text-align: center; padding: 6px 0;">Qty</th>
            <th style="text-align: right; padding: 6px 0;">Price</th>
            <th style="text-align: right; padding: 6px 0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map(it => `
            <tr style="border-bottom: 1px dashed #f1f5f9;">
              <td style="padding: 6px 0;">${it.name}</td>
              <td style="text-align: center; padding: 6px 0;">${it.qty}</td>
              <td style="text-align: right; padding: 6px 0;">৳${it.price}</td>
              <td style="text-align: right; padding: 6px 0;">৳${it.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 0.9rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Subtotal:</span>
          <span>৳${sale.subtotal}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--danger);">
          <span>Discount:</span>
          <span>-৳${sale.discount || 0}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; color: var(--primary); margin-top: 8px; border-top: 2px dashed #e2e8f0; padding-top: 8px;">
          <span>Grand Total:</span>
          <span>৳${sale.total}</span>
        </div>
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 0.78rem; color: var(--text-muted);">
        Thank you for shopping at FreshMart! Please come again.
      </div>
    `;
  }
  openModal('dashboard-invoice-modal');
};
