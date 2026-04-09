/* ============================================
   VERVELIO — Application Logic
   Theme switching, scroll behavior, animations
   ============================================ */

(function () {
  'use strict';

  // --- THEME MANAGEMENT ---
  const html = document.documentElement;
  let currentTheme = 'green'; // default

  function setTheme(theme) {
    currentTheme = theme;
    html.setAttribute('data-theme', theme);

    // Update body font-family dynamically
    if (theme === 'green') {
      document.body.style.fontFamily = "'JetBrains Mono', 'Courier New', monospace";
    } else {
      document.body.style.fontFamily = "'Inter', 'Helvetica Neue', sans-serif";
    }

    // Update active state on all theme buttons
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-theme-set') === theme);
    });
  }

  // Initialize theme
  setTheme('green');

  // Listen for theme button clicks
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.theme-btn[data-theme-set]');
    if (btn) {
      var theme = btn.getAttribute('data-theme-set');
      setTheme(theme);

      // Close mobile nav if open
      var overlay = document.getElementById('mobileNav');
      var menuBtn = document.querySelector('.mobile-menu-btn');
      if (overlay && overlay.classList.contains('open')) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        menuBtn.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }
  });

  // --- MOBILE MENU ---
  var menuBtn = document.querySelector('.mobile-menu-btn');
  var mobileNav = document.getElementById('mobileNav');

  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      menuBtn.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', String(isOpen));
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  // --- HEADER SCROLL BEHAVIOR ---
  var header = document.getElementById('header');
  var lastScroll = 0;
  var scrollThreshold = 80;

  window.addEventListener('scroll', function () {
    var currentScroll = window.scrollY;

    if (currentScroll > scrollThreshold) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }

    // Hide header on scroll down, show on scroll up
    if (currentScroll > lastScroll && currentScroll > 200) {
      header.classList.add('header--hidden');
    } else {
      header.classList.remove('header--hidden');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // --- HERO TYPING ANIMATION ---
  var heroLines = document.querySelectorAll('.hero .terminal-line, .hero .terminal-output');
  heroLines.forEach(function (el) {
    var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
    setTimeout(function () {
      el.classList.add('visible');
    }, delay + 300); // +300ms for initial page load
  });

  // --- SCROLL REVEAL FALLBACK ---
  // For browsers that don't support animation-timeline: scroll()
  if (!CSS.supports('animation-timeline: scroll()')) {
    var fadeEls = document.querySelectorAll('.fade-in');

    if (fadeEls.length > 0) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      });

      fadeEls.forEach(function (el) { observer.observe(el); });
    }
  }

  // --- SECTION REVEAL (intersection) ---
  var sections = document.querySelectorAll('.section');
  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        sectionObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -20px 0px'
  });

  sections.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
    sectionObserver.observe(el);
  });

})();
