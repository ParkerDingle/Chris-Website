document.addEventListener("DOMContentLoaded", () => {

  /* ---- Progress Bar ---- */
  const progressBar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const scrollable = document.body.scrollHeight - window.innerHeight;
    const scrolled   = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (progressBar) progressBar.style.width = scrolled + '%';
  }, { passive: true });


  /* ---- Tab Navigation ---- */
  const tabLinks    = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');

  function activateTab(targetId) {
    tabLinks.forEach(l    => l.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active-tab'));

    const link = document.querySelector(`.tab-link[data-target="${targetId}"]`);
    const section = document.getElementById(targetId);

    if (link)    link.classList.add('active');
    if (section) {
      section.classList.add('active-tab');
      setTimeout(checkReveals, 60);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      activateTab(this.getAttribute('data-target'));
    });
  });


  /* ---- Animated Counter ---- */
  function animateCounter(el) {
    const target   = parseFloat(el.getAttribute('data-target'));
    const suffix   = el.getAttribute('data-suffix') || '';
    const isFloat  = target % 1 !== 0;
    const duration = 1800;
    const fps      = 60;
    const steps    = Math.round(duration / (1000 / fps));
    let   frame    = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / steps;
      const eased    = 1 - Math.pow(1 - progress, 3);
      let current    = target * eased;

      if (frame >= steps) {
        current = target;
        clearInterval(timer);
      }

      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
    }, 1000 / fps);
  }


  /* ---- Intersection Observer: Counters ---- */
  const counterEls = document.querySelectorAll('.stat-number[data-target]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counterEls.forEach(el => counterObserver.observe(el));


  /* ---- Intersection Observer: Scroll Reveals ---- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  function checkReveals() {
    document.querySelectorAll('.reveal, .theory-item, .example-card').forEach(el => {
      revealObserver.observe(el);
    });
  }

  checkReveals();


  /* ============================================================
     EXAMPLE VISUALIZATION TOGGLES — generic multi-sport handler
     Each .swarm-visual container is handled independently.
  ============================================================ */
  document.querySelectorAll('.swarm-visual').forEach(container => {
    const buttons = container.querySelectorAll('.swarm-btn');
    const field   = container.querySelector('svg');
    const caption = container.querySelector('.swarm-caption');

    // Collect all possible mode class names in this visualization
    const allModes = [...buttons].map(b => b.getAttribute('data-mode')).filter(Boolean);

    buttons.forEach(btn => {
      btn.addEventListener('click', function () {
        if (this.classList.contains('active')) return;

        const mode = this.getAttribute('data-mode');
        const captionText = this.getAttribute('data-caption');

        // Toggle active button
        buttons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        // Swap mode classes on the SVG + force reflow for clean animation restart
        if (field) {
          allModes.forEach(m => field.classList.remove(m));
          void field.offsetWidth;
          field.classList.add(mode);
        }

        // Update caption (HTML allowed via data-caption)
        if (caption && captionText) {
          caption.innerHTML = captionText;
        }
      });
    });
  });


  /* ============================================================
     CITATIONS FILTER — FLIP-based smooth transitions
     Animates existing cards smoothly to their new grid positions
     while fading others in/out.
  ============================================================ */
  const citeFilterBtns = document.querySelectorAll('.cite-filter-btn');
  const referenceCards = [...document.querySelectorAll('.reference-card')];
  let   isFiltering    = false;

  function clearInlineStyles(card) {
    card.style.transition = '';
    card.style.transform  = '';
    card.style.opacity    = '';
  }

  function filterReferences(filter) {
    if (isFiltering) return;
    isFiltering = true;

    // 1. FIRST — record current positions of all currently-visible cards
    const firstRects = new Map();
    referenceCards.forEach(card => {
      if (!card.classList.contains('hidden')) {
        firstRects.set(card, card.getBoundingClientRect());
      }
    });

    // 2. Determine new state for each card
    const staying     = [];
    const disappearing = [];
    const appearing    = [];

    referenceCards.forEach(card => {
      const cat     = card.getAttribute('data-category');
      const show    = (filter === 'all' || cat === filter);
      const wasVis  = firstRects.has(card);

      if ( wasVis &&  show) staying.push(card);
      if ( wasVis && !show) disappearing.push(card);
      if (!wasVis &&  show) appearing.push(card);
    });

    // 3. Fade out disappearing cards first
    disappearing.forEach(card => {
      card.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
      card.style.opacity    = '0';
      card.style.transform  = 'scale(0.94)';
    });

    // 4. After fade-out completes, restructure grid + FLIP
    const fadeOutDelay = disappearing.length ? 230 : 0;

    setTimeout(() => {
      // Remove disappearing cards from grid
      disappearing.forEach(card => {
        card.classList.add('hidden');
        clearInlineStyles(card);
      });

      // Pre-hide appearing cards (they'll be placed in the grid but invisible)
      appearing.forEach(card => {
        card.classList.remove('hidden');
        card.style.transition = 'none';
        card.style.opacity    = '0';
        card.style.transform  = 'scale(0.94)';
      });

      // 5. LAST — measure new positions after DOM changes
      requestAnimationFrame(() => {
        const lastRects = new Map();
        [...staying, ...appearing].forEach(card => {
          lastRects.set(card, card.getBoundingClientRect());
        });

        // 6. INVERT — apply reverse transforms to staying cards
        staying.forEach(card => {
          const first = firstRects.get(card);
          const last  = lastRects.get(card);
          const dx    = first.left - last.left;
          const dy    = first.top  - last.top;

          if (dx !== 0 || dy !== 0) {
            card.style.transition = 'none';
            card.style.transform  = `translate(${dx}px, ${dy}px)`;
          }
        });

        // 7. PLAY — animate back to natural position + fade in new cards
        requestAnimationFrame(() => {
          staying.forEach(card => {
            card.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';
            card.style.transform  = '';
          });

          appearing.forEach((card, i) => {
            setTimeout(() => {
              card.style.transition = 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
              card.style.opacity    = '1';
              card.style.transform  = '';
            }, 60 + i * 35);
          });

          // Cleanup inline styles after animations finish
          setTimeout(() => {
            [...staying, ...appearing].forEach(clearInlineStyles);
            isFiltering = false;
          }, 650 + appearing.length * 35);
        });
      });
    }, fadeOutDelay);
  }

  citeFilterBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      if (this.classList.contains('active')) return;
      citeFilterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filterReferences(this.getAttribute('data-filter'));
    });
  });

});