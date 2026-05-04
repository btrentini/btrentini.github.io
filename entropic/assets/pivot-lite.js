(function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function createPivotLite(options) {
    const root = options.root;
    const fields = options.fields || [];
    const fieldMap = Object.fromEntries(fields.map(field => [field.key, field]));
    const onChange = options.onChange || function () {};
    const state = {
      rows: unique(options.initial?.rows || []),
      cols: unique(options.initial?.cols || []),
      values: unique(options.initial?.values || [])
    };

    function cleanState(next) {
      ['rows', 'cols', 'values'].forEach(bucket => {
        next[bucket] = unique(next[bucket] || []).filter(key => fieldMap[key]);
      });
      next.rows = next.rows.filter(key => fieldMap[key].type !== 'metric');
      next.cols = next.cols.filter(key => fieldMap[key].type !== 'metric');
      next.values = next.values.filter(key => fieldMap[key].type === 'metric').slice(0, 1);
      return next;
    }

    function removeEverywhere(key) {
      state.rows = state.rows.filter(item => item !== key);
      state.cols = state.cols.filter(item => item !== key);
      state.values = state.values.filter(item => item !== key);
    }

    function canDrop(field, bucket) {
      if (!field) return false;
      if (bucket === 'values') return field.type === 'metric';
      return field.type !== 'metric';
    }

    function fieldPill(key, removable) {
      const field = fieldMap[key];
      if (!field) return '';
      const remove = removable
        ? `<button type="button" class="pivot-remove" data-remove-field="${escapeHtml(key)}" aria-label="Remove ${escapeHtml(field.label)}">×</button>`
        : '';
      return `<div class="pivot-field ${escapeHtml(field.type)}" draggable="true" data-field="${escapeHtml(key)}">
        <span>${escapeHtml(field.label)}</span>${remove}
      </div>`;
    }

    function shelf(bucket, label, hint) {
      const items = state[bucket] || [];
      const pills = items.length
        ? items.map(key => fieldPill(key, true)).join('')
        : `<span class="pivot-empty">${escapeHtml(hint)}</span>`;
      return `<section class="pivot-shelf" data-bucket="${escapeHtml(bucket)}">
        <div class="pivot-shelf-label">${escapeHtml(label)}</div>
        <div class="pivot-dropzone" data-bucket="${escapeHtml(bucket)}">${pills}</div>
      </section>`;
    }

    function availableFields() {
      const used = new Set([...state.rows, ...state.cols, ...state.values]);
      return fields.filter(field => !used.has(field.key));
    }

    function render() {
      cleanState(state);
      const available = availableFields();
      const dimensions = available.filter(field => field.type !== 'metric');
      const metrics = available.filter(field => field.type === 'metric');
      root.innerHTML = `
        <div class="pivot-lite">
          <div class="pivot-pool">
            <div class="pivot-pool-title">Dimensions</div>
            <div class="pivot-field-list">${dimensions.map(field => fieldPill(field.key, false)).join('')}</div>
            <div class="pivot-pool-title">Metrics</div>
            <div class="pivot-field-list metric-list">${metrics.map(field => fieldPill(field.key, false)).join('')}</div>
          </div>
          <div class="pivot-shelves">
            ${shelf('rows', 'Rows', 'Drop dimensions here')}
            ${shelf('cols', 'Columns', 'Drop dimensions here')}
            ${shelf('values', 'Value', 'Drop one metric here')}
          </div>
        </div>`;

      root.querySelectorAll('.pivot-field').forEach(el => {
        el.addEventListener('dragstart', event => {
          event.dataTransfer.setData('text/plain', el.dataset.field);
          event.dataTransfer.effectAllowed = 'move';
        });
      });

      root.querySelectorAll('.pivot-dropzone').forEach(zone => {
        zone.addEventListener('dragover', event => {
          const key = event.dataTransfer.getData('text/plain');
          if (!key || canDrop(fieldMap[key], zone.dataset.bucket)) {
            event.preventDefault();
            zone.classList.add('drag-over');
          }
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone.addEventListener('drop', event => {
          event.preventDefault();
          zone.classList.remove('drag-over');
          const key = event.dataTransfer.getData('text/plain');
          const bucket = zone.dataset.bucket;
          if (!canDrop(fieldMap[key], bucket)) return;
          removeEverywhere(key);
          if (bucket === 'values') state.values = [key];
          else state[bucket].push(key);
          render();
          onChange(getState());
        });
      });

      root.querySelectorAll('[data-remove-field]').forEach(button => {
        button.addEventListener('click', () => {
          removeEverywhere(button.dataset.removeField);
          render();
          onChange(getState());
        });
      });
    }

    function getState() {
      return {
        rows: [...state.rows],
        cols: [...state.cols],
        values: [...state.values]
      };
    }

    function setState(next) {
      const clean = cleanState({
        rows: next.rows ?? state.rows,
        cols: next.cols ?? state.cols,
        values: next.values ?? state.values
      });
      state.rows = clean.rows;
      state.cols = clean.cols;
      state.values = clean.values;
      render();
      onChange(getState());
    }

    render();
    return { getState, setState };
  }

  window.PivotLite = { create: createPivotLite };
})();
