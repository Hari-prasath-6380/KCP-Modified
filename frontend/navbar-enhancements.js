/* ==========================================
   KCP ORGANICS — NAVBAR ENHANCEMENTS
   Shared controller for ALL pages.
   Handles: scroll progress bar, navbar shrink,
   active link, mobile menu, cart bump, reveal.
   ========================================== */
(function () {
    'use strict';

    // 1. Inject scroll progress bar
    if (!document.getElementById('scrollProgress')) {
        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        bar.id = 'scrollProgress';
        document.body.prepend(bar);
    }

    // 2. Reveal-on-scroll classes
    var selectors = [
        '.mission-vision-section', '.organic-info-section',
        '.organic-poster-section', '.reviews-section',
        '.newsletter-section', '.message-section',
        '.recipe-videos-section', '.dynamic-products-section',
        '.mv-card', '.benefit-card', '.review-card',
        '.poster-content', '.organic-poster-section .poster-image',
        '.section-header-products', '.organic-header',
        '.message-info', '.message-form-container',
        '.write-review-section'
    ];
    selectors.forEach(function (sel) {
        var els = document.querySelectorAll(sel);
        var idx = 0;
        els.forEach(function (el) {
            if (!el.classList.contains('reveal')) {
                el.classList.add('reveal');
                el.style.transitionDelay = Math.min(idx * 80, 600) + 'ms';
                idx++;
            }
        });
    });

    // 3. IntersectionObserver
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('in-view');
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    } else {
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in-view'); });
    }

    // 4. Scroll handler
    var navbar = document.querySelector('.navbar');
    var pbar = document.getElementById('scrollProgress');
    function onScroll() {
        if (navbar) {
            if (window.scrollY > 40) navbar.classList.add('scrolled');
            else navbar.classList.remove('scrolled');
        }
        if (pbar) {
            var h = document.documentElement;
            var total = (h.scrollHeight - h.clientHeight) || 1;
            pbar.style.width = Math.min(100, Math.max(0, (window.scrollY / total) * 100)) + '%';
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 5. Active nav link
    try {
        var path = (window.location.pathname || '').split('/').pop() || 'home.html';
        document.querySelectorAll('.section1 a').forEach(function (a) {
            var href = (a.getAttribute('href') || '').split('?')[0].split('/').pop();
            if (href === path) a.classList.add('active');
        });
    } catch (e) { }

    // 6. Product card stagger
    document.querySelectorAll('.slider > .slide-track > .product-card').forEach(function (c, i) {
        c.style.animation = 'scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) ' + (0.05 * (i % 15)) + 's both';
    });

    // 7. Mobile menu
    var tog = document.querySelector('.nav-toggle');
    var menu = document.querySelector('.mobile-menu');
    if (tog && menu) {
        tog.addEventListener('click', function () {
            var open = menu.classList.toggle('show');
            tog.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        menu.querySelectorAll('a').forEach(function (l) {
            l.addEventListener('click', function () {
                menu.classList.remove('show');
                tog.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // 8. Cart badge bump
    (function () {
        var badge = document.getElementById('cartBadge');
        if (!badge || !window.MutationObserver) return;
        var prev = parseInt(badge.textContent || '0', 10) || 0;
        new MutationObserver(function () {
            var cur = parseInt(badge.textContent || '0', 10) || 0;
            if (cur > prev) {
                badge.classList.remove('bump');
                void badge.offsetWidth;
                badge.classList.add('bump');
            }
            prev = cur;
        }).observe(badge, { childList: true, characterData: true, subtree: true });
    })();
})();