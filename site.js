// =================== AUTHENTICATION VISIBILITY MANAGEMENT ===================
// Show/hide login/signup links based on user login state
function updateAuthVisibility() {
  const userId = localStorage.getItem('userId') || localStorage.getItem('token');
  const userName = localStorage.getItem('userName');
  const loginLinks = document.querySelectorAll('#loginLink');
  const signupLinks = document.querySelectorAll('#signupLink');
  const userDropdowns = document.querySelectorAll('#userDropdown');
  const userNameElements = document.querySelectorAll('#userName, #welcomeText');
  
  loginLinks.forEach(link => {
    if (userId) {
      link.style.setProperty('display', 'none', 'important');
    } else {
      link.style.display = link.closest('.mobile-menu') ? 'flex' : 'inline-block';
    }
  });

  signupLinks.forEach(link => {
    if (userId) {
      link.style.setProperty('display', 'none', 'important');
    } else {
      link.style.display = link.closest('.mobile-menu') ? 'flex' : 'inline-block';
    }
  });

  userDropdowns.forEach(dropdown => {
    if (userId) {
      dropdown.style.display = dropdown.closest('.mobile-menu') ? 'flex' : 'inline-block';
    } else {
      dropdown.style.setProperty('display', 'none', 'important');
    }
  });

  userNameElements.forEach(el => {
    if (userId && userName) {
      el.textContent = 'Welcome, ' + userName;
    } else if (userId) {
      el.textContent = 'Welcome, User';
    }
  });
}

// =================== GLOBAL CART TOGGLE ===================
// Navigate to cart page - available on all pages

// Ensure cart navigation works even if the inline onclick is missing
document.addEventListener('DOMContentLoaded', () => {
  const cartEls = document.querySelectorAll('.navbar-cart');
  cartEls.forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      // Call the existing toggleCart function to navigate
      if (typeof toggleCart === 'function') {
        toggleCart();
      } else {
        // Fallback navigation
        window.location.href = 'cart.html';
      }
    });
  });
});


// =================== CART UTILITY FUNCTIONS ===================
// Get current user ID
function getCurrentUserId() {
  return localStorage.getItem('userId') || 'guest';
}

// Get all cart items from localStorage
function getAllCartItems() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  let changed = false;
  for (const item of cart) {
    if (!item.cartItemId) {
      item.cartItemId = 'ci_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      changed = true;
    }
  }
  if (changed) localStorage.setItem('cart', JSON.stringify(cart));
  return cart;
}

// Get user's cart items
function getUserCartItems() {
  const uid = getCurrentUserId();
  const all = getAllCartItems();
  if (uid === 'guest') {
    return all.filter(i => !i.userId || i.userId === 'guest');
  }
  return all.filter(i => i.userId === uid);
}

// Update cart badge count
function updateCartBadge() {
  const cart = getUserCartItems();
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = totalItems;
}

