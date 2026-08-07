document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const toggle = document.querySelector('.nav-toggle');
  const navigation = document.getElementById('primary-navigation');

  if (toggle && navigation) {
    const closeNavigation = () => {
      navigation.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      navigation.classList.toggle('is-open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNavigation);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNavigation();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeNavigation();
    }, { passive: true });
  }

  document.querySelectorAll('[data-print-page]').forEach((button) => {
    button.addEventListener('click', () => window.print());
  });

  const parallaxHeroes = Array.from(document.querySelectorAll('[data-parallax-hero]'));

  if (parallaxHeroes.length) {
    const parallaxMotion = window.matchMedia('(prefers-reduced-motion: no-preference)');
    let parallaxFrame = null;

    const renderParallax = () => {
      parallaxFrame = null;

      if (!parallaxMotion.matches) {
        parallaxHeroes.forEach((hero) => hero.style.removeProperty('--hero-parallax-y'));
        return;
      }

      parallaxHeroes.forEach((hero) => {
        const bounds = hero.getBoundingClientRect();
        const distance = Math.min(Math.max(-bounds.top, 0), bounds.height);
        const progress = bounds.height ? distance / bounds.height : 0;
        const travel = window.innerWidth <= 720
          ? Math.min(48, bounds.height * 0.075)
          : Math.min(120, bounds.height * 0.15);
        hero.style.setProperty('--hero-parallax-y', `${(progress * travel).toFixed(2)}px`);
      });
    };

    const queueParallax = () => {
      if (parallaxFrame === null) parallaxFrame = window.requestAnimationFrame(renderParallax);
    };

    window.addEventListener('scroll', queueParallax, { passive: true });
    window.addEventListener('resize', queueParallax, { passive: true });
    parallaxMotion.addEventListener?.('change', queueParallax);
    renderParallax();
  }

  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const counter = carousel.querySelector('[data-carousel-index]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (slides.length < 2 || !previous || !next) return;

    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    let timer = null;
    let pointerInside = false;
    let focusInside = false;
    let touchStartX = null;

    const render = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === index;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
      });
      dots.forEach((dot, dotIndex) => {
        const isActive = dotIndex === index;
        dot.classList.toggle('is-active', isActive);
        if (isActive) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (counter) counter.textContent = String(index + 1);
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (reduceMotion.matches || pointerInside || focusInside || document.hidden) return;
      timer = window.setInterval(() => render(index + 1), 6500);
    };

    const move = (offset) => {
      render(index + offset);
      start();
    };

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        render(Number(dot.dataset.carouselDot));
        start();
      });
    });

    carousel.addEventListener('mouseenter', () => {
      pointerInside = true;
      stop();
    });
    carousel.addEventListener('mouseleave', () => {
      pointerInside = false;
      start();
    });
    carousel.addEventListener('focusin', () => {
      focusInside = true;
      stop();
    });
    carousel.addEventListener('focusout', (event) => {
      if (event.relatedTarget && carousel.contains(event.relatedTarget)) return;
      focusInside = false;
      start();
    });
    carousel.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
      stop();
    }, { passive: true });
    carousel.addEventListener('touchend', (event) => {
      if (touchStartX === null) return;
      const distance = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) > 45) render(index + (distance < 0 ? 1 : -1));
      start();
    }, { passive: true });
    document.addEventListener('visibilitychange', start);
    reduceMotion.addEventListener?.('change', start);

    render(index);
    start();
  });

  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm && formStatus) {
    const query = new URLSearchParams(window.location.search);
    const enquiry = contactForm.querySelector('[name="enquiry"]');

    if (query.get('message') === 'sent') {
      formStatus.textContent = 'Message sent. Thank you — I will reply by email.';
      formStatus.classList.add('is-success');
    }

    const requestedEnquiry = query.get('enquiry');
    if (requestedEnquiry && enquiry) {
      const matchingOption = Array.from(enquiry.options).find((option) => option.value === requestedEnquiry);
      if (matchingOption) enquiry.value = requestedEnquiry;
    }

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      if (formData.get('botcheck')) return;

      const submitButton = contactForm.querySelector('button[type="submit"]');
      formStatus.textContent = 'Sending…';
      formStatus.classList.remove('is-success', 'is-error');
      if (submitButton) submitButton.disabled = true;

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' }
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'The message could not be sent.');
        }

        contactForm.reset();
        formStatus.textContent = 'Message sent. Thank you — I will reply by email.';
        formStatus.classList.add('is-success');
      } catch (error) {
        formStatus.textContent = 'The form could not send your message. Please use the email link beside it.';
        formStatus.classList.add('is-error');
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
});
