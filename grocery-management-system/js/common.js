/**
 * GROCERY MANAGEMENT SYSTEM - COMMON ENGINE (Pure Vanilla JavaScript)
 * Zero external libraries or frameworks.
 */

// ==========================================================================
// 1. LOCAL STORAGE PERSISTENCE DATA STORE
// ==========================================================================
const GMS_Store = {
  KEYS: {
    PRODUCTS: 'gms_products',
    CATEGORIES: 'gms_categories',
    SUPPLIERS: 'gms_suppliers',
    CUSTOMERS: 'gms_customers',
    PURCHASES: 'gms_purchases',
    SALES: 'gms_sales',
    INVENTORY_LOGS: 'gms_inventory_logs',
    PAYMENTS: 'gms_payments',
    EXPENSES: 'gms_expenses',
    ADMINS: 'gms_admins',
    CURRENT_ADMIN: 'gms_current_admin'
  },

  // Seed default data if storage is empty
  init() {
    if (!localStorage.getItem(this.KEYS.ADMINS)) {
      const defaultAdmins = [
        {
          id: 'ADM01',
          name: 'Tanvir Ahmed',
          email: 'admin@freshmart.com',
          password: 'admin',
          phone: '01711-223344',
          role: 'Super Admin',
          avatar: 'TA',
          joined: '2025-01-10',
          status: 'Active'
        },
        {
          id: 'ADM02',
          name: 'Farhana Yasmin',
          email: 'manager@freshmart.com',
          password: 'admin',
          phone: '01822-334455',
          role: 'Branch Manager',
          avatar: 'FY',
          joined: '2025-06-15',
          status: 'Active'
        }
      ];
      localStorage.setItem(this.KEYS.ADMINS, JSON.stringify(defaultAdmins));
    }

    // Set initial active admin session if not set
    if (!localStorage.getItem(this.KEYS.CURRENT_ADMIN)) {
      const admins = JSON.parse(localStorage.getItem(this.KEYS.ADMINS));
      localStorage.setItem(this.KEYS.CURRENT_ADMIN, JSON.stringify(admins[0]));
    }
    if (!localStorage.getItem(this.KEYS.CATEGORIES)) {
      const defaultCategories = [
        { id: 'CAT01', name: 'Grains & Pulses', icon: '🌾', description: 'Rice, Lentils, Wheat, Corn' },
        { id: 'CAT02', name: 'Dairy & Eggs', icon: '🥛', description: 'Milk, Butter, Cheese, Farm Eggs' },
        { id: 'CAT03', name: 'Oils & Ghee', icon: '🛢️', description: 'Mustard Oil, Soybean, Pure Ghee' },
        { id: 'CAT04', name: 'Spices & Seasoning', icon: '🌶️', description: 'Chili, Turmeric, Cumin, Salt' },
        { id: 'CAT05', name: 'Beverages & Tea', icon: '☕', description: 'Tea leaves, Coffee, Juice, Soft drinks' },
        { id: 'CAT06', name: 'Snacks & Bakery', icon: '🍪', description: 'Biscuits, Bread, Cakes, Chips' },
        { id: 'CAT07', name: 'Household & Cleaning', icon: '🧼', description: 'Soaps, Detergent, Tissue, Disinfectants' }
      ];
      localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    }

    if (!localStorage.getItem(this.KEYS.SUPPLIERS)) {
      const defaultSuppliers = [
        { id: 'SUP01', name: 'Meghna Agro Foods', contact: '01711-234567', email: 'meghna@agro.com', address: 'Tejgaon, Dhaka', due: 12500 },
        { id: 'SUP02', name: 'Fresh Dairy & Farms', contact: '01822-345678', email: 'info@freshdairy.com', address: 'Gazipur', due: 0 },
        { id: 'SUP03', name: 'Pran Consumer Products', contact: '01933-456789', email: 'sales@pran.com', address: 'Gulsan, Dhaka', due: 5400 },
        { id: 'SUP04', name: 'Square Toiletries & Care', contact: '01644-567890', email: 'order@square.com', address: 'Mohakhali, Dhaka', due: 0 }
      ];
      localStorage.setItem(this.KEYS.SUPPLIERS, JSON.stringify(defaultSuppliers));
    }

    if (!localStorage.getItem(this.KEYS.CUSTOMERS)) {
      const defaultCustomers = [
        { id: 'CUST01', name: 'Walk-in Customer', phone: 'N/A', email: 'N/A', due: 0, points: 0 },
        { id: 'CUST02', name: 'Karim Rahman', phone: '01712-001122', email: 'karim@gmail.com', due: 850, points: 140 },
        { id: 'CUST03', name: 'Tasnim Akhter', phone: '01815-334455', email: 'tasnim@yahoo.com', due: 0, points: 320 },
        { id: 'CUST04', name: 'Dr. Anwarul Islam', phone: '01911-998877', email: 'anwar@clinic.com', due: 210, points: 215 }
      ];
      localStorage.setItem(this.KEYS.CUSTOMERS, JSON.stringify(defaultCustomers));
    }

    if (!localStorage.getItem(this.KEYS.PRODUCTS)) {
      const defaultProducts = [
        { id: 'PROD01', barcode: '89411001', name: 'Nazirshail Premium Rice', category: 'Grains & Pulses', buyPrice: 72, sellPrice: 85, stock: 120, unit: 'kg', lowThreshold: 10, expiry: '2027-01-15' },
        { id: 'PROD02', barcode: '89411002', name: 'Aarong Pasteurised Milk 1L', category: 'Dairy & Eggs', buyPrice: 80, sellPrice: 95, stock: 8, unit: 'packet', lowThreshold: 10, expiry: '2026-09-12' }, // Low stock!
        { id: 'PROD03', barcode: '89411003', name: 'Fresh Fortified Soybean Oil 5L', category: 'Oils & Ghee', buyPrice: 780, sellPrice: 860, stock: 45, unit: 'bottle', lowThreshold: 10, expiry: '2027-06-30' },
        { id: 'PROD04', barcode: '89411004', name: 'Deshi Red Lentils (Moshur Dal)', category: 'Grains & Pulses', buyPrice: 125, sellPrice: 145, stock: 85, unit: 'kg', lowThreshold: 10, expiry: '2027-03-20' },
        { id: 'PROD05', barcode: '89411005', name: 'Farm Fresh Brown Eggs (12 pcs)', category: 'Dairy & Eggs', buyPrice: 135, sellPrice: 155, stock: 35, unit: 'dozen', lowThreshold: 10, expiry: '2026-09-25' },
        { id: 'PROD06', barcode: '89411006', name: 'Radhuni Turmeric Powder 200g', category: 'Spices & Seasoning', buyPrice: 82, sellPrice: 98, stock: 60, unit: 'pack', lowThreshold: 10, expiry: '2027-08-10' },
        { id: 'PROD07', barcode: '89411007', name: 'Ispahani Mirzapore Tea 400g', category: 'Beverages & Tea', buyPrice: 220, sellPrice: 260, stock: 0, unit: 'box', lowThreshold: 10, expiry: '2027-05-18' }, // Out of stock!
        { id: 'PROD08', barcode: '89411008', name: 'Dano Daily Pushti Milk Powder 500g', category: 'Dairy & Eggs', buyPrice: 410, sellPrice: 470, stock: 24, unit: 'packet', lowThreshold: 10, expiry: '2026-10-02' },
        { id: 'PROD09', barcode: '89411009', name: 'Lifebuoy Total Soap 100g', category: 'Household & Cleaning', buyPrice: 48, sellPrice: 60, stock: 90, unit: 'pcs', lowThreshold: 10, expiry: '2028-02-14' },
        { id: 'PROD10', barcode: '89411010', name: 'Teer Refined Sugar 1kg', category: 'Grains & Pulses', buyPrice: 128, sellPrice: 140, stock: 5, unit: 'kg', lowThreshold: 10, expiry: '2027-11-01' } // Low stock!
      ];
      localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(defaultProducts));
    } else {
      // One-time migration: ensure every product has lowThreshold (default 10)
      try {
        const products = JSON.parse(localStorage.getItem(this.KEYS.PRODUCTS)) || [];
        let changed = false;
        products.forEach(p => {
          if (p.lowThreshold === undefined || p.lowThreshold === null || isNaN(Number(p.lowThreshold))) {
            p.lowThreshold = 10;
            changed = true;
          }
        });
        if (changed) localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
      } catch (e) { /* keep legacy data untouched on parse failure */ }
    }

    if (!localStorage.getItem(this.KEYS.SALES)) {
      const defaultSales = [
        {
          id: 'INV-1001',
          date: '2026-09-06 11:20 AM',
          customer: 'Karim Rahman',
          items: [
            { name: 'Nazirshail Premium Rice', qty: 5, price: 85, total: 425 },
            { name: 'Deshi Red Lentils (Moshur Dal)', qty: 2, price: 145, total: 290 }
          ],
          subtotal: 715,
          discount: 15,
          tax: 0,
          total: 700,
          paid: 700,
          due: 0,
          method: 'Cash',
          status: 'Completed'
        },
        {
          id: 'INV-1002',
          date: '2026-09-06 12:45 PM',
          customer: 'Tasnim Akhter',
          items: [
            { name: 'Fresh Fortified Soybean Oil 5L', qty: 1, price: 860, total: 860 },
            { name: 'Farm Fresh Brown Eggs (12 pcs)', qty: 2, price: 155, total: 310 }
          ],
          subtotal: 1170,
          discount: 20,
          tax: 0,
          total: 1150,
          paid: 1150,
          due: 0,
          method: 'bKash',
          status: 'Completed'
        },
        {
          id: 'INV-1003',
          date: '2026-09-06 02:10 PM',
          customer: 'Walk-in Customer',
          items: [
            { name: 'Aarong Pasteurised Milk 1L', qty: 2, price: 95, total: 190 },
            { name: 'Radhuni Turmeric Powder 200g', qty: 1, price: 98, total: 98 }
          ],
          subtotal: 288,
          discount: 0,
          tax: 0,
          total: 288,
          paid: 288,
          due: 0,
          method: 'Card',
          status: 'Completed'
        },
        {
          id: 'INV-1004',
          date: '2026-09-05 06:30 PM',
          customer: 'Dr. Anwarul Islam',
          items: [
            { name: 'Dano Daily Pushti Milk Powder 500g', qty: 2, price: 470, total: 940 },
            { name: 'Lifebuoy Total Soap 100g', qty: 4, price: 60, total: 240 }
          ],
          subtotal: 1180,
          discount: 50,
          tax: 0,
          total: 1130,
          paid: 1130,
          due: 0,
          method: 'Cash',
          status: 'Completed'
        }
      ];
      localStorage.setItem(this.KEYS.SALES, JSON.stringify(defaultSales));
    }

    if (!localStorage.getItem(this.KEYS.PURCHASES)) {
      const defaultPurchases = [
        { id: 'PUR-801', date: '2026-09-04', supplier: 'Meghna Agro Foods', total: 18500, paid: 18500, due: 0, status: 'Received' },
        { id: 'PUR-802', date: '2026-09-05', supplier: 'Fresh Dairy & Farms', total: 9600, paid: 9600, due: 0, status: 'Received' },
        { id: 'PUR-803', date: '2026-09-06', supplier: 'Pran Consumer Products', total: 14200, paid: 8800, due: 5400, status: 'Partial' }
      ];
      localStorage.setItem(this.KEYS.PURCHASES, JSON.stringify(defaultPurchases));
    }

    if (!localStorage.getItem(this.KEYS.EXPENSES)) {
      const defaultExpenses = [
        { id: 'EXP-01', title: 'Shop Electricity Bill', category: 'Utilities', amount: 3200, date: '2026-09-02', note: 'Desco bill for August' },
        { id: 'EXP-02', title: 'Staff Monthly Salary', category: 'Salary', amount: 16000, date: '2026-09-01', note: 'Helper & Cashier part payment' },
        { id: 'EXP-03', title: 'Carton Delivery Van Fare', category: 'Transport', amount: 650, date: '2026-09-05', note: 'Goods transit from Karwan Bazar' }
      ];
      localStorage.setItem(this.KEYS.EXPENSES, JSON.stringify(defaultExpenses));
    }
  },

  // Generic Getters & Setters
  get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // Quick helper queries
  getProducts() { return this.get(this.KEYS.PRODUCTS); },
  getCategories() { return this.get(this.KEYS.CATEGORIES); },
  getSuppliers() { return this.get(this.KEYS.SUPPLIERS); },
  getCustomers() { return this.get(this.KEYS.CUSTOMERS); },
  getSales() { return this.get(this.KEYS.SALES); },
  getPurchases() { return this.get(this.KEYS.PURCHASES); },
  getExpenses() { return this.get(this.KEYS.EXPENSES); },
  getAdmins() { return this.get(this.KEYS.ADMINS); },
  getCurrentAdmin() {
    const data = localStorage.getItem(this.KEYS.CURRENT_ADMIN);
    return data ? JSON.parse(data) : (this.getAdmins()[0] || null);
  },
  setCurrentAdmin(admin) {
    localStorage.setItem(this.KEYS.CURRENT_ADMIN, JSON.stringify(admin));
  },
  logout() {
    localStorage.removeItem(this.KEYS.CURRENT_ADMIN);
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? '../login.html' : 'login.html';
  },

  // Compute key stats for dashboard
  // --- Shared grocery workflow helpers (used by Sales / Inventory / Products) ---
  // Single low-stock threshold source of truth. Falls back to 10 for legacy data.
  getLowThreshold(p) {
    const t = Number(p && p.lowThreshold);
    return (p && p.lowThreshold !== undefined && p.lowThreshold !== null && !isNaN(t) && t >= 0) ? t : 10;
  },
  // Availability status: 'Out of Stock' | 'Low Stock' | 'Available'
  getProductAvailability(p) {
    if (!p || Number(p.stock) <= 0) return 'Out of Stock';
    if (Number(p.stock) <= this.getLowThreshold(p)) return 'Low Stock';
    return 'Available';
  },
  // Next human-readable invoice number (INV-0001 style). Sequential, not random.
  // Internal numeric sale_id is stored separately (see handleCompleteSale).
  generateInvoiceNumber() {
    const sales = this.getSales();
    let max = 1000;
    sales.forEach(s => {
      const inv = s.invoiceNo || s.id || '';
      const m = String(inv).match(/(\d+)\s*$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'INV-' + String(max + 1).padStart(4, '0');
  },
  getNextSaleId() {
    const sales = this.getSales();
    let max = 0;
    sales.forEach(s => { max = Math.max(max, Number(s.saleId) || 0); });
    return max + 1;
  },
  findCustomerByName(name) {
    const customers = this.getCustomers();
    return customers.find(c => (c.name || '').toLowerCase() === String(name || '').toLowerCase()) || null;
  },
  // Customer purchase history (Sale -> SaleItems). Matches by customerId first,
  // falls back to name so legacy sales and sales of deleted customers still show.
  getCustomerSalesHistory(customerRef) {
    const sales = this.getSales();
    const customers = this.getCustomers();
    let customer = null;
    if (customerRef && typeof customerRef === 'object') customer = customerRef;
    else if (customerRef) {
      customer = customers.find(c => c.id === customerRef)
        || customers.find(c => (c.name || '').toLowerCase() === String(customerRef).toLowerCase())
        || null;
    }
    return sales.filter(s => {
      if (customer) {
        if (s.customerId && customer.id && s.customerId === customer.id) return true;
        return (s.customer || '').toLowerCase() === (customer.name || '').toLowerCase();
      }
      return false;
    });
  },
  // Central inventory movement log: STOCK_IN (purchase) / STOCK_OUT (sale).
  logInventoryMovement(entry) {
    const logs = this.get(this.KEYS.INVENTORY_LOGS);
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    logs.unshift({
      id: 'LOG-' + Math.floor(1000 + Math.random() * 9000),
      date: dateStr,
      type: entry.type,               // 'STOCK_IN' | 'STOCK_OUT'
      productName: entry.productName || '',
      productId: entry.productId || '',
      qty: entry.qty || '',           // e.g. '+50 kg' / '-5 kg'
      note: entry.note || '',
      ref: entry.ref || ''            // invoice / PO number
    });
    this.set(this.KEYS.INVENTORY_LOGS, logs);
  },
  getDashboardStats() {
    const sales = this.getSales();
    const purchases = this.getPurchases();
    const products = this.getProducts();
    const expenses = this.getExpenses();

    // Sales calculation
    const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const todaySales = sales
      .filter(s => s.date.includes('2026-09-06'))
      .reduce((sum, s) => sum + Number(s.total || 0), 0);

    const totalOrders = sales.length;
    const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= GMS_Store.getLowThreshold(p)).length;
    const outOfStockCount = products.filter(p => Number(p.stock) <= 0).length;
    const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      todaySales,
      totalSalesRevenue,
      totalOrders,
      lowStockCount,
      outOfStockCount,
      totalExpenseAmount,
      totalProducts: products.length
    };
  }
};

