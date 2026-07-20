(() => {
  const toggles = document.querySelectorAll('.menu-toggle');

  function closeMenu(button, nav) {
    nav.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
    button.textContent = 'Menu';
    document.body.classList.remove('nav-open');
  }

  toggles.forEach((button) => {
    const nav = button.parentElement.querySelector('.nav');
    if (!nav) return;

    button.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      button.textContent = open ? 'Close' : 'Menu';
      document.body.classList.toggle('nav-open', open);
      if (open) nav.querySelector('a')?.focus({ preventScroll: true });
    });

    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu(button, nav);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu(button, nav);
        button.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (nav.classList.contains('open') && !button.parentElement.contains(event.target)) {
        closeMenu(button, nav);
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1400) {
      toggles.forEach((button) => {
        const nav = button.parentElement.querySelector('.nav');
        if (nav) closeMenu(button, nav);
      });
    }
  }, { passive: true });

  // Make existing chapter-spread lightboxes keyboard and screen-reader friendly.
  const zoomableImages = document.querySelectorAll('.spread img, .page-spread img');
  zoomableImages.forEach((image) => {
    image.setAttribute('role', 'button');
    image.setAttribute('tabindex', '0');
    image.setAttribute('aria-label', `View larger: ${image.alt || 'chapter image'}`);
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        image.click();
      }
    });
  });

  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const closeButton = lightbox.querySelector('button');
    let returnFocus = null;

    const syncLightboxState = () => {
      const open = lightbox.classList.contains('open');
      lightbox.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('lightbox-open', open);
      if (open) {
        returnFocus = document.activeElement;
        closeButton?.focus({ preventScroll: true });
      } else if (returnFocus instanceof HTMLElement) {
        returnFocus.focus({ preventScroll: true });
        returnFocus = null;
      }
    };

    new MutationObserver(syncLightboxState).observe(lightbox, {
      attributes: true,
      attributeFilter: ['class']
    });
    syncLightboxState();
  }



  // v028.5a trip dashboard and locally saved reservation checklist.
  const countdown = document.querySelector('[data-trip-countdown]');
  const dashboard = document.querySelector('[data-trip-dashboard]');
  const tripDays = [
    {start:'2026-08-31',end:'2026-09-01',title:'Venice',summary:'Arrive, settle in and explore the Grand Canal, San Marco and quieter evening streets.',link:'venice.html'},
    {start:'2026-09-02',end:'2026-09-03',title:'Ortisei · Dolomites',summary:'Mountain lifts, moderate walks and broad views across Val Gardena.',link:'dolomites.html'},
    {start:'2026-09-04',end:'2026-09-05',title:'Cinque Terre',summary:'Move among the five villages by train, ferry and coastal paths.',link:'cinque-terre.html'},
    {start:'2026-09-06',end:'2026-09-07',title:'Varenna · Lake Como',summary:'Villa Monastero, Bellagio ferries and relaxed lakefront evenings.',link:'lake-como.html'},
    {start:'2026-09-08',end:'2026-09-09',title:'Stresa · Lake Maggiore',summary:'Borromean Islands, gardens and an easy final lakeside chapter.',link:'lake-maggiore.html'},
    {start:'2026-09-10',end:'2026-09-10',title:'Malpensa departure',summary:'Early departure for Milan Malpensa Airport.',link:'practical.html'}
  ];
  const localDate = (value) => new Date(value + 'T12:00:00');
  const today = new Date(); today.setHours(12,0,0,0);
  if (countdown) {
    const start = localDate(countdown.dataset.start);
    const days = Math.ceil((start - today) / 86400000);
    const strong = countdown.querySelector('strong'); const label = countdown.querySelector('span');
    if (days > 0) { strong.textContent = days; label.textContent = days === 1 ? 'day until Venice' : 'days until Venice'; }
    else if (days >= -10) { strong.textContent = 'Now'; label.textContent = 'your journey is underway'; }
    else { strong.textContent = '2026'; label.textContent = 'journey archive'; }
  }
  if (dashboard) {
    const current = tripDays.find(d => today >= localDate(d.start) && today <= localDate(d.end));
    const upcoming = tripDays.find(d => today < localDate(d.start));
    const selected = current || upcoming || tripDays[tripDays.length-1];
    const dateEl = dashboard.querySelector('[data-today-date]');
    const titleEl = dashboard.querySelector('[data-today-title]');
    const summaryEl = dashboard.querySelector('[data-today-summary]');
    const linkEl = dashboard.querySelector('[data-today-link]');
    const overnightEl = dashboard.querySelector('[data-next-overnight]');
    if (dateEl) dateEl.textContent = current ? 'Today on your journey' : (upcoming ? 'Next destination' : 'Journey complete');
    if (titleEl) titleEl.textContent = selected.title;
    if (summaryEl) summaryEl.textContent = selected.summary;
    if (linkEl) linkEl.href = selected.link;
    if (overnightEl) overnightEl.textContent = selected.title.replace(' · Dolomites','').replace(' · Lake Como','').replace(' · Lake Maggiore','');
    document.querySelectorAll('[data-route-day]').forEach(el => {
      const day = tripDays.find(d => d.start === el.dataset.routeDay);
      if (day && today >= localDate(day.start) && today <= localDate(day.end)) el.classList.add('is-current');
    });
  }
  document.querySelectorAll('[data-save-check]').forEach(box => {
    const key = 'nitc-check-' + box.dataset.saveCheck;
    try { box.checked = localStorage.getItem(key) === '1'; box.addEventListener('change',()=>localStorage.setItem(key,box.checked?'1':'0')); } catch(e) {}
  });


  // v030.0: resilient images, current-page navigation and back-to-top control.
  const fallbackImage = 'assets/images/milan-hero.svg';
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.fallbackApplied === '1') return;
      image.dataset.fallbackApplied = '1';
      image.classList.add('remote-image-fallback');
      image.src = fallbackImage;
      image.alt = image.alt ? `${image.alt} — photograph unavailable offline` : 'Photograph unavailable offline';
      const parent = image.closest('figure, .feature-media, .guide-image, .villa-card, .island-card');
      if (parent && !parent.querySelector('.image-fallback-note')) {
        const note = document.createElement('span');
        note.className = 'image-fallback-note';
        note.textContent = 'Photo unavailable; the guide content remains available.';
        parent.appendChild(note);
      }
    }, { once: true });
  });

  const currentFile = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav a, .bottomnav a').forEach((link) => {
    const target = (link.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
    if (target && target === currentFile) link.setAttribute('aria-current', 'page');
  });

  const backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.textContent = '↑';
  document.body.appendChild(backToTop);
  const syncBackToTop = () => backToTop.classList.toggle('visible', window.scrollY > 700);
  window.addEventListener('scroll', syncBackToTop, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  syncBackToTop();


  // v036.0: editorial reveal and active chapter navigation.
  document.documentElement.classList.add('js');
  const revealTargets = document.querySelectorAll([
    '.dashboard-card','.guide-card','.quick-card','.route-card','.reference-card',
    '.signature-section','.feature-split','.villa-signature-grid article',
    '.gallery-grid figure','.destination-tile','.explorer-tile','.milan-section'
  ].join(','));
  revealTargets.forEach(el => el.classList.add('reveal-on-scroll'));
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  const jumpLinks = [...document.querySelectorAll('.chapter-jumps a[href^="#"]')];
  const jumpSections = jumpLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (jumpLinks.length && jumpSections.length && 'IntersectionObserver' in window) {
    const chapterObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      jumpLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === '#' + visible.target.id));
    }, { rootMargin: '-22% 0px -58% 0px', threshold: [0.05,0.2,0.45] });
    jumpSections.forEach(section => chapterObserver.observe(section));
  }


  // v036.0: persistent trip toolbar.
  if (!document.querySelector('.companion-toolbar')) {
    const toolbar = document.createElement('nav');
    toolbar.className = 'companion-toolbar'; toolbar.setAttribute('aria-label', 'Trip companion shortcuts');
    const hasMap = document.getElementById('interactive-map');
    toolbar.innerHTML = `<a class="tool-today" href="itinerary.html">Today</a><a class="tool-map" href="${hasMap ? '#interactive-map' : 'map.html'}">Map</a><a class="tool-hotels" href="hotels.html">Hotels</a><a class="tool-practical" href="practical.html">Practical</a><a class="tool-check" href="index.html#reservations">Checklist</a>`;
    document.body.appendChild(toolbar);
  }
  // v036.0: synchronized map markers and accessible full-screen gallery.
  const mapPins = [...document.querySelectorAll('.route-map .map-pin[href^="#"]')];
  if (mapPins.length) {
    const pinSections = mapPins
      .map(pin => ({ pin, section: document.querySelector(pin.getAttribute('href')) }))
      .filter(item => item.section);
    const activatePin = (activePin) => {
      mapPins.forEach(pin => {
        const active = pin === activePin;
        pin.classList.toggle('is-active', active);
        if (active) pin.setAttribute('aria-current', 'location');
        else pin.removeAttribute('aria-current');
      });
    };
    mapPins.forEach(pin => pin.addEventListener('click', () => activatePin(pin)));
    if ('IntersectionObserver' in window) {
      const mapObserver = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting)
          .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const match = pinSections.find(item => item.section === visible.target);
        if (match) activatePin(match.pin);
      }, { rootMargin: '-28% 0px -55% 0px', threshold: [0.05, 0.2, 0.45] });
      pinSections.forEach(item => mapObserver.observe(item.section));
    }
  }

  const zoomImages = [...document.querySelectorAll('.gallery-grid img, .villa-signature-grid img, .feature-split > img')];
  if (zoomImages.length) {
    const viewer = document.createElement('div');
    viewer.className = 'companion-lightbox';
    viewer.setAttribute('aria-hidden','true');
    viewer.setAttribute('role','dialog');
    viewer.setAttribute('aria-modal','true');
    viewer.setAttribute('aria-label','Image gallery');
    viewer.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Close image">×</button>
      <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">‹</button>
      <figure><img alt=""><figcaption><span class="lightbox-caption"></span><span class="lightbox-count"></span></figcaption></figure>
      <button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">›</button>`;
    document.body.appendChild(viewer);
    const viewerImage = viewer.querySelector('img');
    const viewerClose = viewer.querySelector('.lightbox-close');
    const previousButton = viewer.querySelector('.lightbox-prev');
    const nextButton = viewer.querySelector('.lightbox-next');
    const caption = viewer.querySelector('.lightbox-caption');
    const count = viewer.querySelector('.lightbox-count');
    let currentIndex = 0;
    let previousFocus = null;

    const imageCaption = image => image.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || image.alt || 'Travel photograph';
    const showImage = index => {
      currentIndex = (index + zoomImages.length) % zoomImages.length;
      const image = zoomImages[currentIndex];
      viewerImage.src = image.currentSrc || image.src;
      viewerImage.alt = image.alt || 'Travel photograph';
      caption.textContent = imageCaption(image);
      count.textContent = `${currentIndex + 1} of ${zoomImages.length}`;
    };
    const openViewer = (image, index) => {
      previousFocus = image;
      showImage(index);
      viewer.classList.add('open');
      viewer.setAttribute('aria-hidden','false');
      document.body.classList.add('lightbox-open');
      viewerClose.focus({preventScroll:true});
    };
    const closeViewer = () => {
      viewer.classList.remove('open');
      viewer.setAttribute('aria-hidden','true');
      document.body.classList.remove('lightbox-open');
      viewerImage.src = '';
      previousFocus?.focus?.({preventScroll:true});
    };
    zoomImages.forEach((image,index) => {
      image.tabIndex = 0;
      image.setAttribute('role','button');
      image.setAttribute('aria-label',`View larger: ${imageCaption(image)}`);
      image.addEventListener('click',() => openViewer(image,index));
      image.addEventListener('keydown',event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openViewer(image,index);
        }
      });
    });
    viewerClose.addEventListener('click',closeViewer);
    previousButton.addEventListener('click',() => showImage(currentIndex - 1));
    nextButton.addEventListener('click',() => showImage(currentIndex + 1));
    viewer.addEventListener('click',event => { if (event.target === viewer) closeViewer(); });
    let touchStartX = 0;
    viewer.addEventListener('touchstart',event => { touchStartX = event.changedTouches[0].clientX; }, {passive:true});
    viewer.addEventListener('touchend',event => {
      const delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 55) showImage(currentIndex + (delta < 0 ? 1 : -1));
    }, {passive:true});
    document.addEventListener('keydown',event => {
      if (!viewer.classList.contains('open')) return;
      if (event.key === 'Escape') closeViewer();
      if (event.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (event.key === 'ArrowRight') showImage(currentIndex + 1);
      if (event.key === 'Tab') {
        const controls = [viewerClose, previousButton, nextButton];
        const position = controls.indexOf(document.activeElement);
        if (event.shiftKey && position <= 0) { event.preventDefault(); nextButton.focus(); }
        else if (!event.shiftKey && position === controls.length - 1) { event.preventDefault(); viewerClose.focus(); }
      }
    });
  }

})();
