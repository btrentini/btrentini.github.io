(function () {
  "use strict";

  const DATA = window.RESULT_DATA;
  const paneOrder = ["primary", "synthetic", "singlecell", "pdo", "jump", "others"];
  const PRIMARY_PDO_RESULTS_TASKS = [
    "PDO A cell type",
    "PDO A no-caspase",
    "PDO B culture",
    "PDO C treatment",
    "PDO F patient",
    "PDO response CAF",
    "PDO response EFP",
    "PDO response tumor-selective",
  ];
  const state = {
    pane: "primary",
    task: "__all__",
    filter: "",
  };

  const paneTitle = {
    primary: "Primary",
    synthetic: "Synthetic",
    singlecell: "Single-cell 10x Genomics",
    pdo: "PDO",
    jump: "JUMP",
    others: "Others",
  };

  const thumbnailMap = {
    "E10": "e10.png",
    "TS2.5 circles": "ts25_circles.png",
    "TS2.5 colocated": "ts25_colocated.png",
    "TS2.5 lines": "ts25_lines.png",
    "TS2.5 mixed": "ts25_mixed.png",
    "TS25 density": "ts25_density.png",
    "TS8 RNA velocity": "ts8_rna_velocity.png",
    "TS4 single-cell": "ts4_singlecell.png",
    "PDO A cell type": "pdo_a_cell_type.png",
    "PDO A no-caspase": "pdo_a_no_caspase.png",
    "PDO B culture": "pdo_b_culture.png",
    "PDO C treatment": "pdo_c_treatment.png",
    "PDO F patient": "pdo_f_patient.png",
    "PDO response CAF": "pdo_response_caf.png",
    "PDO response EFP": "pdo_response_efp.png",
    "PDO response tumor-selective": "pdo_response_tumor_selective.png",
    "Prepared bundles": "jump_modality_cloud.png",
    "Counts by modality": "jump_counts_by_modality.png",
    "Counts by plate type": "jump_counts_by_plate_type.png",
    "K-form feasibility": "jump_kform_feasibility.png",
    "Launch recipe": "notebook_jump_pca_well_profiles_by_modality.png",
  };

  const thumbnailBase = "assets/task-thumbnails/";

  function installPrimaryPdoResults() {
    const primary = DATA.panes.primary;
    const pdo = DATA.panes.pdo;
    if (!primary?.rows || !pdo?.rows) return;

    const keyFor = (row) => [row.task, row.group, row.family, row.method, row.metric].join("\u001f");
    const existing = new Set(primary.rows.map(keyFor));
    const additions = pdo.rows
      .filter((row) => PRIMARY_PDO_RESULTS_TASKS.includes(row.task))
      .filter((row) => !existing.has(keyFor(row)))
      .map((row) => ({ ...row, sourcePane: "pdo", sourceRoot: "PDO_RESULTS" }));

    if (!additions.length) return;
    primary.rows = [...primary.rows, ...additions];
    primary.sources = [...new Set([
      ...(primary.sources || []),
      ...(pdo.sources || []),
      "PDO_RESULTS/pdo_core_20260429_091932",
    ])];
    primary.subtitle = "Main evidence path plus PDO_RESULTS benchmark block";
  }

  installPrimaryPdoResults();

  const els = {
    tabs: Array.from(document.querySelectorAll(".tab")),
    themeButtons: Array.from(document.querySelectorAll(".theme-button")),
    summary: document.getElementById("summary"),
    taskFilter: document.getElementById("task-filter"),
    textFilter: document.getElementById("text-filter"),
    chartEyebrow: document.getElementById("chart-eyebrow"),
    chartTitle: document.getElementById("chart-title"),
    chart: document.getElementById("chart"),
    tableTitle: document.getElementById("table-title"),
    sourceNote: document.getElementById("source-note"),
    table: document.getElementById("results-table"),
    jumpEvidence: document.getElementById("jump-evidence"),
    jumpContent: document.getElementById("jump-content"),
    pdoModal: document.getElementById("pdo-modal"),
    pdoModalTitle: document.getElementById("pdo-modal-title"),
    pdoModalBody: document.getElementById("pdo-modal-body"),
  };

  function fmt(value, digits = 3) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "";
    return Number(value).toFixed(digits);
  }

  function fmtMetric(row) {
    return `${row.metric} ${fmt(row.score)} \u00b1 ${fmt(row.ci)}`;
  }

  function esc(text) {
    return String(text ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[ch]);
  }

  function isReportableRow(row) {
    const family = String(row.family || "").toLowerCase();
    const method = String(row.method || "").toLowerCase();
    return family !== "hodge" && !method.includes("hodge");
  }

  function paneRows(pane) {
    return (pane.rows || []).filter(isReportableRow);
  }

  function rowsForPane() {
    const pane = DATA.panes[state.pane];
    let rows = paneRows(pane);
    if (state.task !== "__all__") rows = rows.filter((row) => row.task === state.task);
    if (state.filter) {
      const q = state.filter.toLowerCase();
      rows = rows.filter((row) => [
        row.task,
        row.method,
        row.family,
        row.metric,
        row.group,
      ].some((value) => String(value || "").toLowerCase().includes(q)));
    }
    return rows;
  }

  function uniqueTasks(rows) {
    const seen = new Set();
    const tasks = [];
    rows.forEach((row) => {
      if (!seen.has(row.task)) {
        seen.add(row.task);
        tasks.push(row.task);
      }
    });
    return tasks;
  }

  function sortRows(rows) {
    return [...rows].sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.ci !== b.ci) return b.ci - a.ci;
      return a.method.localeCompare(b.method);
    });
  }

  function bestOf(rows) {
    return [...rows].sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.ci !== b.ci) return a.ci - b.ci;
      return a.method.localeCompare(b.method);
    })[0] || null;
  }

  function taskDescription(task, paneKey) {
    const descriptions = {
      primary: {
        "TS25 density": "Best synthetic evidence for the geometry story: bandwidth and density choices matter, and VolRep reaches clean wins.",
        "TS4 single-cell": "Good warm-up biological manifold task: simple, real 10x single-cell structure where the method works cleanly.",
        "PDO response tumor-selective": "Strongest PDO headline in the current snapshot: VolRep is the winner so far.",
        "PDO response EFP": "Sober biology task: VolRep is basically tied with the best neural baseline, and the label is dataset-internal and biologically meaningful.",
        "PDO response CAF": "Harder interpretability-facing PDO task. VolRep is close but not the winner, so frame it as hard biology plus Gram/vector-field diagnostics.",
      },
      synthetic: {
        "E10": "Synthetic operator sanity task with clean geometric structure and repeated folds/seeds.",
        "TS2.5 circles": "Circle-manifold stress test where class signal is weak and local sampling geometry matters.",
        "TS2.5 colocated": "Colocated synthetic samples with overlapping support, designed to test representation rather than location alone.",
        "TS2.5 lines": "Line-cloud task with near-overlapping supports and small margins between classes.",
        "TS2.5 mixed": "Mixed-shape synthetic task combining simple manifolds into a more heterogeneous benchmark.",
        "TS25 density": "Density-shift stress test where sampling concentration changes along the same geometric support.",
        "TS8 RNA velocity": "Synthetic RNA-velocity trajectory task with directed progression through cell-state space.",
      },
      singlecell: {
        "TS4 single-cell": "10x Genomics single-cell benchmark built from sampled cellular profiles and class labels.",
      },
      pdo: {
        "PDO A cell type": "PDO cloud classification task separating cell-state composition using sampled single-cell marker profiles.",
        "PDO A no-caspase": "Cell-state PDO variant with caspase-associated channels removed to reduce direct leakage.",
        "PDO B culture": "Culture-condition classification from PDO point clouds sampled across matched experimental settings.",
        "PDO C treatment": "Treatment-class task using PDO cell clouds and multi-class perturbation labels.",
        "PDO F patient": "Patient-identity task measuring how much patient-specific geometry remains in sampled PDO clouds.",
        "PDO response CAF": "CAF-response task comparing sampled PDO/PDOF condition geometry across matched cultures.",
        "PDO response EFP": "Epithelial functional perturbation task from marker shifts against matched vehicle controls.",
        "PDO response tumor-selective": "Tumor-selective response task from sampled PDO clouds and response labels.",
      },
      jump: {
        "Prepared bundles": "Prepared JUMP Cell Painting point-cloud bundles used as launch inputs for model evaluation.",
        "Counts by modality": "Well-profile counts grouped by perturbation modality before model training.",
        "Counts by plate type": "Plate-level sampling coverage across COMPOUND, CRISPR, ORF, and TARGET2 plate types.",
        "K-form feasibility": "Memory feasibility estimates for k-form construction on prepared JUMP bundles.",
        "Launch recipe": "Commands prepared for running the JUMP benchmark and smoke checks.",
      },
    };
    return descriptions[paneKey]?.[task]
      || descriptions.primary?.[task]
      || descriptions.synthetic?.[task]
      || descriptions.singlecell?.[task]
      || descriptions.pdo?.[task]
      || `Sampled point-cloud benchmark for ${task}.`;
  }

  function taskFitSubtitle(task) {
    const fit = {
      "E10": "Limited fit: low-signal degenerate geometry sanity check, not headline evidence.",
      "TS2.5 circles": "Limited fit: intentionally similar circle-family labels make this a low-signal control.",
      "TS2.5 colocated": "Good fit: co-located line-vs-circle supports test topology without location shortcuts.",
      "TS2.5 lines": "Good fit: near-overlapping lines probe tangent/support sensitivity.",
      "TS2.5 mixed": "Good fit: multi-component geometry tests within-cloud aggregation.",
      "TS25 density": "Strong fit: directly tests density and sampling effects central to point-cloud operators.",
      "TS8 RNA velocity": "Good fit: known trajectory geometry tests dynamics-style structure, not real RNA-velocity inference.",
      "TS4 single-cell": "Useful but limited: exercises single-cell population geometry; cache provenance is flagged.",
      "PDO A cell type": "Moderate fit: compartment geometry is biological, but marker differences can make it easy.",
      "PDO A no-caspase": "Moderate fit: checks robustness after withholding caspase; still a broad compartment control.",
      "PDO B culture": "Good fit: culture can reshape cell-state distributions, though composition shortcuts may remain.",
      "PDO C treatment": "Limited fit: perturbation signal is useful, but labels can confound dose, plate, and patient availability.",
      "PDO F patient": "Audit task: measures provenance or batch structure, not biological response performance.",
      "PDO response CAF": "Good fit: targets microenvironment-driven epithelial geometry; silver label, not clinical endpoint.",
      "PDO response EFP": "Good fit: tests whether held-out functional response is recoverable from remaining cell-state geometry.",
      "PDO response tumor-selective": "Strong fit: matched tumor-versus-fibroblast contrast with death markers withheld.",
      "Prepared bundles": "Evidence only: documents prepared cloud inputs, not model performance.",
      "Counts by modality": "Evidence only: reports JUMP perturbation-cloud balance, not VolRep performance.",
      "Counts by plate type": "Technical evidence: useful stress test, weak support for biological claims.",
      "K-form feasibility": "Implementation fit: checks graph/k-form feasibility, not predictive evidence.",
      "Launch recipe": "Reproducibility only: records launch commands, not a scientific task.",
    };
    return fit[task] || "Fit depends on whether the label reflects within-cloud geometry rather than metadata.";
  }

  function seededValue(seed, index, salt) {
    const raw = Math.sin(seed * 97.13 + index * 41.91 + salt * 13.37) * 10000;
    return raw - Math.floor(raw);
  }

  function point(seed, index, cx, cy, sx, sy, salt = 0) {
    const angle = seededValue(seed, index, salt) * Math.PI * 2;
    const radius = Math.sqrt(seededValue(seed, index, salt + 1));
    return {
      x: cx + Math.cos(angle) * radius * sx,
      y: cy + Math.sin(angle) * radius * sy,
    };
  }

  function renderSampleSketch(task, paneKey) {
    const sourcePane = paneKey === "primary" || paneKey === "others" ? sourcePaneForTask(task) : paneKey;
    const thumbnail = taskThumbnail(task);
    if (thumbnail) return renderTaskThumbnail(task, sourcePane, thumbnail);
    if (sourcePane === "synthetic") return renderSyntheticSketch(task);
    if (sourcePane === "singlecell") return renderClusterSketch(task, "singlecell");
    if (sourcePane === "pdo") return renderClusterSketch(task, "pdo");
    return renderJumpSketch(task);
  }

  function taskThumbnail(task) {
    const file = thumbnailMap[task];
    return file ? `${thumbnailBase}${file}` : "";
  }

  function renderTaskThumbnail(task, sourcePane, src) {
    const sourceLabel = task === "TS4 single-cell"
      ? "4.1: Cell Manifold Structure (t-SNE style visualization; PCA projection)"
      : ({
        synthetic: "Generated synthetic sample",
        singlecell: "10x PCA cache sample",
        pdo: "PDO cloud cache sample",
        jump: "JUMP prepared-data figure",
      }[sourcePane] || "Task data figure");
    return `
      <figure class="sample-figure">
        <img src="${esc(src)}" alt="${esc(task)} data thumbnail" loading="lazy">
        <figcaption>${esc(sourceLabel)}</figcaption>
      </figure>
    `;
  }

  function sourcePaneForTask(task) {
    const pane = DATA.panes[state.pane];
    const row = paneRows(pane).find((item) => item.task === task);
    return row?.sourcePane || state.pane;
  }

  function renderPoints(points, klass) {
    return points.map((p) => `<circle class="${klass}" cx="${fmt(p.x, 1)}" cy="${fmt(p.y, 1)}" r="${p.r || 2.8}"></circle>`).join("");
  }

  function renderSyntheticSketch(task) {
    const seed = task.length;
    const teal = [];
    const rose = [];
    if (task.includes("circles") || task.includes("colocated") || task === "E10") {
      for (let i = 0; i < 42; i += 1) {
        const angle = (i / 42) * Math.PI * 2;
        const jitter = (seededValue(seed, i, 3) - 0.5) * 5;
        teal.push({ x: 90 + Math.cos(angle) * (44 + jitter), y: 90 + Math.sin(angle) * (34 + jitter), r: 2.4 });
        rose.push({ x: 210 + Math.cos(angle) * (40 + jitter), y: 90 + Math.sin(angle) * (32 + jitter), r: 2.4 });
      }
      if (task.includes("colocated")) {
        rose.forEach((p) => { p.x -= 120; p.y += 2; });
      }
    } else if (task.includes("lines")) {
      for (let i = 0; i < 42; i += 1) {
        const t = i / 41;
        teal.push({ x: 42 + t * 110, y: 126 - t * 78 + (seededValue(seed, i, 1) - 0.5) * 10, r: 2.6 });
        rose.push({ x: 168 + t * 110, y: 54 + t * 78 + (seededValue(seed, i, 2) - 0.5) * 10, r: 2.6 });
      }
    } else if (task.includes("mixed")) {
      for (let i = 0; i < 28; i += 1) {
        const angle = (i / 28) * Math.PI * 2;
        teal.push({ x: 92 + Math.cos(angle) * 40, y: 88 + Math.sin(angle) * 31, r: 2.5 });
        rose.push({ x: 175 + i * 3.4, y: 132 - i * 2.5 + (seededValue(seed, i, 2) - 0.5) * 8, r: 2.5 });
      }
    } else {
      for (let i = 0; i < 42; i += 1) {
        const dense = i < 28;
        teal.push(point(seed, i, dense ? 98 : 160, dense ? 92 : 112, dense ? 28 : 58, dense ? 18 : 30, 1));
        rose.push(point(seed, i, 218, 78, 42, 26, 2));
      }
    }

    const arrows = task.includes("velocity")
      ? `<path class="sketch-arrow" d="M55 128 C105 62 184 58 260 88"></path>
         <path class="sketch-arrow-head" d="M260 88 l-13 -8 l3 15 z"></path>`
      : `<path class="sketch-grid" d="M35 140 C105 130 195 130 285 140"></path>`;

    return `
      <svg class="sample-sketch" viewBox="0 0 320 180" role="img" aria-label="${esc(task)} sampled data sketch">
        <rect class="sketch-bg" x="0" y="0" width="320" height="180" rx="8"></rect>
        ${arrows}
        ${renderPoints(teal, "point-teal")}
        ${renderPoints(rose, "point-rose")}
      </svg>
    `;
  }

  function renderClusterSketch(task, paneKey) {
    const seed = task.length + (paneKey === "pdo" ? 31 : 11);
    const centers = paneKey === "pdo"
      ? [[88, 94, 38, 28], [166, 74, 32, 24], [218, 116, 42, 26]]
      : [[82, 82, 38, 32], [154, 110, 42, 24], [226, 74, 36, 30]];
    const classes = ["point-teal", "point-rose", "point-indigo"];
    const points = centers.map((center, ci) => {
      const [cx, cy, sx, sy] = center;
      return Array.from({ length: paneKey === "pdo" ? 34 : 42 }, (_, i) => point(seed + ci, i, cx, cy, sx, sy, ci));
    });
    const plate = paneKey === "pdo"
      ? `<rect class="well-plate" x="34" y="34" width="252" height="112" rx="18"></rect>
         <circle class="well" cx="74" cy="54" r="7"></circle><circle class="well" cx="98" cy="54" r="7"></circle><circle class="well" cx="122" cy="54" r="7"></circle>
         <circle class="well" cx="198" cy="54" r="7"></circle><circle class="well" cx="222" cy="54" r="7"></circle><circle class="well" cx="246" cy="54" r="7"></circle>`
      : `<path class="sketch-grid" d="M48 138 C96 118 134 154 186 128 S250 94 286 120"></path>`;
    return `
      <svg class="sample-sketch" viewBox="0 0 320 180" role="img" aria-label="${esc(task)} sampled data sketch">
        <rect class="sketch-bg" x="0" y="0" width="320" height="180" rx="8"></rect>
        ${plate}
        ${points.map((group, i) => renderPoints(group, classes[i])).join("")}
      </svg>
    `;
  }

  function renderJumpSketch(task) {
    const bars = [
      ["compound", 0.93],
      ["orf", 0.23],
      ["crispr", 0.16],
      ["target", 0.11],
    ];
    const barMarkup = bars.map(([label, value], i) => {
      const y = 44 + i * 26;
      return `
        <text class="sketch-label" x="24" y="${y + 11}">${esc(label)}</text>
        <rect class="sketch-bar-bg" x="96" y="${y}" width="180" height="12" rx="3"></rect>
        <rect class="sketch-bar" x="96" y="${y}" width="${180 * value}" height="12" rx="3"></rect>
      `;
    }).join("");
    const wells = Array.from({ length: 36 }, (_, i) => {
      const x = 31 + (i % 12) * 14;
      const y = 138 + Math.floor(i / 12) * 12;
      const klass = i % 5 === 0 ? "well rose" : i % 3 === 0 ? "well indigo" : "well";
      return `<circle class="${klass}" cx="${x}" cy="${y}" r="4"></circle>`;
    }).join("");
    return `
      <svg class="sample-sketch" viewBox="0 0 320 180" role="img" aria-label="${esc(task)} sampled data sketch">
        <rect class="sketch-bg" x="0" y="0" width="320" height="180" rx="8"></rect>
        ${barMarkup}
        ${wells}
      </svg>
    `;
  }

  function taskStats(taskRows) {
    const baselines = taskRows.filter((row) => row.group === "baseline").length;
    const volreps = taskRows.filter((row) => row.group === "volrep").length;
    const metrics = [...new Set(taskRows.map((row) => row.metric).filter(Boolean))].join(", ");
    const folds = [...new Set(taskRows.map((row) => row.folds).filter(Boolean))].join("/");
    const seeds = [...new Set(taskRows.map((row) => row.seeds).filter(Boolean))].join("/");
    return [
      ["Metric", metrics || "pending"],
      ["Rows", `${baselines} baseline, ${volreps} VolRep`],
      ["Folds/seeds", [folds, seeds].filter(Boolean).join(" / ") || "reported per row"],
    ];
  }

  function pdoDiagnostic(task, taskRows) {
    const paneIsPdo = state.pane === "pdo" || taskRows.some((row) => row.sourcePane === "pdo");
    if (!paneIsPdo) return null;
    const baseline = bestOf(taskRows.filter((row) => row.group === "baseline"));
    const volrep = bestOf(taskRows.filter((row) => row.group === "volrep"));
    if (!baseline || !volrep) return null;
    const flagged = taskRows.some((row) => row.flag);
    const delta = volrep.score - baseline.score;
    if (!flagged && delta >= 0) return null;
    const grouped = ["PDO A cell type", "PDO A no-caspase", "PDO B culture", "PDO C treatment", "PDO F patient"].includes(task);
    const severity = flagged ? "Invalid comparison" : "Weak margin";
    const reason = grouped
      ? "The grouped PDO cache is marked as containing non-finite point coordinates. Classical baselines used scikit-learn style imputation, but neural and VolRep rows consumed the point-cloud cache directly. That is an implementation mismatch, so the low VolRep score should not be read as a clean mathematical failure."
      : "This response task is finite, but the best VolRep variant is not clearly ahead of the best baseline in this partial snapshot. The margin is small relative to CI, so the result is better interpreted as inconclusive or baseline-favored rather than a decisive failure.";
    const math = grouped
      ? "Mathematically, VolRep builds geometry from coordinates: distances, kernels, k-form features, and Gram/Laplacian summaries. A NaN or non-finite coordinate can propagate through those operators, flatten gradients, force degenerate predictions, or make the learned representation effectively constant. A tabular baseline with imputation is solving a different cleaned problem."
      : "Mathematically, response labels can be dominated by low-dimensional mean shifts or sparse marker effects. In that regime a linear, kernel, or neural baseline can capture the signal with less variance, while VolRep pays extra estimation cost for local geometry, bandwidth, density, and k-form readout choices.";
    return {
      task,
      severity,
      delta,
      baseline,
      volrep,
      flagged,
      reason,
      math,
    };
  }

  function pdoDiagnosticButton(task, taskRows) {
    const diagnostic = pdoDiagnostic(task, taskRows);
    if (!diagnostic) return "";
    const label = diagnostic.flagged ? "Why invalid?" : "Why weak?";
    return `<button class="explain-button" data-pdo-task="${esc(task)}" type="button">${esc(label)}</button>`;
  }

  function showPdoDiagnostic(task) {
    const rows = paneRows(DATA.panes.pdo).filter((row) => row.task === task);
    const diagnostic = pdoDiagnostic(task, rows);
    if (!diagnostic) return;
    els.pdoModalTitle.textContent = diagnostic.flagged ? `${task}: invalid comparison` : `${task}: weak VolRep margin`;
    els.pdoModalBody.innerHTML = `
      <div class="diagnostic-grid">
        <div>
          <span class="stat-label">Best baseline</span>
          <strong>${esc(diagnostic.baseline.method)}</strong>
          <span>${esc(fmtMetric(diagnostic.baseline))}</span>
        </div>
        <div>
          <span class="stat-label">Best VolRep</span>
          <strong>${esc(diagnostic.volrep.method)}</strong>
          <span>${esc(fmtMetric(diagnostic.volrep))}</span>
        </div>
        <div>
          <span class="stat-label">VolRep minus baseline</span>
          <strong>${diagnostic.delta >= 0 ? "+" : ""}${fmt(diagnostic.delta)}</strong>
          <span>${esc(diagnostic.severity)}</span>
        </div>
      </div>
      <h3>Implementation read</h3>
      <p>${esc(diagnostic.reason)}</p>
      <h3>Mathematical read</h3>
      <p>${esc(diagnostic.math)}</p>
      <h3>What would make this claimable?</h3>
      <p>Use one finite-value policy for every model family, rebuild the affected PDO caches, and rerun the same folds/seeds. Until then, flagged grouped PDO rows should be treated as diagnostics, not paper claims.</p>
    `;
    els.pdoModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function hidePdoDiagnostic() {
    els.pdoModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  function renderSummary() {
    const pane = DATA.panes[state.pane];
    const allRows = paneRows(pane);
    const tasks = uniqueTasks(allRows);
    const baselines = allRows.filter((row) => row.group === "baseline").length;
    const volreps = allRows.filter((row) => row.group === "volrep").length;
    const metrics = [...new Set(allRows.map((row) => row.metric).filter(Boolean))].join(", ") || "pending";

    const stats = [
      ["Pane", paneTitle[state.pane], pane.subtitle || ""],
      ["Tasks", tasks.length, metrics],
      ["Baselines", baselines, "reported before VolRep"],
      ["VolRep variants", volreps, "reported after separator"],
    ];

    els.summary.innerHTML = stats.map(([label, value, detail]) => `
      <div class="stat">
        <span class="stat-label">${esc(label)}</span>
        <span class="stat-value">${esc(value)}</span>
        <span class="stat-detail">${esc(detail)}</span>
      </div>
    `).join("");
  }

  function applyTheme(theme) {
    const nextTheme = theme || "system";
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("pointFormsTheme", nextTheme);
    els.themeButtons.forEach((button) => button.classList.toggle("active", button.dataset.theme === nextTheme));
  }

  function renderTaskFilter() {
    const pane = DATA.panes[state.pane];
    const tasks = uniqueTasks(paneRows(pane));
    els.taskFilter.innerHTML = [
      `<option value="__all__">All datasets</option>`,
      ...tasks.map((task) => `<option value="${esc(task)}">${esc(task)}</option>`),
    ].join("");
    els.taskFilter.value = tasks.includes(state.task) ? state.task : "__all__";
    state.task = els.taskFilter.value;
  }

  function renderChart(rows) {
    const tasks = uniqueTasks(rows);
    const groups = tasks.map((task) => {
      const taskRows = rows.filter((row) => row.task === task);
      const baselines = sortRows(taskRows.filter((row) => row.group === "baseline"));
      const bestVolrep = bestOf(taskRows.filter((row) => row.group === "volrep"));
      return {
        task,
        bars: [
          ...baselines.map((row) => ({ ...row, chartGroup: "baseline" })),
          ...(bestVolrep ? [{ ...bestVolrep, chartGroup: "volrep" }] : []),
        ],
      };
    }).filter((item) => item.bars.length);

    if (!groups.length) {
      if (state.pane === "jump") {
        renderJumpChart();
        return;
      }
      els.chart.innerHTML = `<div class="empty-state">No completed baseline/VolRep CI metrics were found for this pane.</div>`;
      return;
    }

    const width = 960;
    const left = 250;
    const right = 130;
    const top = 34;
    const rowGap = 34;
    const barStep = 28;
    const barH = 13;
    const plotW = width - left - right;
    const height = top + groups.reduce((sum, item) => sum + rowGap + item.bars.length * barStep, 0) + 26;
    const x = (value) => left + Math.max(0, Math.min(1, Number(value || 0))) * plotW;
    const error = (row, y) => {
      if (!row) return "";
      const lo = x(row.score - row.ci);
      const hi = x(row.score + row.ci);
      const mid = x(row.score);
      return `<line class="error-line" x1="${lo}" x2="${hi}" y1="${y}" y2="${y}"></line>
        <line class="error-line" x1="${lo}" x2="${lo}" y1="${y - 5}" y2="${y + 5}"></line>
        <line class="error-line" x1="${hi}" x2="${hi}" y1="${y - 5}" y2="${y + 5}"></line>
        <circle class="error-dot" cx="${mid}" cy="${y}" r="2.5"></circle>`;
    };

    const ticks = [0, 0.25, 0.5, 0.75, 1];
    const tickMarkup = ticks.map((tick) => `
      <line class="grid-line" x1="${x(tick)}" x2="${x(tick)}" y1="18" y2="${height - 16}"></line>
      <text class="axis-label" x="${x(tick)}" y="${height - 2}" text-anchor="middle">${tick.toFixed(2)}</text>
    `).join("");

    let cursorY = top;
    const rowsMarkup = groups.map((item) => {
      const headerY = cursorY + 14;
      const barMarkup = item.bars.map((row, index) => {
        const y = cursorY + rowGap + index * barStep;
        const className = row.chartGroup === "volrep" ? "bar-volrep" : "bar-baseline";
        const label = row.chartGroup === "volrep" ? `Best VolRep: ${row.method}` : row.method;
        return `
          <text class="chart-label" x="14" y="${y + 4}">${esc(label)}</text>
          <rect class="${className}" x="${left}" y="${y - barH / 2}" width="${x(row.score) - left}" height="${barH}" rx="3"></rect>
          ${error(row, y)}
          <text class="chart-value" x="${Math.min(x(row.score) + 8, width - 104)}" y="${y + 4}">${esc(fmtMetric(row))}</text>
        `;
      }).join("");
      cursorY += rowGap + item.bars.length * barStep;
      return `
        <text class="chart-task" x="0" y="${headerY}">${esc(item.task)}</text>
        ${barMarkup}
      `;
    }).join("");

    els.chart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="All baselines and best VolRep score by task">
        ${tickMarkup}
        ${rowsMarkup}
      </svg>
    `;
  }

  function renderJumpChart() {
    const rows = DATA.panes.jump.evidence?.countsByModality || [];
    if (!rows.length) {
      els.chart.innerHTML = `<div class="empty-state">No completed baseline/VolRep CI metrics were found for this pane.</div>`;
      return;
    }

    const width = 900;
    const left = 170;
    const right = 140;
    const top = 30;
    const rowH = 48;
    const barH = 16;
    const plotW = width - left - right;
    const height = top + rows.length * rowH + 44;
    const maxValue = Math.max(...rows.map((row) => Number(row.well_profiles || 0)), 1);
    const x = (value) => left + (Number(value || 0) / maxValue) * plotW;
    const tickValues = [0, 0.25, 0.5, 0.75, 1].map((part) => Math.round(maxValue * part));
    const tickMarkup = tickValues.map((tick) => `
      <line class="grid-line" x1="${x(tick)}" x2="${x(tick)}" y1="18" y2="${height - 28}"></line>
      <text class="axis-label" x="${x(tick)}" y="${height - 10}" text-anchor="middle">${tick.toLocaleString()}</text>
    `).join("");

    const rowMarkup = rows.map((row, index) => {
      const y = top + index * rowH;
      const value = Number(row.well_profiles || 0);
      return `
        <text class="chart-task" x="0" y="${y + 17}">${esc(row.Metadata_modality)}</text>
        <rect class="bar-baseline" x="${left}" y="${y}" width="${x(value) - left}" height="${barH}" rx="3"></rect>
        <text class="chart-value" x="${x(value) + 8}" y="${y + 13}">${value.toLocaleString()} well profiles</text>
        <text class="chart-label" x="${left}" y="${y + 35}">${Number(row.perturbations || 0).toLocaleString()} perturbations, ${Number(row.plates || 0).toLocaleString()} plates</text>
      `;
    }).join("");

    els.chart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="JUMP prepared well profiles by modality">
        ${tickMarkup}
        ${rowMarkup}
      </svg>
      <div class="empty-state">Completed baseline/VolRep CI metrics were not found in the local aggregate tables for JUMP.</div>
    `;
  }

  function renderMetricTable(taskRows) {
    const body = [];
    [
      ["baseline", "Baselines"],
      ["volrep", "VolRep variants"],
    ].forEach(([group, label], idx) => {
      const block = sortRows(taskRows.filter((row) => row.group === group));
      if (idx === 1) body.push(`<tr class="separator-row"><td colspan="8"></td></tr>`);
      body.push(`<tr class="block-row"><td colspan="8">${esc(label)} sorted ascending; best at bottom</td></tr>`);
      if (!block.length) {
        body.push(`<tr><td colspan="8" class="muted-cell">No ${esc(label.toLowerCase())} rows after filtering.</td></tr>`);
      }
      block.forEach((row, rowIndex) => {
        const bestClass = rowIndex === block.length - 1 ? " best-row" : "";
        const tag = group === "volrep" ? "volrep" : "baseline";
        body.push(`
          <tr class="${bestClass}">
            <td><span class="tag ${tag}">${group === "volrep" ? "VolRep" : "Baseline"}</span></td>
            <td>${esc(row.family)}</td>
            <td>${esc(row.method)}</td>
            <td>${esc(row.metric)}</td>
            <td class="metric-cell">${fmt(row.score)}</td>
            <td class="metric-cell">+/- ${fmt(row.ci)}</td>
            <td>${esc(row.folds || "")}/${esc(row.seeds || "")}</td>
            <td>${row.flag ? `<span class="flag">${esc(row.flag)}</span>` : ""}</td>
          </tr>
        `);
      });
    });

    return `
      <table>
        <thead>
          <tr>
            <th>Block</th>
            <th>Family</th>
            <th>Method</th>
            <th>Metric</th>
            <th>Score</th>
            <th>CI95</th>
            <th>Folds/seeds</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>${body.join("")}</tbody>
      </table>
    `;
  }

  function renderTable(rows) {
    const tasks = uniqueTasks(rows);
    if (!rows.length) {
      els.table.innerHTML = `<div class="empty-state">No completed baseline/VolRep CI metrics were found for this pane.</div>`;
      return;
    }

    els.table.innerHTML = tasks.map((task) => {
      const taskRows = rows.filter((row) => row.task === task);
      const stats = taskStats(taskRows);
      return `
        <article class="task-section">
          <aside class="task-context">
            <p class="eyebrow">Task</p>
            <div class="task-title-row">
              <h3>${esc(task)}</h3>
              ${pdoDiagnosticButton(task, taskRows)}
            </div>
            <p class="task-description">${esc(taskDescription(task, state.pane))}</p>
            <p class="task-fit">${esc(taskFitSubtitle(task))}</p>
            ${renderSampleSketch(task, state.pane)}
            <dl class="task-stats">
              ${stats.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}
            </dl>
          </aside>
          <div class="task-table">
            ${renderMetricTable(taskRows)}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderGenericTable(title, rows, limit = 12) {
    if (!rows || !rows.length) return "";
    const columns = Object.keys(rows[0]);
    const shown = rows.slice(0, limit);
    return `
      <article class="task-section evidence-section">
        <aside class="task-context">
          <p class="eyebrow">JUMP table</p>
          <h3>${esc(title)}</h3>
          <p class="task-description">${esc(taskDescription(title, "jump"))}</p>
          <p class="task-fit">${esc(taskFitSubtitle(title))}</p>
          ${renderSampleSketch(title, "jump")}
          <dl class="task-stats">
            <div><dt>Rows</dt><dd>${rows.length}${limit && rows.length > limit ? ` shown as ${limit}` : ""}</dd></div>
            <div><dt>Source</dt><dd>JUMP inspection tables</dd></div>
          </dl>
        </aside>
        <div class="task-table">
          <table>
            <thead><tr>${columns.map((col) => `<th>${esc(col)}</th>`).join("")}</tr></thead>
            <tbody>
              ${shown.map((row) => `<tr>${columns.map((col) => `<td>${esc(row[col])}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }

  function renderJumpEvidence() {
    const jump = DATA.panes.jump.evidence || {};
    const blocks = [
      renderGenericTable("Prepared bundles", jump.preparedBundles),
      renderGenericTable("Counts by modality", jump.countsByModality),
      renderGenericTable("Counts by plate type", jump.countsByPlateType),
      renderGenericTable("K-form feasibility", jump.kformFeasibility, 8),
      renderGenericTable("Launch recipe", jump.launchRecipe, 10),
    ].filter(Boolean);
    els.jumpContent.innerHTML = `<div class="task-section-list">${blocks.join("")}</div>`;
  }

  function render() {
    els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.pane === state.pane));
    renderSummary();
    renderTaskFilter();
    const rows = rowsForPane();
    const pane = DATA.panes[state.pane];
    els.chartEyebrow.textContent = state.pane === "jump" ? "Prepared data" : "Task comparison";
    els.chartTitle.textContent = state.pane === "jump" ? "JUMP well profiles by modality" : "All baselines vs best VolRep";
    els.tableTitle.textContent = `${paneTitle[state.pane]} task tables`;
    els.sourceNote.textContent = (pane.sources || []).join(" | ");
    renderChart(rows);
    renderTable(rows);
    els.jumpEvidence.classList.toggle("hidden", state.pane !== "jump");
    if (state.pane === "jump") renderJumpEvidence();
  }

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.pane = tab.dataset.pane;
      state.task = "__all__";
      state.filter = "";
      els.textFilter.value = "";
      render();
    });
  });

  els.themeButtons.forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.theme));
  });

  els.taskFilter.addEventListener("change", () => {
    state.task = els.taskFilter.value;
    render();
  });

  els.textFilter.addEventListener("input", () => {
    state.filter = els.textFilter.value.trim();
    render();
  });

  document.addEventListener("click", (event) => {
    const explain = event.target.closest("[data-pdo-task]");
    if (explain) {
      showPdoDiagnostic(explain.dataset.pdoTask);
      return;
    }
    if (event.target.closest("[data-close-modal]")) hidePdoDiagnostic();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.pdoModal.classList.contains("hidden")) {
      hidePdoDiagnostic();
    }
  });

  if (!DATA || !DATA.panes || !paneOrder.every((pane) => DATA.panes[pane])) {
    throw new Error("documents/web/data.js is missing required pane data.");
  }

  applyTheme(localStorage.getItem("pointFormsTheme") || "system");
  render();
}());
