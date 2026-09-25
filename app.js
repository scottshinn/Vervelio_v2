/* ============================================
   VERVELIO - Application Logic
   Theme switching, scroll behavior, animations
   ============================================ */

(function () {
  'use strict';

  // --- THEME MANAGEMENT ---
  const html = document.documentElement;

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);

    // The typeface comes from the theme's own --font-body token (see style.css),
    // NOT from an inline style here. Setting it in JS meant any change to
    // data-theme that bypassed this function left the font out of step with the
    // colours - green terminal colours rendered in the sans-serif face.

    // Update active state on all theme buttons
    document.querySelectorAll('.theme-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-theme-set') === theme);
    });
  }

  // Initialize theme - restore the visitor's last choice, else default to green
  var STORED_THEME_KEY = 'vervelio:theme';
  var VALID_THEMES = ['green', 'black', 'white'];
  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem(STORED_THEME_KEY);
  } catch (e) {
    // Private mode / storage disabled - fall through to the default.
  }
  setTheme(VALID_THEMES.indexOf(savedTheme) !== -1 ? savedTheme : 'green');

  function closeMobileNav() {
    var overlay = document.getElementById('mobileNav');
    var toggle = document.querySelector('.mobile-menu-btn');
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (toggle) {
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.theme-btn[data-theme-set]');
    if (btn) {
      var theme = btn.getAttribute('data-theme-set');
      setTheme(theme);
      try {
        localStorage.setItem(STORED_THEME_KEY, theme);
      } catch (err) {
        // Non-fatal: the theme still applies for this session.
      }
      closeMobileNav();
      return;
    }

    // A section link inside the overlay must also dismiss it, or the menu stays
    // open covering the very section the visitor just jumped to.
    if (e.target.closest('.mobile-nav-overlay a[href^="#"]')) {
      closeMobileNav();
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

    // Hide header on scroll down, show on scroll up.
    if (currentScroll > lastScroll && currentScroll > 200) {
      header.classList.add('header--hidden');
    } else {
      header.classList.remove('header--hidden');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // --- HERO TYPING ANIMATION ---
  var heroLines = document.querySelectorAll('.hero .terminal-line, .hero .terminal-output, .hero .hero-actions');
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

  // --- ACTIVE NAV STATE ---
  // Highlight the header link for whichever linked section currently dominates
  // the viewport, so the visitor always knows where they are on the page.
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link[href^="#"]'));
  if (navLinks.length > 0) {
    var linkFor = {};
    var linkedSections = [];
    navLinks.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) { linkFor[el.id] = a; linkedSections.push(el); }
    });

    var navRatios = {};
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        navRatios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var best = null, bestRatio = 0.05; // small floor so nothing lights up between sections
      Object.keys(navRatios).forEach(function (id) {
        if (navRatios[id] > bestRatio) { bestRatio = navRatios[id]; best = id; }
      });
      navLinks.forEach(function (a) { a.classList.remove('is-active'); });
      if (best && linkFor[best]) linkFor[best].classList.add('is-active');
    }, { threshold: [0, 0.15, 0.35, 0.6] });

    linkedSections.forEach(function (el) { navObserver.observe(el); });
  }

  // --- STOP-MOTION SEQUENCES ---
  // Each panel holds 6 stacked frames. We play them yo-yo (1→6→1) rather than
  // looping 6→1, so the sequence reads as a continuous breathing motion with no
  // jump cut at the seam. Frames swap with a hard cut - a crossfade would read
  // as video and kill the stop-motion feel.
  var FRAME_MS = 150;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createSequence(root) {
    var frames = Array.prototype.slice.call(root.querySelectorAll('.sm-frame'));
    if (frames.length < 2) return null;

    var index = 0;
    var direction = 1;
    var timer = null;
    var loaded = false;

    function load() {
      if (loaded) return;
      loaded = true;
      frames.forEach(function (img) {
        var src = img.getAttribute('data-src');
        if (src && !img.getAttribute('src')) {
          img.setAttribute('src', src);
        }
      });
    }

    function show(next) {
      frames[index].classList.remove('sm-frame--active');
      frames[next].classList.add('sm-frame--active');
      index = next;
    }

    function tick() {
      // Bounce at either end so playback ping-pongs instead of wrapping.
      if (index + direction >= frames.length || index + direction < 0) {
        direction *= -1;
      }
      show(index + direction);
    }

    return {
      start: function () {
        // Nothing to load or animate if the visitor asked for reduced motion -
        // they keep the first frame as a still and we skip 5 needless requests.
        if (prefersReducedMotion) return;
        load();
        if (timer !== null) return;
        timer = setInterval(tick, FRAME_MS);
      },
      stop: function () {
        if (timer === null) return;
        clearInterval(timer);
        timer = null;
      }
    };
  }

  var panels = document.querySelectorAll('.stopmotion');

  if (panels.length > 0) {
    var seqObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var seq = entry.target._seq;
        if (!seq) return;
        // Only animate what's on screen - keeps three sequences off the CPU
        // when the visitor is elsewhere on the page.
        if (entry.isIntersecting) {
          seq.start();
        } else {
          seq.stop();
        }
      });
      // Multiple thresholds keep the ratios fresh enough to pick a winner while
      // scrolling, without firing on every pixel.
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    panels.forEach(function (panel) {
      var seq = createSequence(panel);
      if (!seq) return;
      panel._seq = seq;
      seqObserver.observe(panel);
    });
  }

})();