// Mobile nav toggle for header
document.addEventListener('DOMContentLoaded', function () {
  // Update auth visibility on page load
  updateAuthVisibility();
  
  const toggle = document.querySelector('.nav-toggle');
  if (!toggle) return;

  const nav = document.querySelector('.navbar');
  let mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) {
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    
    // Collect all navigation links
    const links = [];
    
    // Get links from section1 (main navigation)
    const section1 = document.querySelector('.section1');
    if (section1) {
      const section1Links = Array.from(section1.querySelectorAll('a'));
      links.push(...section1Links);
    }
    
    // Get cart from section2 or section2-home (on all pages)
    const section2 = document.querySelector('.section2');
    const section2Home = document.querySelector('.section2-home');
    const authSection = section2 || section2Home;
    
    if (authSection) {
      // Add cart icon link
      const cartDiv = authSection.querySelector('.navbar-cart');
      if (cartDiv) {
        const cartLink = document.createElement('a');
        cartLink.href = '#';
        cartLink.innerHTML = '<i class="fas fa-shopping-cart"></i> Cart';
        cartLink.style.display = 'flex';
        cartLink.style.alignItems = 'center';
        cartLink.style.gap = '10px';
        cartLink.onclick = (e) => {
          e.preventDefault();
          toggleCart();
          mobileMenu.classList.remove('show');
        };
        links.push(cartLink);
      }
      
      // Add auth links
      const authLinks = Array.from(authSection.querySelectorAll('a'));
      authLinks.forEach(link => {
        if (!links.includes(link)) {
          links.push(link);
        }
      });
    }
    
    // Clone links into mobile menu
    links.forEach(a => {
      const clone = a.cloneNode(true);
      clone.style.display = 'flex'; // Ensure links are visible
      clone.addEventListener('click', function(e) {
        // Don't close menu if link has special onclick handlers
        const onclick = clone.getAttribute('onclick');
        if (!onclick) {
          mobileMenu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
      mobileMenu.appendChild(clone);
    });
    
    nav.appendChild(mobileMenu);
  }

  toggle.addEventListener('click', function () {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.classList.toggle('show');
  });

  // Close menu on outside click
  document.addEventListener('click', function (e) {
    if (!mobileMenu.contains(e.target) && !toggle.contains(e.target) && mobileMenu.classList.contains('show')) {
      mobileMenu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('show')) {
      mobileMenu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  
  // Listen for auth state changes and update visibility
  window.addEventListener('storage', function(event) {
    if (event.key === 'userId') {
      updateAuthVisibility();
    }
  });
});

// =================== PRODUCT STOCK BADGE ===================
// Shows live stock count on product detail page card buttons.
// Works for any page that has .add-product-btn buttons with
// onclick="addProduct('Product Name')" pattern.
(async function loadProductPageStocks() {
  const buttons = document.querySelectorAll('.add-product-btn');
  if (!buttons.length) return;

  const API_URL = (typeof window !== 'undefined' && window.API_URL)
    ? window.API_URL
    : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);

  for (const btn of buttons) {
    const onclickStr = btn.getAttribute('onclick') || '';
    const match = onclickStr.match(/addProduct\(['"](.*?)['"]\)/);
    if (!match) continue;
    const productName = match[1];

    // Create badge element next to the button
    const badge = document.createElement('span');
    badge.className = 'product-stock-badge';
    badge.style.cssText = [
      'display:inline-block',
      'font-size:11px',
      'font-weight:600',
      'padding:3px 10px',
      'border-radius:50px',
      'margin-top:6px',
      'letter-spacing:0.3px',
    ].join(';');
    // Insert badge below button
    btn.insertAdjacentElement('afterend', badge);

    try {
      const res = await fetch(
        `${API_URL}/api/products/stock/by-name?name=${encodeURIComponent(productName)}`
      );
      const data = await res.json();

      if (!data.success || !data.data) {
        badge.remove();
        continue;
      }

      const stock = data.data.stock || 0;

      if (stock <= 0) {
        badge.textContent = '❌ Out of Stock';
        badge.style.background = '#fce4ec';
        badge.style.color = '#c62828';
        badge.style.border = '1px solid #ef9a9a';
        btn.disabled = true;
        btn.style.opacity = '0.55';
        btn.style.cursor = 'not-allowed';
        btn.innerHTML = btn.innerHTML.replace('Add to Cart', 'Out of Stock');
      } else if (stock <= 10) {
        badge.textContent = `⚠️ Only ${stock} left!`;
        badge.style.background = '#fff3e0';
        badge.style.color = '#e65100';
        badge.style.border = '1px solid #ffcc80';
      } else {
        badge.textContent = `✅ ${stock} in stock`;
        badge.style.background = '#e8f5e9';
        badge.style.color = '#1b5e20';
        badge.style.border = '1px solid #a5d6a7';
      }
    } catch (e) {
      badge.remove();
    }
  }
})();

// Listen for stock refresh signal from checkout after order placed
window.addEventListener('storage', function(event) {
  if (event.key === 'stockNeedsRefresh' && event.newValue === 'true') {
    console.log('📢 Reloading product stock badges due to new order');
    // Reload the stock badges
    (async function refreshProductPageStocks() {
      const buttons = document.querySelectorAll('.add-product-btn');
      if (!buttons.length) return;
    
      const API_URL = (typeof window !== 'undefined' && window.API_URL)
        ? window.API_URL
        : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);
    
      for (const btn of buttons) {
        const onclickStr = btn.getAttribute('onclick') || '';
        const match = onclickStr.match(/addProduct\(['"](.*?)['"]\)/);
        if (!match) continue;
        const productName = match[1];
    
        // Find or create badge element
        let badge = btn.nextElementSibling;
        if (!badge || !badge.classList.contains('product-stock-badge')) {
          badge = document.createElement('span');
          badge.className = 'product-stock-badge';
          badge.style.cssText = [
            'display:inline-block',
            'font-size:11px',
            'font-weight:600',
            'padding:3px 10px',
            'border-radius:50px',
            'margin-top:6px',
            'letter-spacing:0.3px',
          ].join(';');
          btn.insertAdjacentElement('afterend', badge);
        }
    
        try {
          const res = await fetch(
            `${API_URL}/api/products/stock/by-name?name=${encodeURIComponent(productName)}`
          );
          const data = await res.json();
    
          if (!data.success || !data.data) {
            badge.remove();
            continue;
          }
    
          const stock = data.data.stock || 0;
    
          if (stock <= 0) {
            badge.textContent = '❌ Out of Stock';
            badge.style.background = '#fce4ec';
            badge.style.color = '#c62828';
            badge.style.border = '1px solid #ef9a9a';
            btn.disabled = true;
            btn.style.opacity = '0.55';
            btn.style.cursor = 'not-allowed';
            btn.innerHTML = btn.innerHTML.replace('Out of Stock', 'Out of Stock').replace('Add to Cart', 'Out of Stock');
          } else if (stock <= 10) {
            badge.textContent = `⚠️ Only ${stock} left!`;
            badge.style.background = '#fff3e0';
            badge.style.color = '#e65100';
            badge.style.border = '1px solid #ffcc80';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          } else {
            badge.textContent = `✅ ${stock} in stock`;
            badge.style.background = '#e8f5e9';
            badge.style.color = '#1b5e20';
            badge.style.border = '1px solid #a5d6a7';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          }
        } catch (e) {
          console.error('Error refreshing stock:', e);
        }
      }
    })();
  }
});

// =================== LOGIN PROMPT MODAL (30 SECONDS) ===================
document.addEventListener('DOMContentLoaded', function() {
  // Don't show login prompt on login or signup pages
  const currentPage = window.location.pathname;
  if (currentPage.includes('login.html') || currentPage.includes('signup.html')) {
    return;
  }

  // Check if user is logged in
  const userId = localStorage.getItem('userId');
  
  // If already logged in, don't show the prompt
  if (userId) {
    return;
  }

  // Create login prompt modal HTML
  const modalHTML = `
    <div class="login-prompt-overlay" id="loginPromptOverlay">
      <div class="login-prompt-modal">
        <h2>🌿 Unlock Your Best Experience</h2>
        <p>Join KCP Organics to enjoy personalized recommendations, track your orders, and manage your preferences.</p>
        <div class="button-group">
          <button class="btn-login" onclick="window.location.href='login.html'">Login</button>
          <button class="btn-signup" onclick="window.location.href='signup.html'">Sign Up</button>
          <button class="btn-dismiss" onclick="document.getElementById('loginPromptOverlay').classList.remove('show')">Dismiss</button>
        </div>
      </div>
    </div>
  `;

  // Inject modal into the body
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Show login prompt after 30 seconds
  setTimeout(() => {
    const overlay = document.getElementById('loginPromptOverlay');
    if (overlay && !localStorage.getItem('userId')) {
      overlay.classList.add('show');
    }
  }, 30000); // 30 seconds
});
// =================== GLOBAL USER FUNCTIONS ===================

/**
 * Logout user and clear session
 */
function logoutUser(event) {
  if (event) event.preventDefault();
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem('token');
  localStorage.removeItem('cart'); // Optional: clear cart on logout
  sessionStorage.removeItem('token');
  window.location.reload();
}

/**
 * Open My Orders modal
 */
async function openMyOrders(event) {
  if (event) event.preventDefault();
  const userId = localStorage.getItem('userId');
  
  if (!userId) {
    alert('Please login to view your orders');
    window.location.href = 'login.html';
    return;
  }

  // Create modal for orders
  const modal = document.createElement('div');
  modal.className = 'orders-modal';
  modal.id = 'myOrdersModal';
  modal.innerHTML = `
    <div class="orders-modal-content">
      <div class="orders-modal-header">
        <h2><i class="fas fa-history"></i> My Orders</h2>
        <button onclick="document.getElementById('myOrdersModal').remove()" class="close-btn">&times;</button>
      </div>
      <div class="orders-modal-body" id="ordersContainer">
        <div style="text-align: center; padding: 40px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #2e7d32;"></i>
          <p style="margin-top: 10px;">Loading your orders...</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal on click outside
  modal.onclick = function(e) {
    if (e.target === modal) modal.remove();
  };
  
  const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:5000/api' 
    : window.location.origin + '/api';

  try {
    const res = await fetch(`${API_BASE_URL}/orders/user/${userId}`);
    const data = await res.json();
    const container = document.getElementById('ordersContainer');
    
    if (data.success && data.data && data.data.length > 0) {
      container.innerHTML = data.data.map(order => `
        <div class="order-card">
          <div class="order-header">
            <span class="order-id"><strong>Order #${order.orderId || order._id.substring(0, 8).toUpperCase()}</strong></span>
            <span class="order-date">${new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
          <div class="order-items">
            ${order.products.map(item => `
              <div class="order-item">
                <span class="item-name">${item.name} × ${item.quantity}</span>
                <span class="item-price">₹${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="order-footer">
            <div>
              <span class="order-total"><strong>Total: ₹${order.totalAmount.toFixed(2)}</strong></span>
              <span class="order-status" style="background: ${getStatusColor(order.orderStatus)}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; margin-left: 10px;">
                ${order.orderStatus || 'Pending'}
              </span>
            </div>
            <button onclick="downloadReceiptPDF('${order._id}')" class="download-btn" style="background: #2e7d32; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
              <i class="fas fa-file-pdf"></i> Receipt
            </button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <i class="fas fa-box-open" style="font-size: 50px; color: #ccc; margin-bottom: 15px;"></i>
          <p style="color: #666; font-size: 16px;">You haven't placed any orders yet.</p>
          <a href="products.html" style="display: inline-block; margin-top: 20px; color: #2e7d32; font-weight: 600; text-decoration: none;">Start Shopping <i class="fas fa-arrow-right"></i></a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    document.getElementById('ordersContainer').innerHTML = `
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        <i class="fas fa-exclamation-circle" style="font-size: 32px;"></i>
        <p>Error loading orders. Please try again later.</p>
      </div>
    `;
  }
}

function getStatusColor(status) {
  status = (status || 'pending').toLowerCase();
  if (status === 'delivered') return '#2e7d32';
  if (status === 'shipped') return '#2196f3';
  if (status === 'cancelled') return '#e74c3c';
  return '#f39c12'; // pending
}

/**
 * Download Receipt as PDF
 */
/**
 * Download Receipt as PDF (Unified Global Version)
 */
async function downloadReceiptPDF(orderId) {
  const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:5000/api' 
    : window.location.origin + '/api';
  
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
    const data = await response.json();
    
    if (!data.success || !data.data) {
      alert('Unable to load order details');
      return;
    }

    const order = data.data;
    
    // Prepare order data for template (ensuring all fields exist)
    const orderData = {
      orderId: order.orderId || order._id.substring(0, 8).toUpperCase(),
      createdAt: new Date(order.createdAt).toLocaleDateString('en-IN'),
      paymentMethod: (order.paymentMethod || 'COD').toUpperCase(),
      customerName: order.customerName || 'Valued Customer',
      address: order.address || 'Address on file',
      customerPhone: order.customerPhone || '',
      customerEmail: order.customerEmail || '',
      products: order.products || [],
      subtotal: order.subtotal || (order.totalAmount / 1.05),
      tax: order.tax || (order.totalAmount - (order.totalAmount / 1.05)),
      totalAmount: order.totalAmount
    };

    // Use styled HTML approach if html2canvas is available
    if (window.html2canvas) {
      generateStyledInvoiceGlobal(orderData);
    } else {
      // Fallback to text-only jsPDF approach
      generateTextOnlyPdfGlobal(orderData);
    }
  } catch (error) {
    console.error('Error downloading receipt:', error);
    alert('Error downloading receipt');
  }
}

/**
 * Generate styled invoice using html2canvas
 */
function generateStyledInvoiceGlobal(orderData) {
  const billHTML = generateBillHTMLGlobal(orderData);
  const element = document.createElement('div');
  element.innerHTML = billHTML;
  element.style.padding = '40px';
  element.style.backgroundColor = 'white';
  element.style.width = '210mm';
  element.style.height = 'auto';
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.fontFamily = 'Arial, sans-serif';
  document.body.appendChild(element);

  // Load the logo into the element to ensure it's captured
  const logoImg = element.querySelector('img');
  if (logoImg) {
    logoImg.onload = () => captureAndSave();
    // In case it's already cached/loaded
    if (logoImg.complete) captureAndSave();
  } else {
    captureAndSave();
  }

  function captureAndSave() {
    html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true
    }).then(canvas => {
      const PDFClass = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
      if (!PDFClass) {
        document.body.removeChild(element);
        generateTextOnlyPdfGlobal(orderData);
        return;
      }

      const pdf = new PDFClass('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
      pdf.save(`KCP_Invoice_${orderData.orderId}.pdf`);
      document.body.removeChild(element);
    }).catch(err => {
      console.error('Canvas error:', err);
      if (document.body.contains(element)) document.body.removeChild(element);
      generateTextOnlyPdfGlobal(orderData);
    });
  }
}

/**
 * Text-only PDF fallback (original robust method)
 */
function generateTextOnlyPdfGlobal(order) {
  const PDFClass = window.jsPDF || (window.jspdf && window.jspdf.jsPDF);
  if (!PDFClass) {
    alert('PDF library not loaded');
    return;
  }

  const doc = new PDFClass('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;
  
  doc.setFontSize(18);
  doc.setTextColor(46, 125, 50);
  doc.setFont(undefined, 'bold');
  doc.text('KCP ORGANICS', pageWidth / 2, y, { align: 'center' });
  
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text('100% Organic | Farm Fresh to Your Doorstep', pageWidth / 2, y, { align: 'center' });
  
  y += 10;
  doc.setDrawColor(46, 125, 50);
  doc.line(15, y, pageWidth - 15, y);
  
  y += 10;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('INVOICE', 15, y);
  doc.setFontSize(9);
  doc.text(`Order ID: ${order.orderId}`, pageWidth - 15, y, { align: 'right' });
  
  y += 10;
  doc.text(`Customer: ${order.customerName}`, 15, y);
  doc.text(`Date: ${order.createdAt}`, pageWidth - 15, y, { align: 'right' });
  
  y += 15;
  doc.setFont(undefined, 'bold');
  doc.text('Product', 15, y);
  doc.text('Qty', 140, y);
  doc.text('Price', 160, y);
  doc.text('Total', pageWidth - 15, y, { align: 'right' });
  
  y += 2;
  doc.line(15, y, pageWidth - 15, y);
  doc.setFont(undefined, 'normal');
  
  order.products.forEach(item => {
    y += 8;
    doc.text(item.name, 15, y);
    doc.text(item.quantity.toString(), 140, y);
    doc.text(`₹${item.price}`, 160, y);
    doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, pageWidth - 15, y, { align: 'right' });
  });
  
  y += 10;
  doc.line(15, y, pageWidth - 15, y);
  y += 10;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Total Amount:', 140, y);
  doc.text(`₹${order.totalAmount.toFixed(2)}`, pageWidth - 15, y, { align: 'right' });
  
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for shopping with KCP Organics!', pageWidth / 2, y, { align: 'center' });

  doc.save(`Invoice_${order.orderId}.pdf`);
}

/**
 * Shared HTML Bill Template
 */
function generateBillHTMLGlobal(orderData) {
  let productsHTML = orderData.products.map((product, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${product.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${product.price.toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(product.price * product.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="width: 100%; color: #333; line-height: 1.6;">
      <div style="text-align: center; border-bottom: 2px solid #2e7d32; padding-bottom: 20px; margin-bottom: 30px;">
        <img src="logo_final.png" alt="Logo" style="max-height: 70px; margin-bottom: 10px;">
        <h1 style="color: #2e7d32; margin: 0; font-size: 28px;">KCP ORGANICS</h1>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">100% Organic | Farm Fresh to Your Doorstep</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="color: #2e7d32; font-size: 14px; margin-bottom: 10px; text-transform: uppercase;">Invoice Details</h3>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Order ID:</strong> ${orderData.orderId}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Date:</strong> ${orderData.createdAt}</p>
          <p style="margin: 3px 0; font-size: 13px;"><strong>Payment:</strong> ${orderData.paymentMethod}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="color: #2e7d32; font-size: 14px; margin-bottom: 10px; text-transform: uppercase;">Bill To</h3>
          <p style="margin: 3px 0; font-size: 13px;"><strong>${orderData.customerName}</strong></p>
          <p style="margin: 3px 0; font-size: 12px; max-width: 250px;">${orderData.address}</p>
          <p style="margin: 3px 0; font-size: 12px;">${orderData.customerPhone}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #2e7d32; color: white;">
            <th style="padding: 12px; text-align: center;">#</th>
            <th style="padding: 12px; text-align: left;">Product</th>
            <th style="padding: 12px; text-align: center;">Qty</th>
            <th style="padding: 12px; text-align: right;">Price</th>
            <th style="padding: 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>${productsHTML}</tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
            <span>Subtotal</span>
            <span>₹${orderData.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
            <span>Tax (5%)</span>
            <span>₹${orderData.tax.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; color: #2e7d32; font-weight: bold; font-size: 18px;">
            <span>Total</span>
            <span>₹${orderData.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; color: #999; font-size: 12px;">
        <p>Thank you for choosing KCP Organics!</p>
        <p>This is a computer generated invoice.</p>
      </div>
    </div>
  `;
}

/**
 * Global toggle cart function
 */
function toggleCart() {
  window.location.href = 'cart.html';
}

// ===========================================================
