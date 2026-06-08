document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.admin-nav-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (!toggle || !sidebar) return;

  // Detect if device supports touch
  const isTouchDevice = () => {
    return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
  };

  if (isTouchDevice()) {
    document.documentElement.classList.add('touch');
  }

  // Initialize collapsed state on small screens (hidden by default)
  const isSmall = window.innerWidth <= 992;
  if (isSmall) {
    sidebar.classList.add('collapsed');
    toggle.setAttribute('aria-expanded', 'false');
  } else {
    sidebar.classList.remove('collapsed');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (isCollapsed) {
      // Show sidebar
      sidebar.classList.remove('collapsed');
      sidebar.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      showOverlay();
      // prevent body scroll when sidebar open
      document.body.classList.add('sidebar-open');
    } else {
      // Hide sidebar
      sidebar.classList.add('collapsed');
      sidebar.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      removeOverlay();
      document.body.classList.remove('sidebar-open');
    }
  });

  // Close sidebar when clicking outside on small screens
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992 && !sidebar.contains(e.target) && !toggle.contains(e.target) && !sidebar.classList.contains('collapsed')) {
      sidebar.classList.add('collapsed');
      toggle.setAttribute('aria-expanded', 'false');
      removeOverlay();
    }
  });

  // NOTE: Navigation click handling is now managed by admin-script.js (setupNavigation)
  // to avoid duplicate handlers and conflicting title/section updates.
  // We only need to auto-hide the sidebar on small screens after a section change.
  document.addEventListener('click', (e) => {
    const clickedNav = e.target.closest && e.target.closest('.nav-item');
    if (clickedNav && window.innerWidth <= 992) {
      sidebar.classList.add('collapsed');
      sidebar.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      removeOverlay();
      document.body.classList.remove('sidebar-open');
    }
  });

  // Ensure sidebar is visible on large screens after resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
      sidebar.classList.remove('collapsed');
      toggle.setAttribute('aria-expanded', 'true');
    } else {
      sidebar.classList.add('collapsed');
      toggle.setAttribute('aria-expanded', 'false');
      removeOverlay();
    }
  });

  // Overlay helpers to dim page when sidebar is open on mobile
  function showOverlay() {
    let ov = document.querySelector('.admin-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'admin-overlay';
      document.body.appendChild(ov);
      ov.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
        toggle.setAttribute('aria-expanded', 'false');
        removeOverlay();
      });
      // Handle touch events
      ov.addEventListener('touchstart', () => {
        sidebar.classList.add('collapsed');
        toggle.setAttribute('aria-expanded', 'false');
        removeOverlay();
      });
    }
    ov.classList.add('show');
  }

  function removeOverlay() {
    const ov = document.querySelector('.admin-overlay');
    if (ov) ov.classList.remove('show');
  }
});
