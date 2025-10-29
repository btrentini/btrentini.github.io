
  (function () {
    const form = document.getElementById('contactForm');
    const statusEl = document.getElementById('formStatus');

    // Capture-phase listener to preempt any legacy submit handlers.
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

      const data = new FormData(form);
      if (data.get('botcheck')) return; // simple bot trap

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: data
        });

        const result = await res.json().catch(() => ({}));
        if (res.ok) {
          statusEl.textContent = '✅ Message sent. Thank you!';
          form.reset();
        } else {
          statusEl.textContent = result.message || '❌ Send failed. Try again later.';
        }
      } catch (err) {
        statusEl.textContent = 'Network error. Try again later.';
      }
    }, true);
  })();