/* ==========================================================================
   FireStone Pizza — interactions
   ========================================================================== */
(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     Preloader
  ----------------------------------------------------------------------- */
  const preloader = document.getElementById('preloader');

  const hidePreloader = () => {
    if (!preloader) return;
    preloader.classList.add('is-hidden');
    setTimeout(() => preloader.remove(), 800);
  };

  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', () => setTimeout(hidePreloader, 350));
  }

  /* ---------------------------------------------------------------------
     Scroll progress, header state, back-to-top
  ----------------------------------------------------------------------- */
  const scrollProgress = document.getElementById('scrollProgress');
  const siteHeader = document.getElementById('siteHeader');
  const backToTop = document.getElementById('backToTop');

  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (scrollProgress) scrollProgress.style.width = `${progress}%`;
    if (siteHeader) siteHeader.classList.toggle('is-scrolled', scrollTop > 24);
    if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > 700);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------------------------------------------------------------------
     Mobile navigation
  ----------------------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const primaryNav = document.getElementById('primaryNav');

  const closeNav = () => {
    primaryNav?.classList.remove('is-open');
    navToggle?.classList.remove('is-active');
    navToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  navToggle?.addEventListener('click', () => {
    const isOpen = primaryNav?.classList.toggle('is-open');
    navToggle.classList.toggle('is-active', isOpen);
    navToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    document.body.classList.toggle('nav-open', isOpen);
  });

  primaryNav?.querySelectorAll('.nav__link, .nav__cta').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  /* ---------------------------------------------------------------------
     Scroll-reveal animations
  ----------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window && revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------------------
     Animated stat counters
  ----------------------------------------------------------------------- */
  const statNumbers = document.querySelectorAll('.stat__number[data-count]');

  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const isDecimal = !Number.isInteger(target);
    const duration = 1800;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const value = target * eased;
      el.textContent = (isDecimal ? value.toFixed(1) : Math.round(value)) + suffix;
      if (elapsed < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window && statNumbers.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach((el) => counterObserver.observe(el));
  } else {
    statNumbers.forEach(animateCount);
  }

  /* ---------------------------------------------------------------------
     Full Menu tabs
  ----------------------------------------------------------------------- */
  const menuTabs = document.querySelectorAll('.menu-tab');
  const menuPanels = document.querySelectorAll('.menu-panel');

  menuTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;

      menuTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });

      menuPanels.forEach((panel) => {
        const match = panel.dataset.panel === targetId;
        panel.classList.toggle('is-active', match);
        panel.hidden = !match;
      });
    });
  });

  /* ---------------------------------------------------------------------
     Testimonial carousel
  ----------------------------------------------------------------------- */
  const testimonialTrack = document.getElementById('testimonialTrack');
  const testimonialCards = testimonialTrack
    ? Array.from(testimonialTrack.querySelectorAll('.testimonial-card'))
    : [];
  const testimonialDotsWrap = document.getElementById('testimonialDots');
  const testimonialPrev = document.getElementById('testimonialPrev');
  const testimonialNext = document.getElementById('testimonialNext');

  let testimonialIndex = 0;
  let testimonialTimer = null;

  const dotEls = testimonialCards.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'testimonial-dots__dot';
    dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
    dot.addEventListener('click', () => goToTestimonial(i, true));
    testimonialDotsWrap?.appendChild(dot);
    return dot;
  });

  function renderTestimonial() {
    testimonialCards.forEach((card, i) => card.classList.toggle('is-active', i === testimonialIndex));
    dotEls.forEach((dot, i) => dot.classList.toggle('is-active', i === testimonialIndex));
  }

  function goToTestimonial(index, userInitiated) {
    if (!testimonialCards.length) return;
    testimonialIndex = (index + testimonialCards.length) % testimonialCards.length;
    renderTestimonial();
    if (userInitiated) restartTestimonialTimer();
  }

  function restartTestimonialTimer() {
    if (testimonialTimer) clearInterval(testimonialTimer);
    testimonialTimer = setInterval(() => goToTestimonial(testimonialIndex + 1), 7000);
  }

  testimonialPrev?.addEventListener('click', () => goToTestimonial(testimonialIndex - 1, true));
  testimonialNext?.addEventListener('click', () => goToTestimonial(testimonialIndex + 1, true));

  if (testimonialCards.length) {
    renderTestimonial();
    restartTestimonialTimer();
  }

  /* ---------------------------------------------------------------------
     FAQ accordion
  ----------------------------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq__question');
    const answer = item.querySelector('.faq__answer');
    if (!question || !answer) return;

    if (item.classList.contains('is-open')) {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    }

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach((other) => {
        const otherAnswer = other.querySelector('.faq__answer');
        const otherQuestion = other.querySelector('.faq__question');
        other.classList.remove('is-open');
        otherQuestion?.setAttribute('aria-expanded', 'false');
        if (otherAnswer) otherAnswer.style.maxHeight = '0px';
      });

      if (!isOpen) {
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });

  window.addEventListener('resize', () => {
    const openItem = document.querySelector('.faq__item.is-open .faq__answer');
    if (openItem) openItem.style.maxHeight = `${openItem.scrollHeight}px`;
  });

  /* ---------------------------------------------------------------------
     Reservation form
  ----------------------------------------------------------------------- */
  const reservationForm = document.getElementById('reservationForm');
  const formSuccess = document.getElementById('formSuccess');
  const resDate = document.getElementById('resDate');

  if (resDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    resDate.setAttribute('min', `${yyyy}-${mm}-${dd}`);
  }

  reservationForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!reservationForm.checkValidity()) {
      reservationForm.reportValidity();
      return;
    }

    reservationForm.hidden = true;
    if (formSuccess) {
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      reservationForm.reset();
      reservationForm.hidden = false;
      if (formSuccess) formSuccess.hidden = true;
    }, 6000);
  });

  /* ---------------------------------------------------------------------
     Newsletter form
  ----------------------------------------------------------------------- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterSuccess = document.getElementById('newsletterSuccess');

  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!newsletterForm.checkValidity()) {
      newsletterForm.reportValidity();
      return;
    }

    newsletterForm.hidden = true;
    if (newsletterSuccess) newsletterSuccess.hidden = false;

    setTimeout(() => {
      newsletterForm.reset();
      newsletterForm.hidden = false;
      if (newsletterSuccess) newsletterSuccess.hidden = true;
    }, 6000);
  });

  /* ---------------------------------------------------------------------
     Footer year
  ----------------------------------------------------------------------- */
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
