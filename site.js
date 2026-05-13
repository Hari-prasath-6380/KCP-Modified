// =================== AUTHENTICATION VISIBILITY MANAGEMENT ===================
// Show/hide login/signup links based on user login state
function updateAuthVisibility() {
  const userId = localStorage.getItem('userId');
  const loginLink = document.getElementById('loginLink');
  const signupLink = document.getElementById('signupLink');
  const userDropdown = document.getElementById('userDropdown');
  
  if (userId) {
    // User is logged in - hide login/signup, show user dropdown
    if (loginLink) loginLink.style.display = 'none';
    if (signupLink) signupLink.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'inline-block';
  } else {
    // User is not logged in - show login/signup, hide user dropdown
    if (loginLink) loginLink.style.display = 'inline-block';
    if (signupLink) signupLink.style.display = 'inline-block';
    if (userDropdown) userDropdown.style.display = 'none';
  }
}

// =================== GLOBAL CART TOGGLE ===================
// Navigate to cart page - available on all pages
function toggleCart() {
  window.location.href = 'cart.html';
}

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
    : 'https://kcp-organics-1.onrender.com';

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
        : 'https://kcp-organics-1.onrender.com';
    
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
// ===========================================================
// ===========================================================
