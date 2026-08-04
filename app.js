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
  // Set by the sound mixer below. While audio is playing the header must stay
  // put: the mute control lives in it, and hiding it would leave a visitor with
  // sound they can hear but can't switch off without scrolling back up.
  var soundOn = false;

  window.addEventListener('scroll', function () {
    var currentScroll = window.scrollY;

    if (currentScroll > scrollThreshold) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }

    // Hide header on scroll down, show on scroll up - unless sound is on, in
    // which case the mute control must remain reachable at all times.
    if (!soundOn && currentScroll > lastScroll && currentScroll > 200) {
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
        // The soundtrack follows the eye. We report how visible this panel is and
        // let the mixer decide which single track should be audible.
        // `mixer` is assigned further down; observer callbacks are async, so it
        // is always ready by the time this runs.
        if (mixer) {
          mixer.setVisibility(
            entry.target.getAttribute('data-seq'),
            entry.isIntersecting ? entry.intersectionRatio : 0
          );
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

  // --- AMBIENT SOUND ---
  // Armed ON by default. Browsers refuse to start audio without a user gesture,
  // so we cannot literally autoplay: instead the control shows ON from the first
  // paint and playback begins on the visitor's first click, tap or keypress.
  // They never have to opt in - only opt out, and that choice is remembered.
  //
  // Exactly ONE track is audible at a time: the texture of whichever diorama is
  // most visible, and silence when none is.
  var mixer = null;

  (function initMixer() {
    var soundToggle = document.getElementById('soundToggle');
    if (!soundToggle) return;

    var LAYER_VOLUME = 0.6;
    var SWITCH_RATIO = 0.25; // how visible a diorama must be to claim the audio
    var SOUND_KEY = 'vervelio:sound';
    var HINT_KEY = 'vervelio:soundHintSeen';

    var layers = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-layer]'), function (el) {
      layers[el.getAttribute('data-layer')] = el;
      el.volume = 0;
    });
    if (Object.keys(layers).length === 0) return;

    function readPref(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writePref(key, value) {
      try { localStorage.setItem(key, value); } catch (e) { /* non-fatal */ }
    }

    // Default ON: only an explicit previous "off" opts out.
    var enabled = readPref(SOUND_KEY) !== 'off';
    var unlocked = false;
    var ratios = {};
    var active = null;

    soundToggle.setAttribute('aria-pressed', String(enabled));
    soundToggle.setAttribute('aria-label', enabled ? 'Turn off ambient sound' : 'Turn on ambient sound');
    soundOn = enabled;

    // Independent fade state per element, so one track fading out cannot cancel
    // the fade of the track coming in.
    function fade(el, target, done) {
      if (el._fadeTimer) clearInterval(el._fadeTimer);
      el._fadeTimer = setInterval(function () {
        var delta = target - el.volume;
        if (Math.abs(delta) < 0.015) {
          el.volume = Math.min(1, Math.max(0, target));
          clearInterval(el._fadeTimer);
          el._fadeTimer = null;
          if (done) done();
          return;
        }
        el.volume = Math.min(1, Math.max(0, el.volume + delta * 0.14));
      }, 40);
    }

    // Most-visible diorama wins, and must clear SWITCH_RATIO to take over.
    // Returns null when nothing qualifies - meaning silence.
    function winner() {
      var best = null;
      var bestRatio = 0;
      Object.keys(ratios).forEach(function (name) {
        if (layers[name] && ratios[name] > bestRatio) {
          bestRatio = ratios[name];
          best = name;
        }
      });
      return bestRatio >= SWITCH_RATIO ? best : null;
    }

    function startTrack(name) {
      var el = layers[name];
      if (!el) return;
      if (!el.paused) { fade(el, LAYER_VOLUME); return; }
      el.currentTime = 0;
      el.volume = 0;
      var p = el.play();
      if (!p || typeof p.then !== 'function') { fade(el, LAYER_VOLUME); return; }
      p.then(function () {
        // Ramp up ONLY once playback has actually begun. Fading a refused or
        // interrupted element leaves it paused at full volume - silent, but it
        // reports as "playing at 0.6" to anything inspecting it.
        if (active === name) fade(el, LAYER_VOLUME);
      }).catch(function () {
        el.volume = 0;
        if (active === name) active = null;
        showBlockedHint();
      });
    }

    function stopTrack(name) {
      var el = layers[name];
      if (!el) return;
      fade(el, 0, function () {
        if (active !== name) el.pause();
      });
    }

    function updateMix() {
      if (!enabled || !unlocked) return;
      var target = winner();
      if (target === active) return;
      var previous = active;
      active = target;
      if (previous) stopTrack(previous);
      if (target) startTrack(target);
    }

    function stopAll() {
      active = null;
      Object.keys(layers).forEach(function (name) {
        var el = layers[name];
        fade(el, 0, function () { el.pause(); });
      });
    }

    // --- one-time hint ---
    var hint = document.getElementById('soundHint');
    var hintTimer = null;

    function hideHint() {
      if (!hint) return;
      if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
      hint.classList.remove('is-visible');
      setTimeout(function () { hint.hidden = true; }, 400);
    }

    // Two states, because a visitor who only ever SCROLLS never authorises audio:
    // browsers deliberately exclude scroll/wheel from the gestures that permit
    // playback. Without the 'blocked' message such a visitor sees a speaker icon
    // showing 'on' while hearing nothing, with no explanation. So when playback is
    // armed but refused, the hint becomes an invitation instead of a status.
    function showHint(message, opts) {
      if (!hint) return;
      var persistent = opts && opts.persistent;
      if (!persistent && readPref(HINT_KEY) === 'yes') return;
      if (!persistent) writePref(HINT_KEY, 'yes');
      hint.querySelector('.sound-hint-text').textContent = message;
      if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
      hint.hidden = false;
      // Next frame, so the transition runs instead of snapping.
      requestAnimationFrame(function () { hint.classList.add('is-visible'); });
      hintTimer = setTimeout(hideHint, persistent ? 9000 : 6000);
    }

    function maybeShowHint() {
      showHint('Sound is on — tap to mute');
    }

    function showBlockedHint() {
      // Not gated on HINT_KEY: this one is an actionable invitation, and a visitor
      // who has not yet enabled sound has not seen its outcome.
      if (readPref(SOUND_KEY) === 'off') return;
      showHint('Click anywhere for sound', { persistent: true });
    }

    if (hint) {
      hint.querySelector('.sound-hint-close').addEventListener('click', function (e) {
        e.stopPropagation();
        hideHint();
      });
    }

    // Autoplay is gated on a trusted gesture, so unlock every track silently the
    // first time one arrives. Note: scrolling does NOT count as a gesture in
    // Chrome, which is why we listen for pointer/key/touch specifically.
    var GESTURES = ['pointerdown', 'keydown', 'touchend'];

    function onFirstGesture() {
      GESTURES.forEach(function (type) {
        document.removeEventListener(type, onFirstGesture, true);
      });
      if (!enabled) return;
      unlock().then(function (ok) {
        if (!ok) return;
        updateMix();
        maybeShowHint();
      });
    }

    // Probe ONE element, not all four. Autoplay permission is per-document, so a
    // single successful play() authorises every track. Playing and pausing all
    // four raced the first real startTrack(): its play() got interrupted, the
    // rejection was swallowed, and the track sat paused at full volume.
    function unlock() {
      if (unlocked) return Promise.resolve(true);
      var probe = layers[Object.keys(layers)[0]];
      if (!probe) return Promise.resolve(false);
      probe.volume = 0;
      var p = probe.play();
      if (!p || typeof p.then !== 'function') {
        probe.pause();
        unlocked = true;
        return Promise.resolve(true);
      }
      return p.then(function () {
        probe.pause();
        unlocked = true;
        return true;
      }).catch(function () {
        unlocked = false;
        return false;
      });
    }

    GESTURES.forEach(function (type) {
      document.addEventListener(type, onFirstGesture, true);
    });

    // Some browsers (and returning visitors with prior engagement) allow audio
    // straight away - try once so those visitors need no gesture at all. If it is
    // refused, invite the visitor to click, because scrolling alone never will
    // authorise playback and they would otherwise get silence with no explanation.
    if (enabled) {
      unlock().then(function (ok) {
        if (ok) { updateMix(); maybeShowHint(); }
        else showBlockedHint();
      });
    }

    soundToggle.addEventListener('click', function () {
      enabled = !enabled;
      soundOn = enabled;
      soundToggle.setAttribute('aria-pressed', String(enabled));
      soundToggle.setAttribute('aria-label', enabled ? 'Turn off ambient sound' : 'Turn on ambient sound');
      writePref(SOUND_KEY, enabled ? 'on' : 'off');
      hideHint();

      if (!enabled) {
        stopAll();
        return;
      }
      // This click is itself a trusted gesture, so playback can start now.
      unlock().then(function (ok) {
        if (ok) updateMix();
      });
    });

    mixer = {
      setVisibility: function (name, ratio) {
        if (!name || !layers[name]) return;
        ratios[name] = ratio;
        updateMix();
      }
    };
  })();

})();