// Initialize Store on load
GMS_Store.init();

// ==========================================================================
// 2. GLOBAL UI UTILITIES & TOAST ALERTS
// ==========================================================================
function formatCurrency(amount) {
  return '৳ ' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// --- Reusable sale math / validation (shared conceptual workflow) ---
// subtotal for one sale item: quantity x unit price (price frozen at sale time)
function calculateSubtotal(qty, unitPrice) {
  return Number(qty || 0) * Number(unitPrice || 0);
}
// total of a cart: sum of all item subtotals
function calculateCartTotal(cartItems) {
  return (cartItems || []).reduce((sum, i) => sum + calculateSubtotal(i.qty, i.price), 0);
}
// Fresh stock check against the LATEST stored product (never trust cached maxStock).
// Returns { ok: true } or { ok: false, available, message }.
function validateStock(productId, wantedQty) {
  const products = GMS_Store.getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return { ok: false, available: 0, message: 'Product no longer exists.' };
  const available = Number(prod.stock || 0);
  if (available <= 0) return { ok: false, available, message: `"${prod.name}" is out of stock.` };
  if (Number(wantedQty) > available) {
    return { ok: false, available, message: `Insufficient stock. Only ${available} ${prod.unit} of ${prod.name} is available.` };
  }
  return { ok: true, available };
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '✓';
  if (type === 'danger') icon = '✕';
  if (type === 'warning') icon = '⚠';
  if (type === 'info') icon = 'ℹ';

  toast.innerHTML = `<span style="font-weight: bold;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove after 3.5s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// Global Modal handlers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Initialize common page features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Update Real-time clock in header if present
  const clockElem = document.getElementById('live-clock');
  if (clockElem) {
    const updateClock = () => {
      const now = new Date();
      clockElem.textContent = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Close modals when clicking outside container
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });

  // Mobile sidebar toggle handler
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Render Current Admin in Sidebar Footer
  const sidebarFooter = document.querySelector('.sidebar-footer');
  if (sidebarFooter) {
    const admin = GMS_Store.getCurrentAdmin();
    const inPages = window.location.pathname.includes('/pages/');
    const profileUrl = inPages ? 'profile.html' : 'pages/profile.html';
    const loginUrl = inPages ? 'login.html' : 'login.html';

    if (admin) {
      sidebarFooter.innerHTML = `
        <a href="${profileUrl}" style="display: flex; align-items: center; gap: 12px; text-decoration: none; flex: 1; min-width: 0;">
          <div class="user-avatar">${admin.avatar || 'AD'}</div>
          <div class="user-info">
            <div class="user-name">${admin.name}</div>
            <div class="user-role">${admin.role || 'Admin'}</div>
          </div>
        </a>
        <button class="action-btn" title="Logout" style="border: none; background: rgba(255,255,255,0.1); color: #ef4444;" onclick="GMS_Store.logout()">
          🚪
        </button>
      `;
    }
  }
});
