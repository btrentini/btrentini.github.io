const D = window.RESULTS_DATA;
const TARCHIC_CHARTS = window.TARCHIC_CHART_MANIFEST || [];

const schedulerOrder = D.metadata.scheduler_order;
const colors = {
  ...(D.metadata.scheduler_colors || {}),
  linear: '#17becf',
  entropic: '#f781bf',
  entropic_log1p: '#e35d9d',
  entropic_reverse: '#c51b7d',
  entropic_log1p_reverse: '#a60f64',
  cosine: '#ff7f00',
  sigmoid: '#999999',
  log: '#4daf4a',
  power_2: '#984ea3',
  power_3: '#377eb8'
};
const solverColors = {
  ...(D.metadata.solver_colors || {}),
  ode_heun: '#5f6f7d',
  sde_heun: '#9a755c'
};
const HEATMAP_VALUE_SCALE = [
  [0.0, '#f8fafc'],
  [0.5, '#d8dee8'],
  [1.0, '#64748b']
];
const BEST_HIGHLIGHT_COLOR = '#ffe66d';
const EDM_SPOTLIGHT_SCHEDULER = 'entropic_log1p';
const EDM_SAMPLES_PER_SEED = 64;
const EDM_SPLIT_VARIANTS = {
  edm_baseline__entropic: {
    base: 'entropic',
    label: 'Entropic · baseline',
    color: '#f781bf',
    rank: 1.0,
    mode: 'empirical Hutchinson'
  },
  edm_condmarg__entropic: {
    base: 'entropic',
    label: 'Supplemental EDM cond-marg · Entropic',
    color: '#c51b7d',
    rank: 1.1,
    mode: 'supplemental conditional-minus-marginal ablation'
  },
  edm_baseline__entropic_log1p: {
    base: 'entropic_log1p',
    label: 'Entropic-log1p · baseline',
    color: '#e35d9d',
    rank: 2.0,
    mode: 'empirical Hutchinson + log1p'
  },
  edm_condmarg__entropic_log1p: {
    base: 'entropic_log1p',
    label: 'Supplemental EDM cond-marg · Entropic-log1p',
    color: '#a60f64',
    rank: 2.1,
    mode: 'supplemental conditional-minus-marginal ablation + log1p'
  }
};
const ALPHA_SPOTLIGHT_FAMILY = 'condmarg';
const ALPHA_SPOTLIGHT_LABEL = 'cond-marg';
const TABLE_RUNTIME_METRICS = new Set(['infer_seconds', 'infer_seconds_per_output']);
const ALPHA_UNIFIED_METRICS = ['plddt_mean', 'diversity', 'rmsd_mean', 'invalid_rate'];
const HERO_EDM_METRICS = ['fid_inception', 'fid_pixel'];
const HERO_ALPHA_METRICS = ['plddt_mean', 'diversity', 'rmsd_mean', 'invalid_rate'];
const SIZE_ORDER = ['All', 'Short', 'Medium', 'Large'];
const EXPLORER_DIMENSIONS = [
  { key: 'domain', label: 'Domain', type: 'dimension' },
  { key: 'source_run', label: 'Source run', type: 'dimension' },
  { key: 'source_table', label: 'Source table', type: 'dimension' },
  { key: 'evidence_stream', label: 'Evidence stream', type: 'dimension' },
  { key: 'main_evidence', label: 'Main evidence', type: 'dimension' },
  { key: 'sampler_regime', label: 'Sampler regime', type: 'dimension' },
  { key: 'dataset', label: 'Dataset', type: 'dimension' },
  { key: 'protein_size', label: 'Protein size', type: 'dimension' },
  { key: 'schedule_family', label: 'Family', type: 'dimension' },
  { key: 'scheduler', label: 'Scheduler variant', type: 'dimension' },
  { key: 'nfe_regime', label: 'NFE regime', type: 'dimension' },
  { key: 'metric_family', label: 'Metric family', type: 'dimension' },
  { key: 'nfe', label: 'NFE', type: 'dimension' },
  { key: 'protein', label: 'Protein', type: 'dimension' },
  { key: 'seed', label: 'Seed', type: 'dimension' }
];
const EXPLORER_METRICS = [
  'fid_inception',
  'fid_pixel',
  'infer_seconds',
  'plddt_mean',
  'diversity',
  'rmsd_mean',
  'invalid_rate',
  'infer_seconds_per_output',
  'seq_len'
];
const EXPLORER_FILTER_FIELDS = [
  { key: 'main_evidence', label: 'Main evidence' },
  { key: 'evidence_stream', label: 'Evidence stream' },
  { key: 'sampler_regime', label: 'Sampler regime' },
  { key: 'dataset', label: 'Dataset' },
  { key: 'protein_size', label: 'Protein size' },
  { key: 'schedule_family', label: 'Family' },
  { key: 'scheduler', label: 'Scheduler' },
  { key: 'nfe_regime', label: 'NFE regime' },
  { key: 'nfe', label: 'NFE' }
];
const TARCHIC_THEORY_ASSETS = [
  ['Runtime audit', 'Inference-time distributions by NFE, sampler, and protein size', 'generated/inference_time_distributions_by_nfe_sampler_size.pdf', 'Dedicated timing audit after removing seconds from the main comparison tables; boxes pool scheduler variants inside each NFE/sampler/size stratum.'],
  ['Paper theory', 'Closed-form Brownian-bridge entropy profile', 'theory-figures/figA_theoretical_entropy.pdf', 'Main-text theoretical anchor: the Brownian bridge predicts a boundary-heavy U-shaped conditional profile.'],
  ['Synthetic theory', 'Synthetic transport scenarios', 'theory-figures/fig_transport_scenarios_grid.pdf', 'Controlled endpoint geometries used before the high-dimensional stress tests.'],
  ['Synthetic theory', 'Synthetic entropy-rate profiles', 'theory-figures/entropy_rate.pdf', 'Shows that bridge-like transports naturally produce non-flat entropy-rate profiles.'],
  ['Synthetic theory', 'Synthetic inverse-CDF entropic grids', 'theory-figures/entropy_tau_grid.pdf', 'Shows how a rate curve becomes time nodes through normalized CDF inversion.'],
  ['Synthetic theory', 'Scenario-level comparison', 'theory-figures/figB2_scenario_comparison.pdf', 'Controlled evidence that scheduler effects depend on endpoint geometry.'],
  ['Synthetic theory', 'ODE/SDE low-step sensitivity', 'theory-figures/fig_mmd_vs_steps_ode_sde.pdf', 'Low-NFE behavior is more sensitive to grid placement than high-NFE behavior.'],
  ['Synthetic theory', 'Reference scheduler shapes', 'theory-figures/fig_scheduler_shapes_sigma_0.50.pdf', 'Reference comparison for common heuristic grids against bridge-inspired profiles.'],
  ['High-dimensional theory', 'AlphaFlow cond-marg allocation density', 'theory-figures/AlphaFlow_cond_marg_u_shape_profile_density.pdf', 'Split panel from the protein-flow conditional-minus-marginal profile; the historical BCR callout is omitted.'],
  ['High-dimensional theory', 'AlphaFlow signed divergence budget', 'theory-figures/AlphaFlow_cond_marg_u_shape_profile_signed_budget.pdf', 'Split panel showing endpoint-positive and center-negative signed conditional-minus-marginal mass.'],
  ['High-dimensional theory', 'AlphaFlow cond-marg profile curve', 'theory-figures/AlphaFlow_cond_marg_u_shape_profile_linear_curve.pdf', 'Split profile panel used before comparing the induced grid against linear allocation.'],
  ['High-dimensional theory', 'AlphaFlow cond-marg grid versus linear grid', 'theory-figures/AlphaFlow_cond_marg_u_shape_profile_linear_grid.pdf', 'Split scheduler-grid panel showing how conditional-minus-marginal allocation concentrates low-NFE nodes at the endpoints.'],
  ['High-dimensional theory', 'AlphaFlow schedule path', 'theory-figures/AlphaFlow_entropic_cond_marg_schedule_evidence_path.pdf', 'Main paper schedule path induced by the conditional-minus-marginal rate.'],
  ['High-dimensional theory', 'AlphaFlow relative density', 'theory-figures/AlphaFlow_entropic_cond_marg_schedule_evidence_relative_density.pdf', 'Main paper relative-density view of endpoint-heavy allocation.'],
  ['High-dimensional theory', 'AlphaFlow scheduler allocation', 'theory-figures/AlphaFlow_scheduler_allocation_cond_marg_only.pdf', 'Protein-flow allocation diagnostic for the conditional-minus-marginal scheduler.'],
  ['High-dimensional theory', 'EDM entropy curve', 'theory-figures/EDM_entropy_curve.pdf', 'Main paper EDM entropy-curve evidence; interpreted as a mismatch stress test rather than a bridge proof.'],
  ['High-dimensional theory', 'EDM scheduler allocation', 'theory-figures/EDM_scheduler_allocation_cond_marg_only.pdf', 'Main paper EDM allocation diagnostic; conditional-minus-marginal EDM rows remain supplemental.'],
  ['Bridge profile', 'AlphaFlow conditional-minus-marginal U-shape profile', 'run41_alphaflow/shared_schedule/tarchic/alphaflow_condmarg_u_shape_profile.pdf', 'Boundary-heavy allocation appears in the high-dimensional AlphaFlow rate, matching the bridge-facing prediction.'],
  ['Bridge profile', 'EDM U-shape stress-test profile', 'run40_edm/shared_scheduler/tarchic/edm_u_shape_profile.pdf', 'EDM is not a bridge; this chart shows why log tempering is needed when the entropy proxy is too concentrated.'],
  ['Entropy curves', 'EDM raw entropy curve', 'run40_edm/shared_scheduler/scoped_pdf_evidence/figures__EDM_entropy_curve_raw.pdf', 'Raw entropy-rate evidence before numerical calibration.'],
  ['Entropy curves', 'EDM entropy curve shape', 'run40_edm/shared_scheduler/scoped_pdf_evidence/figures__EDM_entropy_curve_shape.pdf', 'Shape diagnostic for how the measured rate allocates integration time.'],
  ['Scheduler allocation', 'EDM scheduler allocation comparison', 'run40_edm/shared_scheduler/scoped_pdf_evidence/added_analysis__EDM_scheduler_allocation_comparison.pdf', 'Compares how fixed grids and entropic grids distribute steps.'],
  ['Scheduler allocation', 'EDM supplemental cond-marg allocation diagnostic', 'run40_edm/shared_scheduler/scoped_pdf_evidence/added_analysis__EDM_scheduler_allocation_cond_marg_only.pdf', 'Historical EDM cond-marg ablation; shown only as supplemental context.'],
  ['Scheduler allocation', 'EDM schedule timelines', 'run40_edm/shared_scheduler/scoped_pdf_evidence/figures__Schedule_timelines_EDM.pdf', 'Step-location view for the standard EDM scheduler family.'],
  ['Scheduler allocation', 'EDM log1p schedule timelines', 'run40_edm/shared_scheduler/scoped_pdf_evidence/figures__Schedule_timelines_EDM_log1p.pdf', 'Log-tempered EDM schedule used in the main EDM evidence.'],
  ['Scheduler allocation', 'EDM reverse schedule timelines', 'run40_edm/shared_scheduler/scoped_pdf_evidence/figures__Schedule_timelines_EDM_reverse.pdf', 'Reverse-direction allocation diagnostic.'],
  ['Scheduler allocation', 'EDM log1p reverse schedule timelines', 'run40_edm/shared_scheduler/scoped_pdf_evidence/figures__Schedule_timelines_EDM_log1p_reverse.pdf', 'Reverse-direction log-tempered allocation diagnostic.'],
  ['Scheduler allocation', 'EDM scheduler path view', 'run40_edm/shared_scheduler/scoped_pdf_evidence/figures__Snakey_scheduler_paths_EDM.pdf', 'Path-style view of scheduler node placement.'],
  ['Scheduler allocation', 'EDM ODE sigma-threshold allocation', 'run40_edm/ode/tarchic/edm_ode_heun_sigma_threshold_allocation.pdf', 'ODE allocation diagnostic tied to EDM sigma thresholds.'],
  ['Scheduler allocation', 'EDM SDE sigma-threshold allocation', 'run40_edm/sde/tarchic/edm_sde_heun_sigma_threshold_allocation.pdf', 'SDE allocation diagnostic tied to EDM sigma thresholds.'],
  ['AlphaFlow schedule', 'AlphaFlow cond-marg schedule allocation diagnostics', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_allocation_diagnostics.pdf', 'Overview diagnostic for the conditional-minus-marginal protein schedule.'],
  ['AlphaFlow schedule', 'AlphaFlow cond-marg granular allocation', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_allocation_granular.pdf', 'Granular view of where the protein schedule places nodes.'],
  ['AlphaFlow schedule', 'AlphaFlow boundary zoom', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_evidence_boundary_zoom.pdf', 'Endpoint-focused schedule evidence.'],
  ['AlphaFlow schedule', 'AlphaFlow cumulative interval mass', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_evidence_cumulative_interval_mass.pdf', 'Shows how interval mass accumulates under the bridge-aware schedule.'],
  ['AlphaFlow schedule', 'AlphaFlow granular density', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_evidence_granular_density.pdf', 'Density diagnostic for conditional-minus-marginal allocation.'],
  ['AlphaFlow schedule', 'AlphaFlow interval width', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_evidence_interval_width.pdf', 'Interval-width view of the inferred integration grid.'],
  ['AlphaFlow schedule', 'AlphaFlow schedule path', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_evidence_path.pdf', 'Direct path from rate mass to scheduler nodes.'],
  ['AlphaFlow schedule', 'AlphaFlow region allocation', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_evidence_region_allocation.pdf', 'Region-level allocation evidence for the protein bridge.'],
  ['AlphaFlow schedule', 'AlphaFlow relative density', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_evidence_relative_density.pdf', 'Relative node-density evidence against uniform allocation.'],
  ['AlphaFlow schedule', 'AlphaFlow step locations', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_evidence_step_locations.pdf', 'Concrete step locations for the conditional-minus-marginal schedule.'],
  ['AlphaFlow schedule', 'AlphaFlow schedule reconstruction', 'run41_alphaflow/shared_schedule/scoped_pdf_evidence/protein_diagnostics/AlphaFlow_entropic_cond_marg_schedule_reconstruction.pdf', 'Reconstructs the schedule from the estimated evidence curve.'],
  ['Protein evidence', 'CAMEO protein evidence schedule paths', 'run41_alphaflow/cameo/tarchic/protein_evidence/cameo_alphaflow_protein_evidence_schedule_paths.pdf', 'Protein-specific schedule paths for CAMEO representatives.'],
  ['Protein evidence', 'ATLAS protein evidence schedule paths', 'run41_alphaflow/atlas/tarchic/protein_evidence/atlas_alphaflow_protein_evidence_schedule_paths.pdf', 'Protein-specific schedule paths for ATLAS representatives.'],
  ['Protein evidence', 'CAMEO protein evidence coverage grid', 'run41_alphaflow/cameo/tarchic/protein_evidence/cameo_alphaflow_protein_evidence_coverage_grid.pdf', 'Coverage grid showing which CAMEO protein-size representatives are visualized.'],
  ['Protein evidence', 'ATLAS protein evidence coverage grid', 'run41_alphaflow/atlas/tarchic/protein_evidence/atlas_alphaflow_protein_evidence_coverage_grid.pdf', 'Coverage grid showing which ATLAS protein-size representatives are visualized.']
].map(([category, title, href, note]) => ({
  category,
  title,
  href: href.startsWith('theory-figures/') ? href : `tarchic-charts/${href}`,
  note
}));
const ALPHA_UNIFIED_VARIANT_ORDER = [
  'condmarg__entropic',
  'condmarg__entropic_log1p',
  'standard__linear',
  'standard__entropic',
  'standard__entropic_log1p',
  'standard__cosine',
  'standard__sigmoid',
  'standard__power_2'
];
const ALPHA_METRIC_ANALYSIS = {
  plddt_mean: 'pLDDT is the confidence dimension. Higher values mean the generated ensemble is easier for the structure model to trust; schedulers that spend budget where the protein bridge is uncertain usually gain here only if they do not introduce abrupt geometry jumps.',
  diversity: 'Diversity tracks ensemble spread. Higher values mean the endpoint ensemble covers more conformational variation when confidence and validity remain controlled.',
  rmsd_mean: 'Endpoint spread is the pairwise CA RMSD among generated endpoint structures. Higher values mean more endpoint diversity; it is not a native-reference accuracy RMSD.',
  invalid_rate: 'Invalid rate is the feasibility guardrail, so lower is better. Any accuracy or diversity gain is weak if it increases invalid outputs.',
  infer_seconds_per_output: 'Runtime is the efficiency dimension, so lower is better. It should be interpreted as a cost guardrail beside pLDDT, diversity, endpoint spread, and validity rather than as the only winner criterion.'
};
const RUN41_LARGE_AUDIT = [
  {
    key: 'atlas_large_condmarg',
    label: 'ATLAS large · cond-marg',
    state: 'COMPLETED',
    job: '11511536',
    rows: '330 / 330 rows',
    cellN: 'n=55 per scheduler/NFE',
    note: 'Included as completed run41 large-protein cond-marg evidence.'
  },
  {
    key: 'cameo_large_condmarg',
    label: 'CAMEO large · cond-marg',
    state: 'COMPLETED',
    job: '11511539',
    rows: '570 / 570 rows',
    cellN: 'n=95 per scheduler/NFE',
    note: 'Included as completed run41 large-protein cond-marg evidence.'
  },
  {
    key: 'atlas_large_standard',
    label: 'ATLAS large · standard',
    state: 'TIMEOUT',
    job: '11511530',
    rows: '822 / 990 checkpoint rows (83.0%)',
    cellN: 'n=44-49 of 55 per scheduler/NFE (80.0-89.1%)',
    note: 'The Slurm job hit the compute wall-time limit on 2026-05-02, not a numerical failure. The checkpoint retained enough samples for mean ± CI comparator evidence, so these cells are included and visibly marked as partial.'
  },
  {
    key: 'cameo_large_standard',
    label: 'CAMEO large · standard',
    state: 'TIMEOUT',
    job: '11511533',
    rows: '1258 / 1710 checkpoint rows (73.6%)',
    cellN: 'n=66-73 of 95 per scheduler/NFE (69.5-76.8%)',
    note: 'The Slurm job hit the compute wall-time limit on 2026-05-02, not a numerical failure. The checkpoint retained enough samples for mean ± CI comparator evidence, so these cells are included and visibly marked as partial.'
  }
];
const RUN41_STANDARD_TIMEOUT_NOTE = 'Run41 standard large comparator jobs stopped at compute wall time, not because the metric pipeline failed: ATLAS retained 822/990 rows (83.0%; n=44-49/55 per cell) and CAMEO retained 1258/1710 rows (73.6%; n=66-73/95 per cell). This is enough checkpointed coverage to report means and confidence intervals as partial comparator evidence; cond-marg large rows completed fully.';
let explorerRowsCache = null;
let pivotUi = null;
let pivotState = { rows: ['scheduler'], cols: ['nfe'], values: ['plddt_mean'] };
let explorerFilterState = {};
let activeExplorerTab = 'pivot';
let activeProteinSizeFilter = '__all__';
let chartSchedulerState = {
  ode: { edm: { known: [], selected: [] }, alpha: { known: [], selected: [] } },
  sde: { edm: { known: [], selected: [] }, alpha: { known: [], selected: [] } }
};
function $(id) { return document.getElementById(id); }

function isRuntimeMetric(metric) {
  return TABLE_RUNTIME_METRICS.has(metricKey(metric));
}

function mainTableMetrics(metrics) {
  return (metrics || []).filter(metric => !isRuntimeMetric(metric));
}

function datasetTableMetrics(dataset) {
  return mainTableMetrics(dataset?.metrics || []);
}

function unique(values) {
  return Array.from(new Set(values.filter(v => v !== null && v !== undefined && v !== ''))).sort((a, b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;
    return String(a).localeCompare(String(b));
  });
}

function schedulerRank(name) {
  const variant = EDM_SPLIT_VARIANTS[String(name)];
  if (variant) return variant.rank;
  const idx = schedulerOrder.indexOf(String(name));
  return idx >= 0 ? idx : schedulerOrder.length + 1;
}

function schedulerBase(name) {
  return EDM_SPLIT_VARIANTS[String(name)]?.base || String(name);
}

function schedulerLabel(name) {
  const variant = EDM_SPLIT_VARIANTS[String(name)];
  if (variant) return variant.label;
  return D.metadata.scheduler_labels[String(name)] || String(name);
}

function shortSchedulerLabel(name) {
  const base = schedulerBase(name);
  const labels = {
    linear: 'Linear',
    cosine: 'Cosine',
    sigmoid: 'Sigmoid',
    power2: 'Pwr-2',
    entropic: 'Entropic',
    entropic_log1p: 'Ent-log1p'
  };
  const prefix = String(name).startsWith('edm_condmarg__') ? 'CM ' : '';
  return `${prefix}${labels[base] || schedulerLabel(name)}`;
}

function schedulerColor(name) {
  const variant = EDM_SPLIT_VARIANTS[String(name)];
  if (variant) return variant.color;
  return colors[schedulerBase(name)] || '#999';
}

function isEntropicScheduler(name) {
  return schedulerBase(name).startsWith('entropic');
}

function solverLabel(name) {
  return String(name)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bOde\b/g, 'ODE')
    .replace(/\bSde\b/g, 'SDE');
}

function preferredAlphaFamily(values) {
  const list = values || [];
  if (list.includes(ALPHA_SPOTLIGHT_FAMILY)) return ALPHA_SPOTLIGHT_FAMILY;
  if (list.includes('standard')) return 'standard';
  return list[0];
}

function isEdmSpotlightScheduler(scheduler) {
  return schedulerBase(scheduler) === EDM_SPOTLIGHT_SCHEDULER;
}

function isAlphaSpotlightFamily(family) {
  return family === ALPHA_SPOTLIGHT_FAMILY;
}

function currentMatrixUsesRun41Alpha() {
  const evidence = metricKey($('matrixEvidence').value);
  return evidence === 'primary' || evidence === 'run41_rebuttal';
}

function isRun41PartialLargeStandard(ds, family) {
  return currentMatrixUsesRun41Alpha() && ds?.domain === 'alphaflow' && String(ds.key).endsWith('_large') && family === 'standard';
}

function alphaFamilyLabel(family) {
  return isAlphaSpotlightFamily(family) ? ALPHA_SPOTLIGHT_LABEL : 'standard';
}

function alphaVariantKey(row) {
  return `${row.schedule_family}__${row.scheduler}`;
}

function alphaVariantKeyFromParts(family, scheduler) {
  return `${family || 'standard'}__${scheduler || 'n/a'}`;
}

function alphaVariantKeyFromRecord(row) {
  return alphaVariantKeyFromParts(row?.schedule_family || row?.alpha_family || 'standard', row?.scheduler);
}

function alphaVariantFamily(key) {
  return String(key).split('__')[0];
}

function alphaVariantScheduler(key) {
  return String(key).split('__').slice(1).join('__');
}

function alphaVariantLabel(key) {
  if (!key || key === 'n/a') return 'n/a';
  return `${schedulerLabel(alphaVariantScheduler(key))} · ${alphaFamilyLabel(alphaVariantFamily(key))}`;
}

function shortAlphaVariantLabel(key) {
  if (!key || key === 'n/a') return 'n/a';
  const scheduler = alphaVariantScheduler(key);
  const family = alphaVariantFamily(key);
  const schedulerLabels = {
    linear: 'Linear',
    cosine: 'Cosine',
    sigmoid: 'Sigmoid',
    power2: 'Pwr-2',
    entropic: 'Entropic',
    entropic_log1p: 'Ent-log1p'
  };
  const schedulerText = schedulerLabels[scheduler] || schedulerLabel(scheduler);
  if (isAlphaSpotlightFamily(family)) return `${schedulerText} CM`;
  if (scheduler === 'entropic' || scheduler === 'entropic_log1p') return `${schedulerText} Std`;
  return schedulerText;
}

function alphaVariantLabelFromRecord(row) {
  return row ? alphaVariantLabel(alphaVariantKeyFromRecord(row)) : 'n/a';
}

function alphaVariantRank(key) {
  const index = ALPHA_UNIFIED_VARIANT_ORDER.indexOf(key);
  if (index >= 0) return index;
  const familyOffset = isAlphaSpotlightFamily(alphaVariantFamily(key)) ? 0 : ALPHA_UNIFIED_VARIANT_ORDER.length;
  return familyOffset + schedulerRank(alphaVariantScheduler(key));
}

function alphaVariantColor(key) {
  const scheduler = alphaVariantScheduler(key);
  const family = alphaVariantFamily(key);
  if (scheduler === 'entropic' && isAlphaSpotlightFamily(family)) return '#c51b7d';
  if (scheduler === 'entropic_log1p' && isAlphaSpotlightFamily(family)) return '#a60f64';
  if (scheduler === 'entropic') return colors.entropic;
  if (scheduler === 'entropic_log1p') return colors.entropic_log1p;
  return colors[scheduler] || (isAlphaSpotlightFamily(family) ? '#17becf' : '#777');
}

function isAlphaUnifiedPartialRow(row) {
  return row?.schedule_family === 'standard' && row?.size_group === 'Large' && ['All', 'ATLAS', 'CAMEO'].includes(row?.dataset_group);
}

function schedulerBadges(scheduler, context = {}) {
  const opts = typeof context === 'object'
    ? context
    : { domain: context ? 'alphaflow' : 'edm', includeAlpha: Boolean(context) };
  const domain = opts.domain || 'edm';
  const includeAlpha = Boolean(opts.includeAlpha);
  const badges = [];
  const base = schedulerBase(scheduler);
  if (domain === 'edm') {
    if (isEdmSpotlightScheduler(scheduler)) badges.push('<span class="spotlight-chip edm-chip">EDM spotlight</span>');
    if (String(scheduler).startsWith('edm_baseline__')) badges.push('<span class="spotlight-chip standard-chip">baseline</span>');
    if (String(scheduler).startsWith('edm_condmarg__')) badges.push('<span class="spotlight-chip edm-chip">supplemental ablation</span>');
  }
  if (domain === 'alphaflow' && includeAlpha && (base === 'entropic' || base === EDM_SPOTLIGHT_SCHEDULER)) {
    badges.push('<span class="spotlight-chip alpha-chip">AlphaFlow cond-marg</span>');
  }
  return badges.join('');
}

function metricConfig(domain, key) {
  return D.metrics[domain][key] || { label: key, direction: 'higher', fmt: '.2f' };
}

function shortMetricLabel(domain, key) {
  const labels = {
    fid_inception: 'FID-I',
    fid_pixel: 'FID-Px',
    plddt_mean: 'pLDDT',
    diversity: 'Div.',
    rmsd_mean: 'Spread',
    invalid_rate: 'Invalid',
    infer_seconds: 'Sec.',
    infer_seconds_per_output: 'Sec./out'
  };
  return labels[key] || metricConfig(domain, key).label;
}

function directionShort(direction) {
  return direction === 'higher' ? 'up better' : 'down better';
}

function formatValue(value, fmt) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'n/a';
  const x = Number(value);
  if (fmt === '.1f') return x.toFixed(1);
  if (fmt === '.2f') return x.toFixed(2);
  if (fmt === '.3f') return x.toFixed(3);
  if (fmt === '.4f') return x.toFixed(4);
  return x.toPrecision(4);
}

function formatInt(value) {
  const x = Number(value || 0);
  return x.toLocaleString();
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function artifactRefPath(path) {
  const clean = String(path || '').split('#')[0].split('?')[0].replace(/^\.?\//, '');
  if (!clean) return '';
  return `/fig/${clean}`;
}

const ORIGIN_LABELS = {
  run38: 'run38',
  run39: 'run39',
  run40: 'run40',
  run41: 'run41',
  before_run39: 'before run39',
  before_run38: 'before run38'
};

function normalizeOriginText(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function originFromText(value) {
  const text = normalizeOriginText(value);
  if (!text) return null;
  if (text.includes('beforerun39') || text.includes('prerun39')) return 'before_run39';
  if (text.includes('beforerun38') || text.includes('prerun38')) return 'before_run38';
  if (text.includes('run41')) return 'run41';
  if (text.includes('run40')) return 'run40';
  if (text.includes('run39')) return 'run39';
  if (text.includes('run38')) return 'run38';
  return null;
}

function assetOrigin(path, context = {}) {
  const pathOrigin = originFromText(path);
  if (pathOrigin) return pathOrigin;
  const contextOrigin = originFromText([
    context.origin,
    context.source_run,
    context.run,
    context.run_label,
    context.source,
    context.pdf_src,
    context.html_src,
    context.title,
    ...(context.tags || [])
  ].filter(Boolean).join(' '));
  return contextOrigin || 'before_run38';
}

function originClass(origin) {
  return `origin-${String(origin || 'before_run38').replace(/_/g, '-')}`;
}

function originBadgeHtml(path, context = {}) {
  const origin = assetOrigin(path, context);
  return `<span class="origin-badge ${originClass(origin)}" data-origin-key="${htmlEscape(origin)}" title="Origin: ${htmlEscape(ORIGIN_LABELS[origin] || origin)}">origin: ${htmlEscape(ORIGIN_LABELS[origin] || origin)}</span>`;
}

function isLegacyEvidenceOrigin(origin) {
  return ['run39', 'run38', 'before_run39', 'before_run38'].includes(String(origin || ''));
}

function evidenceStatusLabel(origin) {
  return isLegacyEvidenceOrigin(origin) ? 'ICML REBUTTALS OR PREVIOUSLY' : 'NEWEST EVIDENCE';
}

function evidenceStatusClass(origin) {
  return isLegacyEvidenceOrigin(origin) ? 'evidence-status-old' : 'evidence-status-new';
}

function evidenceStatusBadgeHtml(path, context = {}) {
  const origin = assetOrigin(path, context);
  return `<span class="evidence-status-badge ${evidenceStatusClass(origin)}">${htmlEscape(evidenceStatusLabel(origin))}</span>`;
}

function originSortRank(origin) {
  return {
    run41: 50,
    run40: 40,
    run39: 30,
    run38: 20,
    before_run39: 10,
    before_run38: 0
  }[String(origin || '')] ?? 0;
}

function visualSortKey(item, pathFn) {
  const path = pathFn(item);
  return originSortRank(assetOrigin(path, item));
}

function sortedVisualItems(items, pathFn) {
  return [...items].sort((a, b) =>
    visualSortKey(b, pathFn) - visualSortKey(a, pathFn) ||
    String(a.title || a.run_label || a.source_path || pathFn(a)).localeCompare(String(b.title || b.run_label || b.source_path || pathFn(b)))
  );
}

function visualFormat(path) {
  const clean = String(path || '').split('#')[0].split('?')[0].toLowerCase();
  const ext = clean.includes('.') ? clean.split('.').pop() : '';
  if (ext === 'gif') return 'GIF';
  if (ext === 'pdf') return 'PDF';
  if (ext === 'png') return 'PNG';
  if (['jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return ext.toUpperCase();
  return 'Other';
}

function visualFormatRank(format) {
  return { GIF: 0, PDF: 1, PNG: 2, SVG: 3, WEBP: 4, JPG: 5, JPEG: 5, Other: 9 }[format] ?? 9;
}

function visualDomain(path, item = {}) {
  const explicit = String(item.domain || item.model_domain || item.domain_label || '').toLowerCase();
  if (explicit.includes('theory')) return 'Theory / Other';
  if (explicit.includes('alphaflow')) return 'AlphaFlow';
  if (explicit === 'edm' || explicit.includes('edm')) return 'EDM';
  const primaryHaystack = [
    explicit,
    path,
    item.title,
    item.category,
    item.source,
    item.source_path,
    item.href,
    item.src,
    item.run_label,
    ...(item.tags || [])
  ].filter(Boolean).join(' ').toLowerCase();
  if (primaryHaystack.includes('alphaflow') || primaryHaystack.includes('alpha flow')) return 'AlphaFlow';
  if (primaryHaystack.includes('edm')) return 'EDM';
  if (primaryHaystack.includes('theory')) return 'Theory / Other';
  const noteHaystack = String(item.note || '').toLowerCase();
  const noteHasAlpha = noteHaystack.includes('alphaflow') || noteHaystack.includes('alpha flow');
  const noteHasEdm = noteHaystack.includes('edm');
  if (noteHasAlpha && !noteHasEdm) return 'AlphaFlow';
  if (noteHasEdm && !noteHasAlpha) return 'EDM';
  if (noteHasAlpha || noteHasEdm || noteHaystack.includes('theory')) return 'Theory / Other';
  return 'Other';
}

function visualDomainRank(domain) {
  return { AlphaFlow: 0, EDM: 1, 'Theory / Other': 2, Other: 3 }[domain] ?? 9;
}

function visualRunGroupLabel(isLegacy) {
  return isLegacy ? 'Before/equal run39' : 'Run40 + Run41';
}

function visualFormatSections(items, renderCard, pathFn, options, isLegacy) {
  const gridClass = options.gridClass || 'gallery legacy-visual-grid';
  const groups = new Map();
  items.forEach(item => {
    const format = visualFormat(pathFn(item));
    if (!groups.has(format)) groups.set(format, []);
    groups.get(format).push(item);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => visualFormatRank(a) - visualFormatRank(b) || a.localeCompare(b))
    .map(([format, groupedItems]) => `
      <section class="visual-format-section ${isLegacy ? 'legacy-format-section' : 'newest-format-section'}">
        <div class="visual-format-heading">
          <span>${htmlEscape(format)}</span>
          <span class="visual-format-count">${formatInt(groupedItems.length)} ${groupedItems.length === 1 ? 'item' : 'items'}</span>
        </div>
        <div class="${htmlEscape(gridClass)}">${groupedItems.map(renderCard).join('')}</div>
      </section>`)
    .join('');
}

function visualDomainSections(items, renderCard, pathFn, options, isLegacy) {
  const groups = new Map();
  items.forEach(item => {
    const domain = visualDomain(pathFn(item), item);
    if (!groups.has(domain)) groups.set(domain, []);
    groups.get(domain).push(item);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => visualDomainRank(a) - visualDomainRank(b) || a.localeCompare(b))
    .map(([domain, groupedItems]) => `
      <section class="visual-domain-section ${isLegacy ? 'legacy-domain-section' : 'newest-domain-section'}">
        <div class="visual-domain-heading">
          <span>${htmlEscape(visualRunGroupLabel(isLegacy))} · ${htmlEscape(domain)}</span>
          <span class="visual-format-count">${formatInt(groupedItems.length)} ${groupedItems.length === 1 ? 'item' : 'items'}</span>
        </div>
        ${visualFormatSections(groupedItems, renderCard, pathFn, options, isLegacy)}
      </section>`)
    .join('');
}

function renderVisualCardGroups(items, renderCard, pathFn, options = {}) {
  const sorted = sortedVisualItems(items, pathFn);
  const current = sorted.filter(item => !isLegacyEvidenceOrigin(assetOrigin(pathFn(item), item)));
  const legacy = sorted.filter(item => isLegacyEvidenceOrigin(assetOrigin(pathFn(item), item)));
  const currentHtml = visualDomainSections(current, renderCard, pathFn, options, false);
  if (!legacy.length) return currentHtml;
  const noun = options.noun || 'visuals';
  const summary = options.summary || `Show ${formatInt(legacy.length)} ICML rebuttals or previous ${noun}`;
  return `${currentHtml}
    <details class="legacy-visual-details">
      <summary><span>${htmlEscape(summary)}</span><span class="evidence-status-badge evidence-status-old">ICML REBUTTALS OR PREVIOUSLY</span></summary>
      ${visualDomainSections(legacy, renderCard, pathFn, options, true)}
    </details>`;
}

function visualImageHtml(src, title, context = {}) {
  const origin = assetOrigin(src, context);
  return `<div class="visual-origin-frame"><img src="${htmlEscape(src)}" loading="lazy" alt="${htmlEscape(title)}" data-origin-key="${htmlEscape(origin)}">${originBadgeHtml(src, { ...context, origin })}${evidenceStatusBadgeHtml(src, { ...context, origin })}</div>`;
}

function artifactRefHtml(path, context = {}) {
  const ref = artifactRefPath(path);
  if (!ref) return '';
  const origin = originBadgeHtml(path, context);
  if (VISUAL_ASSET_RE.test(String(path || ''))) {
    return `<button type="button" class="artifact-ref artifact-ref-action" data-visual-src="${htmlEscape(String(path || ''))}" data-visual-title="${htmlEscape(ref)}" data-origin-key="${htmlEscape(assetOrigin(path, context))}"><span class="artifact-ref-meta"><span class="artifact-ref-label">figure ref</span>${origin}</span><code>${htmlEscape(ref)}</code></button>`;
  }
  return `<div class="artifact-ref"><span class="artifact-ref-meta"><span class="artifact-ref-label">figure ref</span>${origin}</span><code>${htmlEscape(ref)}</code></div>`;
}

function formatCell(stat, config) {
  if (!stat || stat.mean === null) return '<span class="weak">n/a</span>';
  const mean = formatValue(stat.mean, config.fmt);
  const ci = stat.ci === null ? 'n/a' : formatValue(stat.ci, config.fmt);
  return `${mean}<span class="ci">± ${ci}</span>`;
}

function withEdmSupport(stat) {
  if (!stat) return stat;
  const seeds = Number(stat.seed_n || stat.n || 0);
  return {
    ...stat,
    seed_n: seeds,
    sample_n: Number(stat.sample_n || seeds * EDM_SAMPLES_PER_SEED),
    samples_per_seed: Number(stat.samples_per_seed || EDM_SAMPLES_PER_SEED)
  };
}

function cloneMetricValuesWithEdmSupport(metricValues) {
  return Object.fromEntries(Object.entries(metricValues || {}).map(([metric, stat]) => [metric, withEdmSupport({ ...stat })]));
}

function formatSupport(stat, domain) {
  if (!stat) return '';
  if (domain === 'edm') {
    const seeds = Number(stat.seed_n || stat.n || 0);
    const samples = Number(stat.sample_n || seeds * EDM_SAMPLES_PER_SEED);
    return `<span class="n">s=${formatInt(seeds)} · img=${formatInt(samples)}</span>`;
  }
  if (domain === 'alphaflow' && stat.n !== undefined) return `<span class="n">n=${formatInt(stat.n)} prot.</span>`;
  return '';
}

function formatScorecardCell(stat, config, domain) {
  return `${formatCell(stat, config)}${formatSupport(stat, domain)}`;
}

function pooledComplementStat(pooled, part) {
  if (!pooled || !part) return null;
  const n = Number(pooled.n || 0);
  const n1 = Number(part.n || 0);
  const n2 = n - n1;
  if (n2 <= 0) return null;
  const mean = Number(pooled.mean || 0);
  const mean1 = Number(part.mean || 0);
  const mean2 = (n * mean - n1 * mean1) / n2;
  const std = Number(pooled.std || 0);
  const std1 = Number(part.std || 0);
  let ss2 = (n - 1) * std * std
    - (n1 - 1) * std1 * std1
    - n1 * Math.pow(mean1 - mean, 2)
    - n2 * Math.pow(mean2 - mean, 2);
  ss2 = Math.max(0, ss2);
  const std2 = n2 > 1 ? Math.sqrt(ss2 / (n2 - 1)) : 0;
  return withEdmSupport({
    mean: mean2,
    std: std2,
    ci: n2 > 0 ? 1.96 * std2 / Math.sqrt(n2) : 0,
    n: n2
  });
}

function populateSelect(id, values, preferred) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = '';
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = String(v).includes('|') ? String(v).split('|')[1] : v;
    el.appendChild(opt);
  });
  if (preferred && values.includes(preferred)) el.value = preferred;
}

function initControls() {
  const alphaFamilies = D.matrix?.alpha_families || ['standard'];
  populateSelect('matrixEvidence', (D.matrix?.evidence_sets || []).map(s => `${s.key}|${s.label}`), 'primary|Primary: run40 EDM + run41 AlphaFlow');
  populateSelect('matrixNfe', (D.matrix?.n_steps || []).map(String), (D.matrix?.n_steps || []).includes(25) ? '25' : String((D.matrix?.n_steps || [])[0] || ''));
  populateSelect('matrixAlphaFamily', alphaFamilies, preferredAlphaFamily(alphaFamilies));
  populateSelect('matrixEdmMode', D.matrix?.edm_modes || ['ode_heun'], (D.matrix?.edm_modes || []).includes('ode_heun') ? 'ode_heun' : (D.matrix?.edm_modes || [])[0]);
  const run40Kinds = unique((D.figure_atlas?.run40_edm_figures || []).map(f => f.plot_type));
  populateSelect('run40FigureKind', ['All', ...run40Kinds], 'All');
  const alphaDatasetOptions = (D.matrix?.datasets || []).filter(d => d.domain === 'alphaflow').map(d => `${d.key}|${d.label}`);
  populateSelect('run41AlphaDataset', alphaDatasetOptions, alphaDatasetOptions.find(v => v.startsWith('cameo_all|')) || alphaDatasetOptions[0]);
  populateSelect('run41AlphaFamily', alphaFamilies, preferredAlphaFamily(alphaFamilies));
  const matrixAlphaMetrics = D.matrix?.metrics?.alphaflow || D.metrics.alphaflow;
  populateSelect('run41AlphaMetric', mainTableMetrics(Object.keys(matrixAlphaMetrics)).map(k => `${k}|${matrixAlphaMetrics[k].label}`), 'plddt_mean|pLDDT');
  populateSelect('run41AlphaNfe', (D.matrix?.n_steps || []).map(String), (D.matrix?.n_steps || []).includes(25) ? '25' : String((D.matrix?.n_steps || [])[0] || ''));
  populateSelect('edmMode', unique(D.summary.edm.map(r => r.mode)), 'ode_heun');
  populateSelect('edmMetric', Object.keys(D.metrics.edm).map(k => `${k}|${D.metrics.edm[k].label}`), 'fid_inception|Inception FID');
  const summaryAlphaFamilies = unique(D.summary.alphaflow.map(r => r.schedule_family));
  const alphaSummaryDatasets = unique(D.summary.alphaflow.map(r => r.dataset_group));
  const alphaSummarySizes = unique(D.summary.alphaflow.map(r => r.size_group));
  const alphaMetricOptions = mainTableMetrics(Object.keys(D.metrics.alphaflow)).map(k => `${k}|${D.metrics.alphaflow[k].label}`);
  const edmMetricOptions = HERO_EDM_METRICS.map(k => `${k}|${D.metrics.edm[k].label}`);
  const heroAlphaMetricOptions = HERO_ALPHA_METRICS.map(k => `${k}|${D.metrics.alphaflow[k].label}`);
  const orderedSizes = SIZE_ORDER.filter(size => alphaSummarySizes.includes(size));
  populateSelect('odeEdmMetric', edmMetricOptions, 'fid_inception|Inception FID');
  populateSelect('sdeEdmMetric', edmMetricOptions, 'fid_inception|Inception FID');
  populateSelect('odeAlphaMetric', heroAlphaMetricOptions, 'plddt_mean|pLDDT');
  populateSelect('sdeAlphaMetric', heroAlphaMetricOptions, 'plddt_mean|pLDDT');
  populateSelect('odeAlphaSize', orderedSizes, 'All');
  populateSelect('sdeAlphaSize', orderedSizes, 'All');
  populateSelect('explorerDomain', ['AlphaFlow', 'EDM', 'All'], 'AlphaFlow');
  populateSelect('explorerMetric', EXPLORER_METRICS.map(k => `${k}|${explorerMetricLabel(k)}`), 'plddt_mean|pLDDT');
  populateSelect('explorerAgg', ['mean|Mean', 'median|Median', 'sum|Sum', 'min|Min', 'max|Max', 'count|Count'], 'mean|Mean');
  populateSelect('alphaFamily', summaryAlphaFamilies, preferredAlphaFamily(summaryAlphaFamilies));
  populateSelect('alphaDataset', alphaSummaryDatasets, 'All');
  populateSelect('alphaSize', alphaSummarySizes, 'All');
  populateSelect('alphaMetric', alphaMetricOptions, 'plddt_mean|pLDDT');
  populateSelect('alphaUnifiedDataset', alphaSummaryDatasets, 'All');
  populateSelect('alphaUnifiedSize', alphaSummarySizes, 'All');
  populateSelect('alphaUnifiedMetric', alphaMetricOptions, 'plddt_mean|pLDDT');
  const tags = unique(D.figures.diagnostics.flatMap(f => f.tags));
  populateSelect('figureTag', ['All', ...tags], 'All');
  const runLabels = unique((D.runs?.figures || []).map(f => `${f.run}|${f.run_label}`));
  populateSelect('runFigureRun', ['All', ...runLabels], 'All');
  const paperGroups = unique((D.paper_tables || []).map(t => t.group));
  populateSelect('paperTableGroup', ['All', ...paperGroups], 'All');
  const evidenceDomains = unique((D.evidence?.leaderboard || []).map(r => r.domain));
  populateSelect('evidenceDomain', ['All', ...evidenceDomains], 'All');
  const evidenceGroups = unique((D.evidence?.tables || []).map(t => t.group));
  populateSelect('evidenceTableGroup', ['All', ...evidenceGroups], 'All');
  populateSelect('evidenceTableSelect', (D.evidence?.tables || []).map((t, i) => `${i}|${t.title}`), (D.evidence?.tables || []).length ? `0|${D.evidence.tables[0].title}` : undefined);
  populateSelect('tarchicAtlasRun', ['All', ...unique(TARCHIC_CHARTS.map(chart => chart.run))], 'All');
  populateSelect('tarchicAtlasCategory', ['All', ...unique(TARCHIC_CHARTS.map(chart => chart.category))], 'All');
  populateSelect('deltaDomain', ['All', 'EDM', 'AlphaFlow'], 'All');
  populateSelect('deltaSampler', ['All', 'ODE', 'SDE'], 'All');
  populateSelect('deltaDataset', ['All', 'EDM', 'CAMEO', 'ATLAS'], 'All');
  populateSelect('deltaSize', ['__all__|All protein sizes', 'Overall', 'Short', 'Medium', 'Large'], '__all__|All protein sizes');
  populateSelect('deltaMetric', [
    'All',
    'fid_inception|Inception FID',
    'fid_pixel|Pixel FID',
    'plddt_mean|pLDDT',
    'diversity|Diversity',
    'rmsd_mean|Endpoint spread',
    'invalid_rate|Invalid rate'
  ], 'All');
  populateSelect('deltaStatus', [
    'All',
    'ci_win|CI-separated wins',
    'win|Positive entropic wins',
    'tie|Competitive/no-collapse',
    'loss|Losses or reversals'
  ], 'All');
}

function metricKey(selectValue) {
  return String(selectValue).split('|')[0];
}

function filteredEdmSummary() {
  const mode = $('edmMode').value;
  return D.summary.edm.filter(r => r.mode === mode);
}

function edmBaselineMatrixRecord(mode, scheduler, step) {
  return (D.matrix?.records || []).find(r =>
    r.evidence_set === 'primary' &&
    r.domain === 'edm' &&
    r.dataset_key === 'edm' &&
    r.edm_mode === mode &&
    r.scheduler === scheduler &&
    Number(r.n_steps) === Number(step)
  );
}

function splitEdmSummaryRow(row) {
  const scheduler = row.scheduler;
  if (scheduler !== 'entropic' && scheduler !== EDM_SPOTLIGHT_SCHEDULER) {
    return [{
      ...row,
      scheduler,
      metric_values: cloneMetricValuesWithEdmSupport(row.metric_values),
      edm_support_note: 'seed-level EDM metric rows'
    }];
  }
  const baseline = edmBaselineMatrixRecord(row.mode, scheduler, row.n_steps);
  if (!baseline) {
    return [{
      ...row,
      scheduler,
      metric_values: cloneMetricValuesWithEdmSupport(row.metric_values),
      edm_support_note: 'pooled entropic EDM row'
    }];
  }
  const baselineKey = `edm_baseline__${scheduler}`;
  const condmargKey = `edm_condmarg__${scheduler}`;
  const condmargMetrics = {};
  Object.keys(row.metric_values || {}).forEach(metric => {
    condmargMetrics[metric] = pooledComplementStat(row.metric_values[metric], baseline.metric_values?.[metric]);
  });
  return [
    {
      ...row,
      scheduler: baselineKey,
      scheduler_base: scheduler,
      edm_entropy_mode: EDM_SPLIT_VARIANTS[baselineKey].mode,
      metric_values: cloneMetricValuesWithEdmSupport(baseline.metric_values),
      edm_support_note: 'baseline empirical-Hutchinson EDM sweep'
    },
    {
      ...row,
      scheduler: condmargKey,
      scheduler_base: scheduler,
      edm_entropy_mode: EDM_SPLIT_VARIANTS[condmargKey].mode,
      metric_values: condmargMetrics,
      edm_support_note: 'supplemental EDM cond-marg ablation; excluded from main evidence'
    }
  ];
}

function filteredAlphaSummary() {
  const family = $('alphaFamily').value;
  const ds = $('alphaDataset').value;
  const size = $('alphaSize').value;
  return D.summary.alphaflow.filter(r => r.schedule_family === family && r.dataset_group === ds && r.size_group === size);
}

function stepsFrom(rows) {
  return unique(rows.map(r => Number(r.n_steps))).sort((a, b) => a - b);
}

function schedulersFrom(rows) {
  return unique(rows.map(r => r.scheduler)).sort((a, b) => schedulerRank(a) - schedulerRank(b));
}

function allMeasuredEdmSchedulers() {
  const measured = unique((D.summary?.edm || []).map(row => row.scheduler));
  return [
    ...schedulerOrder.filter(scheduler => measured.includes(scheduler)),
    ...measured.filter(scheduler => !schedulerOrder.includes(scheduler)).sort((a, b) => schedulerRank(a) - schedulerRank(b))
  ];
}

function allMeasuredAlphaVariants() {
  const measured = unique((D.summary?.alphaflow || []).map(alphaVariantKey));
  return [
    ...ALPHA_UNIFIED_VARIANT_ORDER.filter(key => measured.includes(key)),
    ...measured.filter(key => !ALPHA_UNIFIED_VARIANT_ORDER.includes(key)).sort((a, b) => alphaVariantRank(a) - alphaVariantRank(b))
  ];
}

function allMeasuredAlphaSchedulersForFamily(family) {
  return unique(allMeasuredAlphaVariants()
    .filter(key => !family || alphaVariantFamily(key) === family)
    .map(alphaVariantScheduler))
    .sort((a, b) => schedulerRank(a) - schedulerRank(b));
}

function allAlphaHeroRowIds(sizes = SIZE_ORDER) {
  return sizes.flatMap(size => allMeasuredAlphaVariants().map(key => `${size}__${key}`));
}

function scorecardSchedulers(rows, domain) {
  if (domain === 'edm') return rankedEdmSchedulers(rows, allMeasuredEdmSchedulers());
  if (domain === 'alphaflow') {
    const family = rows.find(Boolean)?.schedule_family || $('alphaFamily')?.value || 'standard';
    return allMeasuredAlphaSchedulersForFamily(family);
  }
  return schedulersFrom(rows);
}

function schedulerLabelForRows(rows, scheduler, domain) {
  if (domain !== 'alphaflow') return schedulerLabel(scheduler);
  const row = rows.find(r => r.scheduler === scheduler);
  const family = row?.schedule_family || $('alphaFamily')?.value || 'standard';
  return alphaVariantLabel(alphaVariantKeyFromParts(family, scheduler));
}

function schedulerColorForRows(rows, scheduler, domain) {
  if (domain !== 'alphaflow') return schedulerColor(scheduler);
  const row = rows.find(r => r.scheduler === scheduler);
  const family = row?.schedule_family || $('alphaFamily')?.value || 'standard';
  return alphaVariantColor(alphaVariantKeyFromParts(family, scheduler));
}

function bestByStep(rows, metric, domain) {
  const cfg = metricConfig(domain, metric);
  const best = {};
  stepsFrom(rows).forEach(step => {
    const candidates = rows.filter(r => Number(r.n_steps) === Number(step) && r.metric_values[metric] && r.metric_values[metric].mean !== null);
    if (!candidates.length) return;
    candidates.sort((a, b) => {
      const av = a.metric_values[metric].mean;
      const bv = b.metric_values[metric].mean;
      return cfg.direction === 'higher' ? bv - av : av - bv;
    });
    best[step] = candidates[0].scheduler;
  });
  return best;
}

function renderScorecard(containerId, rows, metrics, domain) {
  const steps = stepsFrom(rows);
  const schedulers = scorecardSchedulers(rows, domain);
  const best = {};
  metrics.forEach(m => { best[m] = bestByStep(rows, m, domain); });
  const includeAlphaBadges = domain === 'alphaflow' && $('alphaFamily') && isAlphaSpotlightFamily($('alphaFamily').value);
  let html = '<table><thead><tr><th rowspan="2">Scheduler</th>';
  steps.forEach(step => { html += `<th colspan="${metrics.length}">${step} NFE</th>`; });
  html += '</tr><tr>';
  steps.forEach(() => metrics.forEach(m => {
    const cfg = metricConfig(domain, m);
    html += `<th title="${htmlEscape(cfg.label)}; ${htmlEscape(directionShort(cfg.direction))}">${htmlEscape(shortMetricLabel(domain, m))}</th>`;
  }));
  html += '</tr></thead><tbody>';
  schedulers.forEach(scheduler => {
    const rowClass = domain === 'edm' && isEdmSpotlightScheduler(scheduler) ? 'spotlight-row-edm' : (includeAlphaBadges ? 'spotlight-row-alpha' : '');
    const displayLabel = schedulerLabelForRows(rows, scheduler, domain);
    const compactLabel = domain === 'alphaflow'
      ? shortAlphaVariantLabel(alphaVariantKeyFromParts(rows.find(r => r.scheduler === scheduler)?.schedule_family || $('alphaFamily')?.value || 'standard', scheduler))
      : shortSchedulerLabel(scheduler);
    const displayColor = schedulerColorForRows(rows, scheduler, domain);
    html += `<tr class="${rowClass}"><td title="${htmlEscape(displayLabel)}"><span class="scheduler-name"><span class="swatch" style="background:${htmlEscape(displayColor)}"></span>${htmlEscape(compactLabel)}</span>${domain === 'edm' ? schedulerBadges(scheduler, { domain: 'edm' }) : ''}</td>`;
    steps.forEach(step => {
      const row = rows.find(r => r.scheduler === scheduler && Number(r.n_steps) === Number(step));
      metrics.forEach(m => {
        const cfg = metricConfig(domain, m);
        const isBest = best[m][step] === scheduler;
        const cellClasses = [isBest ? 'best' : '', domain === 'edm' && isEdmSpotlightScheduler(scheduler) ? 'spotlight-cell-edm' : '', includeAlphaBadges ? 'spotlight-cell-alpha' : ''].filter(Boolean).join(' ');
        html += `<td class="${cellClasses}">${formatScorecardCell(row && row.metric_values[m], cfg, domain)}</td>`;
      });
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  $(containerId).innerHTML = html;
}

function renderBestCards(containerId, rows, metric, domain) {
  const cfg = metricConfig(domain, metric);
  const best = bestByStep(rows, metric, domain);
  const supportCard = domain === 'edm'
    ? '<div class="mini-card support-card"><div class="label">EDM support</div><div class="value">Seed rows vs image samples</div><div class="detail">CI uses seed-level FID rows. Each seed generated 64 images; entropic EDM is split into baseline and cond-marg variants.</div></div>'
    : '';
  const cards = stepsFrom(rows).map(step => {
    const scheduler = best[step];
    const row = rows.find(r => r.scheduler === scheduler && Number(r.n_steps) === Number(step));
    const stat = row && row.metric_values[metric];
    const displayLabel = row && domain === 'alphaflow' ? alphaVariantLabelFromRecord(row) : schedulerLabel(scheduler || 'n/a');
    return `<div class="mini-card"><div class="label">${step} NFE best ${cfg.direction}</div><div class="value">${htmlEscape(displayLabel)}</div><div class="detail">${formatScorecardCell(stat, cfg, domain)}</div></div>`;
  }).join('');
  $(containerId).innerHTML = supportCard + cards;
}

function chartSchedulerBucket(regime, domain) {
  if (!chartSchedulerState[regime]) chartSchedulerState[regime] = {};
  if (!chartSchedulerState[regime][domain]) chartSchedulerState[regime][domain] = { known: [], selected: [] };
  return chartSchedulerState[regime][domain];
}

function syncChartSchedulerSelection(regime, domain, keys) {
  const bucket = chartSchedulerBucket(regime, domain);
  const keySet = new Set(keys);
  const previousKnown = new Set(bucket.known || []);
  if (!bucket.known.length && !bucket.selected.length) {
    bucket.selected = [...keys];
  } else {
    const kept = (bucket.selected || []).filter(key => keySet.has(key));
    const additions = keys.filter(key => !previousKnown.has(key));
    bucket.selected = [...kept, ...additions];
  }
  bucket.known = [...keys];
  return bucket.selected;
}

function setChartSchedulerSelection(regime, domain, key, checked) {
  const bucket = chartSchedulerBucket(regime, domain);
  const selected = new Set(bucket.selected || []);
  if (checked) selected.add(key);
  else selected.delete(key);
  bucket.selected = (bucket.known || []).filter(item => selected.has(item));
  renderRegimeCharts(regime);
}

function setAllChartSchedulers(regime, domain, checked) {
  const bucket = chartSchedulerBucket(regime, domain);
  bucket.selected = checked ? [...(bucket.known || [])] : [];
  renderRegimeCharts(regime);
}

function chartSchedulerFilterGroup(regime, domain, title, keys, selectedKeys, labelFn, colorFn) {
  const selected = new Set(selectedKeys);
  const options = keys.map(key => `
    <label class="scheduler-toggle" title="${htmlEscape(labelFn(key))}">
      <input type="checkbox" data-chart-filter-domain="${htmlEscape(domain)}" data-chart-filter-key="${htmlEscape(key)}" ${selected.has(key) ? 'checked' : ''}>
      <span class="swatch" style="background:${htmlEscape(colorFn(key))}"></span>
      <span class="scheduler-toggle-text">${htmlEscape(labelFn(key))}</span>
    </label>
  `).join('');
  return `<div class="scheduler-filter-group">
    <div class="scheduler-filter-head">
      <span>${htmlEscape(title)}</span>
      <span class="scheduler-filter-count">${selectedKeys.length}/${keys.length} visible</span>
      <span class="scheduler-filter-actions">
        <button type="button" data-chart-filter-domain="${htmlEscape(domain)}" data-chart-filter-action="all">All</button>
        <button type="button" data-chart-filter-domain="${htmlEscape(domain)}" data-chart-filter-action="none">None</button>
      </span>
    </div>
    <div class="scheduler-filter-options">${options || '<span class="weak">No schedulers</span>'}</div>
  </div>`;
}

function renderSchedulerFilterPanel(regime, edmRows, alphaRows, targetId = `${regime}SchedulerFilters`, visibleDomain = 'both') {
  const el = $(targetId);
  const edmKeys = schedulersFrom(edmRows);
  const alphaKeys = unique(alphaRows.map(alphaVariantKey)).sort((a, b) => alphaVariantRank(a) - alphaVariantRank(b));
  const edmSelected = syncChartSchedulerSelection(regime, 'edm', edmKeys);
  const alphaSelected = syncChartSchedulerSelection(regime, 'alpha', alphaKeys);
  if (!el) return { edm: edmSelected, alpha: alphaSelected };
  const groups = [];
  if (visibleDomain === 'both' || visibleDomain === 'edm') {
    groups.push(chartSchedulerFilterGroup(regime, 'edm', 'EDM scheduler variants', edmKeys, edmSelected, schedulerLabel, schedulerColor));
  }
  if (visibleDomain === 'both' || visibleDomain === 'alpha') {
    groups.push(chartSchedulerFilterGroup(regime, 'alpha', 'AlphaFlow scheduler variants', alphaKeys, alphaSelected, alphaVariantLabel, alphaVariantColor));
  }
  el.innerHTML = groups.join('');
  el.querySelectorAll('input[data-chart-filter-key]').forEach(input => {
    input.addEventListener('change', () => {
      setChartSchedulerSelection(regime, input.dataset.chartFilterDomain, input.dataset.chartFilterKey, input.checked);
    });
  });
  el.querySelectorAll('button[data-chart-filter-action]').forEach(button => {
    button.addEventListener('click', () => {
      setAllChartSchedulers(regime, button.dataset.chartFilterDomain, button.dataset.chartFilterAction === 'all');
    });
  });
  return { edm: edmSelected, alpha: alphaSelected };
}

function linePlot(divId, rows, metric, domain, title) {
  if (!rows.length) {
    showPlotNotice(divId, `No ${domain === 'edm' ? 'EDM' : 'AlphaFlow'} schedulers are selected for this chart.`);
    return;
  }
  const cfg = metricConfig(domain, metric);
  const alphaSpotlight = domain === 'alphaflow' && $('alphaFamily') && isAlphaSpotlightFamily($('alphaFamily').value);
  const traces = schedulersFrom(rows).map(scheduler => {
    const pts = rows.filter(r => r.scheduler === scheduler && r.metric_values[metric]).sort((a, b) => Number(a.n_steps) - Number(b.n_steps));
    const spotlight = (domain === 'edm' && isEdmSpotlightScheduler(scheduler)) || alphaSpotlight;
    const edmDash = String(scheduler).startsWith('edm_baseline__') ? 'dot' : (String(scheduler).startsWith('edm_condmarg__') ? 'solid' : undefined);
    const displayLabel = schedulerLabelForRows(rows, scheduler, domain);
    const displayColor = schedulerColorForRows(rows, scheduler, domain);
    return {
      x: pts.map(r => Number(r.n_steps)),
      y: pts.map(r => r.metric_values[metric].mean),
      error_y: { type: 'data', array: pts.map(r => r.metric_values[metric].ci || 0), visible: true, thickness: 1 },
      mode: 'lines+markers',
      name: displayLabel,
      line: { color: displayColor, width: spotlight ? 4 : (isEntropicScheduler(scheduler) ? 3 : 2), dash: edmDash },
      marker: { size: spotlight ? 10 : (isEntropicScheduler(scheduler) ? 9 : 7), line: spotlight ? { color: '#101828', width: 1.5 } : undefined }
    };
  }).filter(trace => trace.x.length);
  if (!traces.length) {
    showPlotNotice(divId, `No rows with ${cfg.label} are available for the selected schedulers.`);
    return;
  }
  Plotly.newPlot(divId, traces, plotLayout(title, 'NFE steps', cfg.label), { responsive: true, displaylogo: false });
}

function bestHeatmapOverlayTrace(z, x, y, direction, text) {
  const colCount = Math.max(0, ...z.map(row => row.length));
  const mask = z.map(row => row.map(() => null));
  for (let col = 0; col < colCount; col += 1) {
    const candidates = z
      .map((row, rowIndex) => ({ rowIndex, value: Number(row[col]) }))
      .filter(item => Number.isFinite(item.value));
    if (!candidates.length) continue;
    candidates.sort((a, b) => direction === 'lower' ? a.value - b.value : b.value - a.value);
    mask[candidates[0].rowIndex][col] = 1;
  }
  const hasBest = mask.some(row => row.some(value => value !== null));
  if (!hasBest) return null;
  const overlay = {
    type: 'heatmap',
    x,
    y,
    z: mask,
    zmin: 0,
    zmax: 1,
    colorscale: [[0, BEST_HIGHLIGHT_COLOR], [1, BEST_HIGHLIGHT_COLOR]],
    showscale: false,
    hoverinfo: 'skip',
    opacity: 0.78,
    name: 'Best in column'
  };
  if (text) {
    overlay.text = mask.map((row, rowIndex) => row.map((value, colIndex) => value === null ? '' : (text[rowIndex]?.[colIndex] || '')));
    overlay.texttemplate = '%{text}';
    overlay.textfont = { color: '#3d2b00', size: 11 };
  }
  return overlay;
}

function heatmapPlot(divId, rows, metric, domain, title) {
  if (!rows.length) {
    showPlotNotice(divId, `No ${domain === 'edm' ? 'EDM' : 'AlphaFlow'} schedulers are selected for this chart.`);
    return;
  }
  const cfg = metricConfig(domain, metric);
  const steps = stepsFrom(rows);
  const schedulers = schedulersFrom(rows);
  if (!steps.length || !schedulers.length) {
    showPlotNotice(divId, `No rows with ${cfg.label} are available for the selected schedulers.`);
    return;
  }
  const z = schedulers.map(s => steps.map(step => {
    const row = rows.find(r => r.scheduler === s && Number(r.n_steps) === Number(step));
    return row && row.metric_values[metric] ? row.metric_values[metric].mean : null;
  }));
  const text = z.map(row => row.map(v => v === null ? '' : formatValue(v, cfg.fmt)));
  const y = schedulers.map(scheduler => schedulerLabelForRows(rows, scheduler, domain));
  const baseTrace = {
    type: 'heatmap',
    x: steps,
    y,
    z,
    text,
    texttemplate: '%{text}',
    colorscale: HEATMAP_VALUE_SCALE,
    colorbar: { title: cfg.label }
  };
  const traces = [baseTrace, bestHeatmapOverlayTrace(z, steps, y, cfg.direction, text)].filter(Boolean);
  Plotly.newPlot(divId, traces, plotLayout(title, 'NFE steps', 'scheduler variant'), { responsive: true, displaylogo: false });
}

function alphaUnifiedRows() {
  const ds = $('alphaUnifiedDataset').value;
  const size = $('alphaUnifiedSize').value;
  return D.summary.alphaflow.filter(r => r.dataset_group === ds && r.size_group === size);
}

function alphaUnifiedVariants(rows) {
  return allMeasuredAlphaVariants();
}

function alphaUnifiedStat(rows, key, step, metric) {
  const row = rows.find(r => alphaVariantKey(r) === key && Number(r.n_steps) === Number(step));
  return { row, stat: row?.metric_values?.[metric] };
}

function alphaUnifiedBestByStep(rows, metric) {
  const cfg = metricConfig('alphaflow', metric);
  const best = {};
  stepsFrom(rows).forEach(step => {
    const candidates = rows.filter(r => Number(r.n_steps) === Number(step) && r.metric_values?.[metric]?.mean !== null && r.metric_values?.[metric]?.mean !== undefined);
    if (!candidates.length) return;
    candidates.sort((a, b) => {
      const av = a.metric_values[metric].mean;
      const bv = b.metric_values[metric].mean;
      return cfg.direction === 'higher' ? bv - av : av - bv;
    });
    best[step] = alphaVariantKey(candidates[0]);
  });
  return best;
}

function alphaUnifiedBestVariant(rows, step, metric, predicate) {
  const cfg = metricConfig('alphaflow', metric);
  const candidates = rows
    .filter(r => Number(r.n_steps) === Number(step) && predicate(alphaVariantKey(r)) && r.metric_values?.[metric]?.mean !== null && r.metric_values?.[metric]?.mean !== undefined)
    .sort((a, b) => {
      const av = a.metric_values[metric].mean;
      const bv = b.metric_values[metric].mean;
      return cfg.direction === 'higher' ? bv - av : av - bv;
    });
  if (!candidates.length) return null;
  const row = candidates[0];
  return { key: alphaVariantKey(row), row, stat: row.metric_values[metric] };
}

function alphaUnifiedAdvantageText(condBest, standardBest, cfg) {
  if (!condBest?.stat || !standardBest?.stat) return 'One side is missing for this filter, so no family-level gap is reported.';
  const advantage = cfg.direction === 'higher'
    ? condBest.stat.mean - standardBest.stat.mean
    : standardBest.stat.mean - condBest.stat.mean;
  const leader = advantage >= 0 ? alphaVariantLabel(condBest.key) : alphaVariantLabel(standardBest.key);
  return `${leader} leads the best opposite-family comparator by ${formatValue(Math.abs(advantage), cfg.fmt)} on ${cfg.label}.`;
}

function showPlotNotice(divId, message) {
  const el = $(divId);
  if (window.Plotly?.purge) Plotly.purge(el);
  el.innerHTML = `<div class="notice plot-notice">${htmlEscape(message)}</div>`;
}

function renderAlphaUnifiedSummary(rows, metric) {
  const cfg = metricConfig('alphaflow', metric);
  const steps = stepsFrom(rows);
  const best = alphaUnifiedBestByStep(rows, metric);
  const variants = alphaUnifiedVariants(rows);
  const ds = $('alphaUnifiedDataset').value;
  const size = $('alphaUnifiedSize').value;
  const partial = rows.some(isAlphaUnifiedPartialRow);
  const cards = [
    `<div class="mini-card alpha-unified-note"><div class="label">Unified AlphaFlow view</div><div class="value">${variants.length} measured variants</div><div class="detail">${htmlEscape(ds)} · ${htmlEscape(size)} · scheduler-variant rows, no synthetic n/a comparator cells${partial ? ' · partial standard-large rows marked' : ''}</div></div>`
  ];
  steps.forEach(step => {
    const key = best[step];
    const { stat } = alphaUnifiedStat(rows, key, step, metric);
    cards.push(`<div class="mini-card"><div class="label">${step} NFE best ${cfg.direction}</div><div class="value">${htmlEscape(alphaVariantLabel(key || 'n/a'))}</div><div class="detail">${formatCell(stat, cfg)}</div></div>`);
  });
  $('alphaUnifiedSummary').innerHTML = cards.join('');
}

function renderAlphaUnifiedAnalysis(rows, metric) {
  const cfg = metricConfig('alphaflow', metric);
  const steps = stepsFrom(rows);
  const variants = alphaUnifiedVariants(rows);
  if (!rows.length || !steps.length || !variants.length) {
    $('alphaUnifiedAnalysis').innerHTML = '<div class="analysis-card alpha-focus"><h4>No unified AlphaFlow rows</h4><p>The selected dataset and size do not have run41 summary rows.</p></div>';
    return;
  }
  const step = steps[steps.length - 1];
  const overallBest = alphaUnifiedBestVariant(rows, step, metric, () => true);
  const condBest = alphaUnifiedBestVariant(rows, step, metric, key => isAlphaSpotlightFamily(alphaVariantFamily(key)));
  const standardBest = alphaUnifiedBestVariant(rows, step, metric, key => alphaVariantFamily(key) === 'standard');
  const partial = rows.some(isAlphaUnifiedPartialRow);
  const metricStory = ALPHA_METRIC_ANALYSIS[metric] || `${cfg.label} should be interpreted using its configured ${cfg.direction}-is-better direction.`;
  const condDetail = condBest ? `${alphaVariantLabel(condBest.key)}: ${formatCell(condBest.stat, cfg)}` : 'No cond-marg variant is available in this filter.';
  const standardDetail = standardBest ? `${alphaVariantLabel(standardBest.key)}: ${formatCell(standardBest.stat, cfg)}` : 'No standard variant is available in this filter.';
  const leaderDetail = overallBest ? `${alphaVariantLabel(overallBest.key)} is the ${step} NFE leader for ${cfg.label} (${formatCell(overallBest.stat, cfg)}).` : `No ${cfg.label} leader is available at ${step} NFE.`;
  $('alphaUnifiedAnalysis').innerHTML = [
    `<article class="analysis-card alpha-focus">
      <h4>What changed</h4>
      <p>This table compares the measured AlphaFlow scheduler variants: Entropic · cond-marg and Entropic-log1p · cond-marg are separate from Linear · standard, Cosine · standard, Sigmoid · standard, Power-2 · standard, Entropic · standard, and Entropic-log1p · standard.</p>
      <p class="bottom-line"><strong>Bottom line.</strong> Read each row as Scheduler · family. Cond-marg rows are the highlighted mechanism; standard rows are the baseline family.</p>
    </article>`,
    `<article class="analysis-card alpha-focus">
      <h4>${htmlEscape(cfg.label)} readout</h4>
      <p>${htmlEscape(metricStory)}</p>
      <p>${leaderDetail} ${alphaUnifiedAdvantageText(condBest, standardBest, cfg)}</p>
      <p class="bottom-line"><strong>Bottom line.</strong> ${cfg.direction === 'higher' ? 'Higher' : 'Lower'} is better for this selected metric, but the conclusion should still be checked against the other table columns.</p>
    </article>`,
    `<article class="analysis-card alpha-focus">
      <h4>Family comparison at ${step} NFE</h4>
      <p><strong>Best cond-marg:</strong> ${condDetail}</p>
      <p><strong>Best standard:</strong> ${standardDetail}</p>
      <p>${partial ? RUN41_STANDARD_TIMEOUT_NOTE : 'This selection does not require the large-protein partial-standard caveat.'}</p>
    </article>`,
    `<article class="analysis-card alpha-focus">
      <h4>Scheduler mechanics</h4>
      <p>Linear · standard is the uniform baseline, so it is stable but blind to where the protein bridge is difficult. Cosine · standard and Sigmoid · standard shift budget toward smoother endpoint or transition behavior. Entropic · standard and Entropic-log1p · standard reweight by entropy without the cond-marg mechanism. Entropic-log1p · cond-marg keeps the cond-marg ordering but dampens extreme bridge-rate mass before CDF grid construction.</p>
      <p class="bottom-line"><strong>Bottom line.</strong> Cond-marg should win when bridge-aware allocation matters; the log1p cond-marg variant is the regularized version to compare when raw endpoint concentration is too sharp.</p>
    </article>`
  ].join('');
}

function renderAlphaUnifiedScorecard(rows) {
  const steps = stepsFrom(rows);
  const variants = alphaUnifiedVariants(rows);
  const metrics = ALPHA_UNIFIED_METRICS;
  if (!rows.length || !steps.length || !variants.length) {
    $('alphaUnifiedScorecard').innerHTML = '<p class="notice">No unified AlphaFlow summary rows match this filter.</p>';
    return;
  }
  const best = {};
  metrics.forEach(m => { best[m] = alphaUnifiedBestByStep(rows, m); });
  let html = '<table><thead><tr><th rowspan="2">Scheduler</th>';
  steps.forEach(step => { html += `<th colspan="${metrics.length}">${step} NFE</th>`; });
  html += '</tr><tr>';
  steps.forEach(() => metrics.forEach(m => {
    const cfg = metricConfig('alphaflow', m);
    html += `<th title="${htmlEscape(cfg.label)}; ${htmlEscape(directionShort(cfg.direction))}">${htmlEscape(shortMetricLabel('alphaflow', m))}</th>`;
  }));
  html += '</tr></thead><tbody>';
  variants.forEach(key => {
    const family = alphaVariantFamily(key);
    const scheduler = alphaVariantScheduler(key);
    const isCondmarg = isAlphaSpotlightFamily(family);
    const rowClass = isCondmarg ? 'spotlight-row-alpha alpha-unified-condmarg' : 'alpha-unified-standard';
    const partialRow = rows.some(r => alphaVariantKey(r) === key && isAlphaUnifiedPartialRow(r));
    const partialChip = partialRow ? '<span class="spotlight-chip partial-chip">partial large</span>' : '';
    html += `<tr class="${rowClass}"><td title="${htmlEscape(alphaVariantLabel(key))}"><span class="scheduler-name variant-name"><span class="swatch variant-swatch ${isCondmarg ? 'condmarg-swatch' : 'standard-swatch'}" style="background:${alphaVariantColor(key)}"></span>${htmlEscape(shortAlphaVariantLabel(key))}</span>${partialChip}</td>`;
    steps.forEach(step => {
      const row = rows.find(r => alphaVariantKey(r) === key && Number(r.n_steps) === Number(step));
      metrics.forEach(m => {
        const cfg = metricConfig('alphaflow', m);
        const isBest = best[m][step] === key;
        const cellClasses = [
          isBest ? 'best' : '',
          isCondmarg ? 'spotlight-cell-alpha' : '',
          isAlphaUnifiedPartialRow(row) ? 'partial-cell' : ''
        ].filter(Boolean).join(' ');
        const title = isAlphaUnifiedPartialRow(row) ? ` title="${htmlEscape(RUN41_STANDARD_TIMEOUT_NOTE)}"` : '';
        html += `<td class="${cellClasses}"${title}>${formatCell(row?.metric_values?.[m], cfg)}</td>`;
      });
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  $('alphaUnifiedScorecard').innerHTML = html;
}

function alphaUnifiedLinePlot(divId, rows, metric) {
  const cfg = metricConfig('alphaflow', metric);
  const variants = alphaUnifiedVariants(rows);
  if (!variants.length) {
    showPlotNotice(divId, 'No unified AlphaFlow rows match this filter.');
    return;
  }
  const traces = variants.map(key => {
    const pts = rows.filter(r => alphaVariantKey(r) === key && r.metric_values?.[metric]).sort((a, b) => Number(a.n_steps) - Number(b.n_steps));
    const isCondmarg = isAlphaSpotlightFamily(alphaVariantFamily(key));
    return {
      x: pts.map(r => Number(r.n_steps)),
      y: pts.map(r => r.metric_values[metric].mean),
      error_y: { type: 'data', array: pts.map(r => r.metric_values[metric].ci || 0), visible: true, thickness: isCondmarg ? 1.4 : 1 },
      mode: 'lines+markers',
      name: alphaVariantLabel(key),
      line: { color: alphaVariantColor(key), width: isCondmarg ? 4 : 2.2, dash: isCondmarg ? 'solid' : 'dot' },
      marker: { size: isCondmarg ? 10 : 7, symbol: isCondmarg ? 'diamond' : 'circle', line: isCondmarg ? { color: '#101828', width: 1.4 } : undefined }
    };
  });
  Plotly.newPlot(divId, traces, plotLayout(`AlphaFlow unified comparison: ${cfg.label}`, 'NFE steps', cfg.label), { responsive: true, displaylogo: false });
}

function alphaUnifiedHeatmapPlot(divId, rows, metric) {
  const cfg = metricConfig('alphaflow', metric);
  const steps = stepsFrom(rows);
  const variants = alphaUnifiedVariants(rows);
  if (!variants.length) {
    showPlotNotice(divId, 'No unified AlphaFlow rows match this filter.');
    return;
  }
  const z = variants.map(key => steps.map(step => alphaUnifiedStat(rows, key, step, metric).stat?.mean ?? null));
  const text = z.map(row => row.map(v => v === null ? '' : formatValue(v, cfg.fmt)));
  const y = variants.map(alphaVariantLabel);
  const baseTrace = {
    type: 'heatmap',
    x: steps,
    y,
    z,
    text,
    texttemplate: '%{text}',
    colorscale: HEATMAP_VALUE_SCALE,
    colorbar: { title: cfg.label }
  };
  const traces = [baseTrace, bestHeatmapOverlayTrace(z, steps, y, cfg.direction, text)].filter(Boolean);
  Plotly.newPlot(divId, traces, plotLayout(`AlphaFlow unified heatmap: ${cfg.label}`, 'NFE steps', 'scheduler variant'), { responsive: true, displaylogo: false });
}

function plotLayout(title, xTitle, yTitle) {
  return {
    title: { text: title, x: 0.02, xanchor: 'left', font: { size: 16 } },
    margin: { l: 70, r: 24, t: 58, b: 58 },
    paper_bgcolor: '#fff',
    plot_bgcolor: '#fff',
    xaxis: { title: xTitle, gridcolor: '#d5d9df', zerolinecolor: '#aab2bd' },
    yaxis: { title: yTitle, gridcolor: '#d5d9df', zerolinecolor: '#aab2bd' },
    legend: { orientation: 'h', y: -0.22, x: 0 }
  };
}

function deltaStatInterval(stat) {
  const mean = Number(stat?.mean);
  const ci = Number(stat?.ci || 0);
  if (!Number.isFinite(mean)) return null;
  return { low: mean - ci, high: mean + ci };
}

function deltaStatN(stat) {
  return Number(stat?.n || stat?.seed_n || 0);
}

function deltaCompare(entropicRow, baselineRow, metric, domain) {
  const cfg = metricConfig(domain, metric);
  const entropicStat = entropicRow?.metric_values?.[metric];
  const baselineStat = baselineRow?.metric_values?.[metric];
  const entropicMean = Number(entropicStat?.mean);
  const baselineMean = Number(baselineStat?.mean);
  if (!Number.isFinite(entropicMean) || !Number.isFinite(baselineMean)) return null;
  const delta = cfg.direction === 'higher' ? entropicMean - baselineMean : baselineMean - entropicMean;
  const pctGain = baselineMean === 0 ? null : 100 * delta / Math.abs(baselineMean);
  const entropicInterval = deltaStatInterval(entropicStat);
  const baselineInterval = deltaStatInterval(baselineStat);
  let ciSeparated = false;
  let ciLeader = 'overlap';
  if (entropicInterval && baselineInterval) {
    const entropicBetterSeparated = cfg.direction === 'higher'
      ? entropicInterval.low > baselineInterval.high
      : entropicInterval.high < baselineInterval.low;
    const baselineBetterSeparated = cfg.direction === 'higher'
      ? baselineInterval.low > entropicInterval.high
      : baselineInterval.high < entropicInterval.low;
    ciSeparated = entropicBetterSeparated || baselineBetterSeparated;
    ciLeader = entropicBetterSeparated ? 'entropic' : (baselineBetterSeparated ? 'baseline' : 'overlap');
  }
  const competitive = delta >= 0 || !ciSeparated || Math.abs(pctGain || 0) <= 2;
  const status = delta > 0 && ciLeader === 'entropic'
    ? 'ci_win'
    : (delta > 0 ? 'win' : (competitive ? 'tie' : 'loss'));
  return {
    cfg,
    entropicStat,
    baselineStat,
    entropicMean,
    baselineMean,
    delta,
    pctGain,
    ciSeparated,
    ciLeader,
    status,
    n: `${formatInt(deltaStatN(entropicStat))} / ${formatInt(deltaStatN(baselineStat))}`
  };
}

function deltaStatusRank(status) {
  return { ci_win: 0, win: 1, tie: 2, loss: 3 }[status] ?? 4;
}

function deltaStatusLabel(status) {
  return {
    ci_win: 'CI-separated entropic win',
    win: 'Positive entropic win',
    tie: 'Competitive/no-collapse',
    loss: 'Loss or reversal'
  }[status] || status;
}

function deltaStatusShortLabel(status) {
  return {
    ci_win: 'CI win',
    win: 'Win',
    tie: 'Tie',
    loss: 'Loss'
  }[status] || status;
}

function deltaStatusChip(status) {
  return `<span class="delta-status-chip ${htmlEscape(status.replace('_', '-'))}" title="${htmlEscape(deltaStatusLabel(status))}">${htmlEscape(deltaStatusShortLabel(status))}</span>`;
}

function deltaSignedClass(value) {
  if (!Number.isFinite(Number(value))) return 'delta-neutral';
  if (Number(value) > 0) return 'delta-positive';
  if (Number(value) < 0) return 'delta-negative';
  return 'delta-neutral';
}

function deltaMetricDisplay(domain, metric) {
  return metricConfig(domain, metric).label;
}

function deltaRowSort(a, b) {
  const statusCmp = deltaStatusRank(a.status) - deltaStatusRank(b.status);
  if (statusCmp) return statusCmp;
  const pctA = Number.isFinite(Number(a.pctGain)) ? Number(a.pctGain) : -Infinity;
  const pctB = Number.isFinite(Number(b.pctGain)) ? Number(b.pctGain) : -Infinity;
  if (pctA !== pctB) return pctB - pctA;
  return String(a.domain).localeCompare(String(b.domain)) ||
    String(a.dataset).localeCompare(String(b.dataset)) ||
    String(a.size).localeCompare(String(b.size)) ||
    Number(a.nfe) - Number(b.nfe) ||
    String(a.metricLabel).localeCompare(String(b.metricLabel));
}

function deltaRowsFromSlice({ rows, domain, sampler, dataset, size, nfe, metric }) {
  const entropicRows = rows.filter(row => isEntropicScheduler(row.scheduler));
  const baselineRows = rows.filter(row => !isEntropicScheduler(row.scheduler));
  const entropicBest = bestHeroRow(entropicRows, metric, domain);
  const baselineBest = bestHeroRow(baselineRows, metric, domain);
  const comparison = deltaCompare(entropicBest, baselineBest, metric, domain);
  if (!comparison) return null;
  const entropicLabel = domain === 'alphaflow' ? alphaVariantLabelFromRecord(entropicBest) : schedulerLabel(entropicBest.scheduler);
  const baselineLabel = domain === 'alphaflow' ? alphaVariantLabelFromRecord(baselineBest) : schedulerLabel(baselineBest.scheduler);
  return {
    domain: domain === 'edm' ? 'EDM' : 'AlphaFlow',
    domainKey: domain,
    sampler,
    dataset,
    size,
    datasetSize: domain === 'edm' ? dataset : `${dataset} / ${displaySize(size)}`,
    nfe: Number(nfe),
    metric,
    metricLabel: deltaMetricDisplay(domain, metric),
    entropicLabel,
    entropicKey: domain === 'alphaflow' ? alphaVariantKey(entropicBest) : entropicBest.scheduler,
    entropicColor: domain === 'alphaflow' ? alphaVariantColor(alphaVariantKey(entropicBest)) : schedulerColor(entropicBest.scheduler),
    baselineLabel,
    baselineKey: domain === 'alphaflow' ? alphaVariantKey(baselineBest) : baselineBest.scheduler,
    baselineColor: domain === 'alphaflow' ? alphaVariantColor(alphaVariantKey(baselineBest)) : schedulerColor(baselineBest.scheduler),
    ...comparison
  };
}

function allDeltaRows() {
  const rows = [];
  ['ode_heun', 'sde_heun'].forEach(mode => {
    const modeRows = edmRowsForMode(mode);
    stepsFrom(modeRows).forEach(step => {
      HERO_EDM_METRICS.forEach(metric => {
        const row = deltaRowsFromSlice({
          rows: modeRows.filter(item => Number(item.n_steps) === Number(step)),
          domain: 'edm',
          sampler: solverLabel(mode),
          dataset: 'EDM / CIFAR-10',
          size: 'Overall',
          nfe: step,
          metric
        });
        if (row) rows.push(row);
      });
    });
  });
  ['CAMEO', 'ATLAS'].forEach(dataset => {
    const datasetRows = alphaRowsForDataset(dataset);
    SIZE_ORDER.forEach(size => {
      const sizeRows = datasetRows.filter(row => row.size_group === size);
      stepsFrom(sizeRows).forEach(step => {
        HERO_ALPHA_METRICS.forEach(metric => {
          const row = deltaRowsFromSlice({
            rows: sizeRows.filter(item => Number(item.n_steps) === Number(step)),
            domain: 'alphaflow',
            sampler: 'AlphaFlow endpoint',
            dataset,
            size,
            nfe: step,
            metric
          });
          if (row) rows.push(row);
        });
      });
    });
  });
  return rows.sort(deltaRowSort);
}

function deltaFilterValue(id) {
  return metricKey($(id)?.value || 'All');
}

function filteredDeltaRows() {
  const domain = deltaFilterValue('deltaDomain');
  const sampler = deltaFilterValue('deltaSampler');
  const dataset = deltaFilterValue('deltaDataset');
  const size = deltaFilterValue('deltaSize');
  const metric = deltaFilterValue('deltaMetric');
  const status = deltaFilterValue('deltaStatus');
  const query = $('deltaSearch')?.value.trim().toLowerCase() || '';
  return allDeltaRows().filter(row => {
    if (domain !== 'All' && row.domain !== domain) return false;
    if (sampler !== 'All' && !String(row.sampler).toLowerCase().startsWith(sampler.toLowerCase())) return false;
    if (dataset !== 'All') {
      if (dataset === 'EDM' && row.domain !== 'EDM') return false;
      if (dataset !== 'EDM' && row.dataset !== dataset) return false;
    }
    if (size !== 'All' && size !== '__all__' && row.size !== size) return false;
    if (metric !== 'All' && row.metric !== metric) return false;
    if (status !== 'All' && row.status !== status) return false;
    if (query) {
      const haystack = `${row.domain} ${row.sampler} ${row.datasetSize} ${row.metricLabel} ${row.entropicLabel} ${row.baselineLabel} ${deltaStatusLabel(row.status)}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  }).sort(deltaRowSort);
}

function formatDeltaValue(row) {
  return `<span class="${deltaSignedClass(row.delta)}">${row.delta > 0 ? '+' : ''}${formatValue(row.delta, row.cfg.fmt)}</span>`;
}

function formatDeltaPct(row) {
  if (row.pctGain === null || row.pctGain === undefined || !Number.isFinite(Number(row.pctGain))) return '<span class="weak">n/a</span>';
  return `<span class="${deltaSignedClass(row.pctGain)}">${row.pctGain > 0 ? '+' : ''}${formatValue(row.pctGain, '.1f')}%</span>`;
}

function renderDeltaClaimCards() {
  const rows = allDeltaRows();
  const edmFid = rows.find(row => row.domain === 'EDM' && row.sampler === 'ODE Heun' && row.nfe === 5 && row.metric === 'fid_inception');
  const edmPixel = rows.find(row => row.domain === 'EDM' && row.sampler === 'ODE Heun' && row.nfe === 5 && row.metric === 'fid_pixel');
  const alphaLow = rows.filter(row => row.domain === 'AlphaFlow' && row.size === 'All' && row.nfe === 5 && row.metric === 'plddt_mean');
  const lowText = alphaLow.map(row => `${row.dataset}: ${row.entropicLabel} ${formatValue(row.entropicMean, row.cfg.fmt)} vs ${row.baselineLabel} ${formatValue(row.baselineMean, row.cfg.fmt)} (${formatDeltaPct(row).replace(/<[^>]*>/g, '')})`).join(' · ');
  const atlasRaw = D.summary.alphaflow.find(row => row.dataset_group === 'ATLAS' && row.size_group === 'All' && row.schedule_family === ALPHA_SPOTLIGHT_FAMILY && row.scheduler === 'entropic' && Number(row.n_steps) === 25);
  const atlasLog = D.summary.alphaflow.find(row => row.dataset_group === 'ATLAS' && row.size_group === 'All' && row.schedule_family === ALPHA_SPOTLIGHT_FAMILY && row.scheduler === EDM_SPOTLIGHT_SCHEDULER && Number(row.n_steps) === 25);
  const rawStat = atlasRaw?.metric_values?.plddt_mean;
  const logStat = atlasLog?.metric_values?.plddt_mean;
  const stabilizeDelta = rawStat && logStat ? Number(logStat.mean) - Number(rawStat.mean) : null;
  const cards = [
    {
      cls: 'edm',
      label: 'EDM quality win',
      title: 'Low-NFE ODE FID',
      value: edmFid ? `${formatDeltaPct(edmFid).replace(/<[^>]*>/g, '')} Inception FID` : 'n/a',
      text: edmFid ? `${edmFid.entropicLabel} beats ${edmFid.baselineLabel} at 5 NFE (${formatValue(edmFid.entropicMean, edmFid.cfg.fmt)} vs ${formatValue(edmFid.baselineMean, edmFid.cfg.fmt)}). Pixel FID shows ${edmPixel ? formatDeltaPct(edmPixel).replace(/<[^>]*>/g, '') : 'n/a'} gain.` : 'No matching EDM 5-NFE ODE FID slice is available.'
    },
    {
      cls: 'alpha',
      label: 'AlphaFlow low-budget bridge win',
      title: '5 NFE pLDDT',
      value: alphaLow.filter(row => row.delta > 0).length ? `${alphaLow.filter(row => row.delta > 0).length}/2 datasets positive` : 'mixed',
      text: lowText || 'No matching AlphaFlow all-protein 5-NFE pLDDT slice is available.'
    },
    {
      cls: 'stabilize',
      label: 'AlphaFlow stabilization win',
      title: 'Log-tempered cond-marg',
      value: Number.isFinite(stabilizeDelta) ? `+${formatValue(stabilizeDelta, '.2f')} pLDDT` : 'n/a',
      text: Number.isFinite(stabilizeDelta) ? `ATLAS All 25 NFE pLDDT: ${alphaVariantLabel(alphaVariantKey(atlasLog))} is ${formatValue(logStat.mean, '.2f')} vs raw ${alphaVariantLabel(alphaVariantKey(atlasRaw))} at ${formatValue(rawStat.mean, '.2f')}. This is a within-entropic-family stabilization claim, not a universal win claim.` : 'No matching ATLAS All 25-NFE cond-marg stabilization slice is available.'
    }
  ];
  $('deltaClaimCards').innerHTML = cards.map(card => `
    <article class="delta-claim-card ${htmlEscape(card.cls)}">
      <div class="label">${htmlEscape(card.label)}</div>
      <h3>${htmlEscape(card.title)}</h3>
      <div class="delta-value">${htmlEscape(card.value)}</div>
      <p>${htmlEscape(card.text)}</p>
    </article>`).join('');
}

function renderDeltaSummaryCards(rows) {
  const counts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  const best = rows.find(row => row.status === 'ci_win') || rows.find(row => row.status === 'win') || rows[0];
  const winCount = (counts.ci_win || 0) + (counts.win || 0);
  const tieCount = counts.tie || 0;
  const lossCount = counts.loss || 0;
  const details = [
    ['Visible slices', rows.length, 'domain / sampler / dataset / size / NFE / metric'],
    ['Wins', winCount, `${formatInt(counts.ci_win || 0)} CI-separated; ${formatInt(counts.win || 0)} positive with overlapping CIs`],
    ['Ties', tieCount, 'competitive/no-collapse by CI overlap, exact tie, or <=2% reversal'],
    ['Losses', lossCount, 'baseline leads by >2% with separated intervals'],
    ['Top visible effect', best ? `${best.domain} ${best.nfe} NFE` : 'n/a', best ? `${best.metricLabel}: ${best.entropicLabel} vs ${best.baselineLabel}` : 'n/a']
  ];
  $('deltaSummaryCards').innerHTML = details.map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
}

function renderDeltaCriteria(rows) {
  const el = $('deltaCriteria');
  if (!el) return;
  const counts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
  const winCount = (counts.ci_win || 0) + (counts.win || 0);
  el.innerHTML = `
    <div class="delta-criteria-counts" aria-label="Visible win map outcome counts">
      <span class="delta-count-pill win"><strong>${formatInt(winCount)}</strong> wins</span>
      <span class="delta-count-pill tie"><strong>${formatInt(counts.tie || 0)}</strong> ties</span>
      <span class="delta-count-pill loss"><strong>${formatInt(counts.loss || 0)}</strong> losses</span>
      <span class="delta-count-pill ci"><strong>${formatInt(counts.ci_win || 0)}</strong> CI-separated wins</span>
    </div>
    <div class="delta-criteria-text">
      <strong>Criteria.</strong>
      For every slice, the table chooses the best entropic variant and the best non-entropic comparator, then computes a metric-direction-adjusted delta:
      higher-is-better uses entropic mean minus baseline mean; lower-is-better uses baseline mean minus entropic mean.
      Win means delta &gt; 0. CI-separated win means the entropic 95% interval is strictly better than the comparator interval.
      Tie means delta is exactly non-negative but not separated, or a baseline-favoring reversal is not CI-separated, or the reversal is at most 2%.
      Loss means the baseline is better by more than 2% and the intervals separate in the baseline direction.
    </div>`;
}

function renderDeltaWinMap(rows) {
  if (!rows.length) {
    $('deltaWinMap').innerHTML = '<p class="notice">No delta slices match the current filters.</p>';
    return;
  }
  const displayRows = rows.slice(0, 500);
  let html = '<table><thead><tr><th title="Win category">State</th><th title="Domain">Dom.</th><th title="Sampler">Samp.</th><th title="Dataset / protein size">Slice</th><th>NFE</th><th>Metric</th><th title="Best entropic variant">Entropic</th><th title="Best non-entropic comparator">Comparator</th><th title="Signed delta after metric direction">Delta</th><th title="Percent gain">Gain</th><th title="Confidence intervals separated?">CI sep?</th><th>n</th></tr></thead><tbody>';
  displayRows.forEach(row => {
    const entropicDisplay = row.domainKey === 'alphaflow' ? shortAlphaVariantLabel(row.entropicKey) : shortSchedulerLabel(row.entropicKey);
    const baselineDisplay = row.domainKey === 'alphaflow' ? shortAlphaVariantLabel(row.baselineKey) : shortSchedulerLabel(row.baselineKey);
    html += `<tr>
      <td>${deltaStatusChip(row.status)}</td>
      <td>${htmlEscape(row.domain)}</td>
      <td>${htmlEscape(row.sampler)}</td>
      <td>${htmlEscape(row.datasetSize)}</td>
      <td>${formatInt(row.nfe)}</td>
      <td title="${htmlEscape(row.metricLabel)}">${htmlEscape(shortMetricLabel(row.domainKey, row.metric))}<span class="n">${htmlEscape(directionShort(row.cfg.direction))}</span></td>
      <td title="${htmlEscape(row.entropicLabel)}"><span class="scheduler-name"><span class="swatch" style="background:${htmlEscape(row.entropicColor)}"></span>${htmlEscape(entropicDisplay)}</span><span class="n">${formatCell(row.entropicStat, row.cfg)}</span></td>
      <td title="${htmlEscape(row.baselineLabel)}"><span class="scheduler-name"><span class="swatch" style="background:${htmlEscape(row.baselineColor)}"></span>${htmlEscape(baselineDisplay)}</span><span class="n">${formatCell(row.baselineStat, row.cfg)}</span></td>
      <td>${formatDeltaValue(row)}</td>
      <td>${formatDeltaPct(row)}</td>
      <td>${row.ciSeparated ? `<span class="${row.ciLeader === 'entropic' ? 'delta-positive' : 'delta-negative'}">yes</span>` : '<span class="weak">no</span>'}</td>
      <td>${htmlEscape(row.n)}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  $('deltaWinMap').innerHTML = html;
}

function renderDeltaLollipop(rows) {
  const divId = 'deltaLollipopPlot';
  const plotRows = rows.slice(0, 36).reverse();
  if (!plotRows.length) {
    showPlotNotice(divId, 'No delta slices match the current filters.');
    return;
  }
  const y = plotRows.map(row => `${row.domain} · ${row.sampler} · ${row.datasetSize} · ${row.nfe} NFE · ${row.metricLabel}`);
  const x = plotRows.map(row => row.pctGain);
  const colorsByStatus = {
    ci_win: '#c51b7d',
    win: '#f781bf',
    tie: '#9aa4b2',
    loss: '#b42318'
  };
  const markerColors = plotRows.map(row => colorsByStatus[row.status] || '#667085');
  const text = plotRows.map(row => `${row.entropicLabel}<br>vs ${row.baselineLabel}<br>${formatDeltaPct(row).replace(/<[^>]*>/g, '')} (${formatDeltaValue(row).replace(/<[^>]*>/g, '')})`);
  const traces = [
    {
      type: 'bar',
      orientation: 'h',
      x,
      y,
      text: plotRows.map(row => formatDeltaPct(row).replace(/<[^>]*>/g, '')),
      textposition: 'outside',
      hovertext: text,
      hoverinfo: 'text',
      marker: { color: markerColors, line: { color: '#202124', width: 0.4 } },
      cliponaxis: false
    },
    {
      type: 'scatter',
      mode: 'markers',
      x,
      y,
      hovertext: text,
      hoverinfo: 'text',
      marker: { size: 10, color: markerColors, line: { color: '#202124', width: 1 } },
      showlegend: false
    }
  ];
  const layout = plotLayout('Delta versus best non-entropic comparator', 'Percent gain: positive = entropic better', 'slice');
  layout.height = Math.max(660, 28 * plotRows.length + 180);
  layout.margin = { l: 310, r: 80, t: 58, b: 70 };
  layout.shapes = [{ type: 'line', x0: 0, x1: 0, y0: -0.5, y1: plotRows.length - 0.5, line: { color: '#202124', width: 1.2 } }];
  layout.xaxis = { ...layout.xaxis, zeroline: true, zerolinecolor: '#202124', ticksuffix: '%' };
  Plotly.newPlot(divId, traces, layout, { responsive: true, displaylogo: false });
}

function paretoFrontIndices(points, yDirection) {
  const front = [];
  points.forEach((point, index) => {
    const dominated = points.some((other, otherIndex) => {
      if (otherIndex === index) return false;
      const xBetter = other.x <= point.x;
      const yBetter = yDirection === 'lower' ? other.y <= point.y : other.y >= point.y;
      const strictly = other.x < point.x || (yDirection === 'lower' ? other.y < point.y : other.y > point.y);
      return xBetter && yBetter && strictly;
    });
    if (!dominated) front.push(index);
  });
  return new Set(front);
}

function paretoPointTrace(points, group, color, frontSet) {
  const groupPoints = points.filter(point => point.group === group);
  return {
    type: 'scatter',
    mode: 'markers+text',
    x: groupPoints.map(point => point.x),
    y: groupPoints.map(point => point.y),
    text: groupPoints.map(point => frontSet.has(point.index) ? point.label : ''),
    textposition: 'top center',
    hovertext: groupPoints.map(point => point.hover),
    hoverinfo: 'text',
    name: group,
    marker: {
      color,
      size: groupPoints.map(point => frontSet.has(point.index) ? 11 : 7),
      opacity: groupPoints.map(point => frontSet.has(point.index) ? 0.95 : 0.54),
      line: { color: '#202124', width: 0.5 }
    }
  };
}

function renderDeltaEdmPareto(rows) {
  const divId = 'deltaEdmParetoPlot';
  const domain = deltaFilterValue('deltaDomain');
  if (domain === 'AlphaFlow') {
    showPlotNotice(divId, 'EDM Pareto view is hidden by the AlphaFlow-only delta filter.');
    return;
  }
  const sampler = deltaFilterValue('deltaSampler');
  const sourceRows = D.summary.edm.filter(row => {
    if (sampler === 'ODE' && row.mode !== 'ode_heun') return false;
    if (sampler === 'SDE' && row.mode !== 'sde_heun') return false;
    return row.metric_values?.fid_inception?.mean !== null && row.metric_values?.infer_seconds?.mean !== null;
  });
  const points = sourceRows.map((row, index) => ({
    index,
    x: Number(row.metric_values.infer_seconds.mean),
    y: Number(row.metric_values.fid_inception.mean),
    group: schedulerLabel(row.scheduler),
    color: schedulerColor(row.scheduler),
    label: `${schedulerLabel(row.scheduler)} ${Number(row.n_steps)} NFE`,
    hover: `${solverLabel(row.mode)} · ${schedulerLabel(row.scheduler)} · ${Number(row.n_steps)} NFE<br>Seconds: ${formatValue(row.metric_values.infer_seconds.mean, '.3f')}<br>Inception FID: ${formatValue(row.metric_values.fid_inception.mean, '.1f')}`
  })).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!points.length) {
    showPlotNotice(divId, 'No EDM runtime/quality points match the current filters.');
    return;
  }
  const frontSet = paretoFrontIndices(points, 'lower');
  const traces = unique(points.map(point => point.group)).map(group => paretoPointTrace(points, group, points.find(point => point.group === group)?.color || '#7b8794', frontSet));
  const layout = plotLayout('EDM Pareto: Inception FID vs seconds', 'seconds / 64 images', 'Inception FID');
  layout.shapes = [];
  Plotly.newPlot(divId, traces, layout, { responsive: true, displaylogo: false });
}

function renderDeltaAlphaPareto(rows) {
  const divId = 'deltaAlphaParetoPlot';
  const domain = deltaFilterValue('deltaDomain');
  if (domain === 'EDM') {
    showPlotNotice(divId, 'AlphaFlow Pareto view is hidden by the EDM-only delta filter.');
    return;
  }
  const dataset = deltaFilterValue('deltaDataset');
  const size = deltaFilterValue('deltaSize');
  const sourceRows = D.summary.alphaflow.filter(row => {
    if (!['CAMEO', 'ATLAS'].includes(row.dataset_group)) return false;
    if (dataset !== 'All' && dataset !== 'EDM' && row.dataset_group !== dataset) return false;
    if (size !== 'All' && size !== '__all__' && row.size_group !== size) return false;
    return row.metric_values?.plddt_mean?.mean !== null && row.metric_values?.infer_seconds_per_output?.mean !== null;
  });
  const points = sourceRows.map((row, index) => {
    const key = alphaVariantKey(row);
    return {
      index,
      x: Number(row.metric_values.infer_seconds_per_output.mean),
      y: Number(row.metric_values.plddt_mean.mean),
      group: alphaVariantLabel(key),
      color: alphaVariantColor(key),
      label: `${alphaVariantLabel(key)} ${Number(row.n_steps)} NFE`,
      hover: `${row.dataset_group} · ${displaySize(row.size_group)} · ${alphaVariantLabel(key)} · ${Number(row.n_steps)} NFE<br>Seconds/output: ${formatValue(row.metric_values.infer_seconds_per_output.mean, '.3f')}<br>pLDDT: ${formatValue(row.metric_values.plddt_mean.mean, '.2f')}`
    };
  }).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (!points.length) {
    showPlotNotice(divId, 'No AlphaFlow runtime/quality points match the current filters.');
    return;
  }
  const frontSet = paretoFrontIndices(points, 'higher');
  const traces = unique(points.map(point => point.group)).map(group => paretoPointTrace(points, group, points.find(point => point.group === group)?.color || '#7b8794', frontSet));
  const layout = plotLayout('AlphaFlow Pareto: pLDDT vs seconds/output', 'seconds / output', 'pLDDT');
  layout.xaxis = { ...layout.xaxis, type: 'log' };
  Plotly.newPlot(divId, traces, layout, { responsive: true, displaylogo: false });
}

function renderDeltas() {
  if (!$('deltaWinMap')) return;
  const rows = filteredDeltaRows();
  renderDeltaClaimCards();
  renderDeltaSummaryCards(rows);
  renderDeltaCriteria(rows);
  renderDeltaWinMap(rows);
  renderDeltaLollipop(rows);
  renderDeltaEdmPareto(rows);
  renderDeltaAlphaPareto(rows);
}

function renderDelta(domain) {
  const isEdm = domain === 'edm';
  const rows = isEdm ? D.paired_deltas.edm.filter(r => r.mode === $('edmMode').value && r.metric === metricKey($('edmMetric').value))
                     : D.paired_deltas.alphaflow.filter(r => r.schedule_family === $('alphaFamily').value && r.dataset_group === $('alphaDataset').value && r.size_group === $('alphaSize').value && r.metric === metricKey($('alphaMetric').value));
  const divId = isEdm ? 'edmDeltaPlot' : 'alphaDeltaPlot';
  const tableId = isEdm ? 'edmDeltaTable' : 'alphaDeltaTable';
  if (!rows.length) {
    const message = isEdm
      ? 'No EDM paired-delta rows match this filter.'
      : 'AlphaFlow paired deltas versus Linear · standard are available only inside the standard family. Use the unified AlphaFlow comparison in Scorecards for Entropic · cond-marg versus standard scheduler variants.';
    showPlotNotice(divId, message);
    $(tableId).innerHTML = `<p class="notice">${htmlEscape(message)}</p>`;
    return;
  }
  const traces = schedulersFrom(rows).map(scheduler => {
    const pts = rows.filter(r => r.scheduler === scheduler).sort((a, b) => Number(a.n_steps) - Number(b.n_steps));
    const displayLabel = schedulerLabelForRows(rows, scheduler, domain);
    const displayColor = schedulerColorForRows(rows, scheduler, domain);
    return {
      x: pts.map(r => Number(r.n_steps)),
      y: pts.map(r => r.delta_good.mean),
      error_y: { type: 'data', array: pts.map(r => r.delta_good.ci || 0), visible: true },
      mode: 'lines+markers',
      name: displayLabel,
      line: { color: displayColor, width: 2.4 },
      marker: { size: 7 }
    };
  });
  Plotly.newPlot(divId, traces, plotLayout(`${isEdm ? 'EDM' : 'AlphaFlow'} paired delta vs linear`, 'NFE steps', 'positive = better than linear'), { responsive: true, displaylogo: false });
  let html = '<table><thead><tr><th>Scheduler</th><th>NFE</th><th>Delta</th><th>Win %</th><th>n</th></tr></thead><tbody>';
  rows.sort((a, b) => schedulerRank(a.scheduler) - schedulerRank(b.scheduler) || Number(a.n_steps) - Number(b.n_steps)).forEach(r => {
    const displayLabel = domain === 'alphaflow' ? alphaVariantLabelFromRecord(r) : schedulerLabel(r.scheduler);
    const compactLabel = domain === 'alphaflow' ? shortAlphaVariantLabel(alphaVariantKeyFromRecord(r)) : shortSchedulerLabel(r.scheduler);
    const displayColor = domain === 'alphaflow' ? alphaVariantColor(alphaVariantKeyFromRecord(r)) : schedulerColor(r.scheduler);
    html += `<tr><td title="${htmlEscape(displayLabel)}"><span class="scheduler-name"><span class="swatch" style="background:${htmlEscape(displayColor)}"></span>${htmlEscape(compactLabel)}</span></td><td>${r.n_steps}</td><td>${formatCell(r.delta_good, { fmt: '.3f' })}</td><td>${r.win_rate === null ? 'n/a' : (100 * r.win_rate).toFixed(1) + '%'}</td><td>${r.delta_good.n}</td></tr>`;
  });
  html += '</tbody></table>';
  $(tableId).innerHTML = html;
}

function matrixMetricConfig(dataset, metric) {
  return D.matrix.metrics[dataset.domain][metric] || metricConfig(dataset.domain, metric);
}

function visibleMatrixRecords() {
  const evidence = metricKey($('matrixEvidence').value);
  const nfe = Number($('matrixNfe').value);
  const family = $('matrixAlphaFamily').value;
  const mode = $('matrixEdmMode').value;
  return (D.matrix?.records || []).filter(r => {
    if (r.evidence_set !== evidence || Number(r.n_steps) !== nfe) return false;
    if (r.domain === 'edm') return r.edm_mode === mode;
    return r.alpha_family === family;
  });
}

function matrixBestMap(records) {
  const best = {};
  (D.matrix?.datasets || []).forEach(ds => {
    datasetTableMetrics(ds).forEach(metric => {
      const cfg = matrixMetricConfig(ds, metric);
      const candidates = records.filter(r => r.dataset_key === ds.key && r.metric_values?.[metric]?.mean !== null && r.metric_values?.[metric]?.mean !== undefined);
      if (!candidates.length) return;
      candidates.sort((a, b) => {
        const av = a.metric_values[metric].mean;
        const bv = b.metric_values[metric].mean;
        return cfg.direction === 'higher' ? bv - av : av - bv;
      });
      best[`${ds.key}:${metric}`] = candidates[0].scheduler;
    });
  });
  return best;
}

function matrixCell(stat, cfg, ds) {
  if (!stat || stat.mean === null || stat.mean === undefined) return '<span class="weak">n/a</span>';
  const support = ds?.domain === 'edm'
    ? `s=${formatInt(stat.n)} · img=${formatInt(Number(stat.n || 0) * EDM_SAMPLES_PER_SEED)}`
    : `n=${formatInt(stat.n)} prot.`;
  return `${formatValue(stat.mean, cfg.fmt)}<span class="ci">± ${formatValue(stat.ci || 0, cfg.fmt)}</span><span class="n">${support}</span>`;
}

function renderSchedulerMatrix() {
  const records = visibleMatrixRecords();
  const q = $('matrixSearch').value.trim().toLowerCase();
  const datasets = D.matrix?.datasets || [];
  const best = matrixBestMap(records);
  const alphaSpotlight = isAlphaSpotlightFamily($('matrixAlphaFamily').value);
  const schedulerSet = new Set(records.map(r => r.scheduler));
  let schedulers = Array.from(schedulerSet).sort((a, b) => schedulerRank(a) - schedulerRank(b));
  if (q) {
    schedulers = schedulers.filter(s => {
      const schedulerText = matrixSchedulerLabel(records, s).toLowerCase();
      const rowText = records.filter(r => r.scheduler === s).map(r => {
        const ds = datasets.find(d => d.key === r.dataset_key);
        return `${schedulerText} ${ds?.label || ''} ${Object.keys(r.metric_values || {}).join(' ')}`;
      }).join(' ').toLowerCase();
      return rowText.includes(q);
    });
  }

  const availableDatasets = datasets.filter(ds => records.some(r => r.dataset_key === ds.key));
  if (!records.length || !availableDatasets.length || !schedulers.length) {
    $('schedulerMatrix').innerHTML = '<p class="notice">No matrix rows match this evidence view. Try a different run, NFE, AlphaFlow family, or EDM sampler.</p>';
    renderMatrixStats(records, availableDatasets, schedulers);
    renderHighlightCards(records);
    renderRun41CompletionAudit();
    renderMatrixAnalysis();
    renderSchedulerBehavior();
    return;
  }

  let html = '<table><thead><tr><th rowspan="2">Scheduler</th>';
  availableDatasets.forEach(ds => {
    const metrics = datasetTableMetrics(ds);
    const partialLarge = isRun41PartialLargeStandard(ds, $('matrixAlphaFamily').value);
    const thClass = ds.domain === 'edm' ? 'spotlight-head-edm' : (partialLarge ? 'partial-head' : (alphaSpotlight ? 'spotlight-head-alpha' : ''));
    const badge = ds.domain === 'edm' ? '<span class="head-chip edm-chip">entropic-log1p</span>' : (partialLarge ? '<span class="head-chip partial-chip">partial std</span>' : (alphaSpotlight ? '<span class="head-chip alpha-chip">cond-marg</span>' : ''));
    html += `<th class="${thClass}" colspan="${metrics.length}">${htmlEscape(ds.short_label)}${badge}</th>`;
  });
  html += '</tr><tr>';
  availableDatasets.forEach(ds => datasetTableMetrics(ds).forEach(metric => {
    const cfg = matrixMetricConfig(ds, metric);
    html += `<th title="${htmlEscape(cfg.label)}; ${htmlEscape(directionShort(cfg.direction))}">${htmlEscape(shortMetricLabel(ds.domain, metric))}</th>`;
  }));
  html += '</tr></thead><tbody>';
  schedulers.forEach(scheduler => {
    const fullLabel = matrixSchedulerLabel(records, scheduler);
    const alphaRow = records.find(r => r.domain === 'alphaflow' && r.scheduler === scheduler);
    const rowClass = [
      !alphaRow && isEdmSpotlightScheduler(scheduler) ? 'spotlight-row-edm' : '',
      alphaRow && alphaSpotlight && (scheduler === 'entropic' || isEdmSpotlightScheduler(scheduler)) ? 'spotlight-row-alpha' : ''
    ].filter(Boolean).join(' ');
    const compactLabel = alphaRow ? shortAlphaVariantLabel(alphaVariantKeyFromRecord(alphaRow)) : shortSchedulerLabel(scheduler);
    html += `<tr class="${rowClass}"><td title="${htmlEscape(fullLabel)}"><span class="scheduler-name"><span class="swatch" style="background:${matrixSchedulerColor(records, scheduler)}"></span>${htmlEscape(compactLabel)}</span>${schedulerBadges(scheduler, { domain: alphaRow ? 'alphaflow' : 'edm', includeAlpha: alphaSpotlight })}</td>`;
    availableDatasets.forEach(ds => {
      const rec = records.find(r => r.scheduler === scheduler && r.dataset_key === ds.key);
      datasetTableMetrics(ds).forEach(metric => {
        const cfg = matrixMetricConfig(ds, metric);
        const isBest = best[`${ds.key}:${metric}`] === scheduler;
        const cellClasses = [
          isBest ? 'best' : '',
          ds.domain === 'edm' && isEdmSpotlightScheduler(scheduler) ? 'spotlight-cell-edm' : '',
          ds.domain === 'alphaflow' && alphaSpotlight ? 'spotlight-cell-alpha' : '',
          isRun41PartialLargeStandard(ds, $('matrixAlphaFamily').value) ? 'partial-cell' : ''
        ].filter(Boolean).join(' ');
        const title = isRun41PartialLargeStandard(ds, $('matrixAlphaFamily').value) ? ` title="${htmlEscape(RUN41_STANDARD_TIMEOUT_NOTE)}"` : '';
        html += `<td class="${cellClasses}"${title}>${matrixCell(rec?.metric_values?.[metric], cfg, ds)}</td>`;
      });
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  $('schedulerMatrix').innerHTML = html;
  renderMatrixStats(records, availableDatasets, schedulers);
  renderHighlightCards(records);
  renderRun41CompletionAudit();
  renderMatrixAnalysis();
  renderSchedulerBehavior();
}

function renderMatrixStats(records, datasets, schedulers) {
  const evidenceLabel = $('matrixEvidence').options[$('matrixEvidence').selectedIndex]?.textContent || $('matrixEvidence').value;
  const alphaRows = records.filter(r => r.domain === 'alphaflow').reduce((sum, r) => sum + Object.values(r.metric_values || {}).reduce((n, stat) => Math.max(n, Number(stat.n || 0)), 0), 0);
  const edmRows = records.filter(r => r.domain === 'edm').reduce((sum, r) => sum + Object.values(r.metric_values || {}).reduce((n, stat) => Math.max(n, Number(stat.n || 0)), 0), 0);
  const visibleMetricCells = records.reduce((sum, record) => {
    const dataset = datasets.find(ds => ds.key === record.dataset_key);
    return sum + datasetTableMetrics(dataset).filter(metric => record.metric_values?.[metric]).length;
  }, 0);
  $('matrixStats').innerHTML = [
    ['Evidence view', evidenceLabel, `${$('matrixNfe').value} NFE`],
    ['Schedulers', schedulers.length, 'visible rows'],
    ['Dataset blocks', datasets.length, 'dataset/size column groups'],
    ['Metric cells', visibleMetricCells, `EDM n≈${formatInt(edmRows)} · AlphaFlow n≈${formatInt(alphaRows)}`],
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
}

function sortedMetricCandidates(records, ds, metric) {
  const cfg = matrixMetricConfig(ds, metric);
  return records
    .filter(r => r.dataset_key === ds.key && r.metric_values?.[metric]?.mean !== null && r.metric_values?.[metric]?.mean !== undefined)
    .sort((a, b) => {
      const av = a.metric_values[metric].mean;
      const bv = b.metric_values[metric].mean;
      return cfg.direction === 'higher' ? bv - av : av - bv;
    });
}

function metricWinner(records, ds, metric) {
  return sortedMetricCandidates(records, ds, metric)[0] || null;
}

function schedulerMetricRank(records, ds, metric, scheduler) {
  const sorted = sortedMetricCandidates(records, ds, metric);
  const index = sorted.findIndex(r => r.scheduler === scheduler);
  return index < 0 ? null : { rank: index + 1, total: sorted.length };
}

function rankText(rankInfo) {
  if (!rankInfo) return 'not measured';
  return `${rankInfo.rank}/${rankInfo.total}`;
}

function metricWinLabel(records, ds, metric) {
  const cfg = matrixMetricConfig(ds, metric);
  const winner = metricWinner(records, ds, metric);
  if (!winner) return null;
  const stat = winner.metric_values[metric];
  const label = ds.domain === 'alphaflow' ? alphaVariantLabelFromRecord(winner) : schedulerLabel(winner.scheduler);
  return `${cfg.label}: ${label} (${formatValue(stat.mean, cfg.fmt)} ± ${formatValue(stat.ci || 0, cfg.fmt)})`;
}

function renderHighlightCards(records) {
  const edmDs = (D.matrix?.datasets || []).find(ds => ds.key === 'edm');
  const alphaSpotlight = isAlphaSpotlightFamily($('matrixAlphaFamily').value);
  const evidenceLabel = $('matrixEvidence').options[$('matrixEvidence').selectedIndex]?.textContent || $('matrixEvidence').value;
  const nfe = $('matrixNfe').value;
  const edmSpotlight = edmDs ? records.find(r => r.dataset_key === edmDs.key && r.scheduler === EDM_SPOTLIGHT_SCHEDULER) : null;
  const edmFid = edmSpotlight?.metric_values?.fid_inception;
  const edmPixel = edmSpotlight?.metric_values?.fid_pixel;
  const alphaRecords = records.filter(r => r.domain === 'alphaflow');
  const alphaCells = alphaRecords.reduce((sum, record) => {
    const dataset = (D.matrix?.datasets || []).find(ds => ds.key === record.dataset_key);
    return sum + datasetTableMetrics(dataset).filter(metric => record.metric_values?.[metric]).length;
  }, 0);
  const best = matrixBestMap(records);
  const alphaWins = (D.matrix?.datasets || [])
    .filter(ds => ds.domain === 'alphaflow')
    .reduce((sum, ds) => sum + datasetTableMetrics(ds).filter(metric => best[`${ds.key}:${metric}`]).length, 0);
  const cards = [
    {
      cls: 'edm',
      label: 'EDM highlight',
      title: 'Entropic-log1p',
      text: edmFid
        ? `At ${nfe} NFE, entropic-log1p is the EDM spotlight: Inception FID ${formatValue(edmFid.mean, matrixMetricConfig(edmDs, 'fid_inception').fmt)} ± ${formatValue(edmFid.ci || 0, matrixMetricConfig(edmDs, 'fid_inception').fmt)} and pixel FID ${edmPixel ? `${formatValue(edmPixel.mean, matrixMetricConfig(edmDs, 'fid_pixel').fmt)} ± ${formatValue(edmPixel.ci || 0, matrixMetricConfig(edmDs, 'fid_pixel').fmt)}` : 'n/a'}. Runtime is removed from the main tables and audited in the dedicated timing-distribution figure.`
        : `Entropic-log1p is the EDM spotlight. No EDM cells are visible for ${evidenceLabel} at ${nfe} NFE with the current sampler filter.`
    },
    {
      cls: 'alpha',
      label: 'AlphaFlow highlight',
      title: 'cond-marg family',
      text: alphaSpotlight
        ? `The current AlphaFlow matrix is the cond-marg spotlight: ${formatInt(alphaCells)} non-runtime metric cells across CAMEO and ATLAS size bins. This view asks whether conditional-minus-marginal step allocation improves endpoint confidence, endpoint spread, and validity.`
        : `AlphaFlow cond-marg is the highlighted mechanism and the site default. The current selector is showing ${$('matrixAlphaFamily').value} as a comparator; switch back to condmarg for the primary AlphaFlow interpretation.`
    },
    {
      cls: 'bottom',
      label: 'Visible bottom line',
      title: `${nfe} NFE · ${evidenceLabel}`,
      text: alphaSpotlight
        ? `EDM: use entropic-log1p as the quality candidate, not the fastest-only claim. AlphaFlow: cond-marg does not collapse to one scalar winner; compare Entropic · cond-marg against Entropic-log1p · cond-marg to separate raw bridge concentration from damped bridge allocation.`
        : `This view is useful for comparison, but the requested headline remains EDM entropic-log1p plus AlphaFlow cond-marg. Treat non-cond-marg AlphaFlow rows as baselines for explaining the mechanism.`
    },
    {
      cls: 'ci',
      label: 'Reading the values',
      title: 'Mean ± 95% CI',
      text: `${alphaWins ? `${formatInt(alphaWins)} AlphaFlow metric winners are visible in the current family view. ` : ''}A yellow cell marks the best mean for that dataset and metric; confidence intervals determine whether the apparent gap is practically persuasive.`
    }
  ];
  $('highlightCards').innerHTML = cards.map(card => `
    <article class="spotlight-card ${htmlEscape(card.cls)}">
      <div class="label">${htmlEscape(card.label)}</div>
      <h3>${htmlEscape(card.title)}</h3>
      <p>${htmlEscape(card.text)}</p>
    </article>`).join('');
}

function renderRun41CompletionAudit() {
  if (!currentMatrixUsesRun41Alpha()) {
    $('run41CompletionAudit').innerHTML = '';
    return;
  }
  const family = $('matrixAlphaFamily').value;
  const visible = RUN41_LARGE_AUDIT.filter(item => family === 'standard' ? item.key.endsWith('_standard') : item.key.endsWith('_condmarg'));
  const other = RUN41_LARGE_AUDIT.filter(item => !visible.includes(item));
  $('run41CompletionAudit').innerHTML = `
    <div class="completion-head">
      <strong>Run41 large-protein completion audit.</strong>
      <span>${family === 'standard' ? 'Standard large rows are partial checkpoint evidence.' : 'Cond-marg large rows completed; standard large comparator rows are partial if selected.'}</span>
      <span>${htmlEscape(RUN41_STANDARD_TIMEOUT_NOTE)}</span>
    </div>
    ${visible.map(item => completionCardHtml(item)).join('')}
    <details class="completion-details">
      <summary>Show other run41 large-family job states</summary>
      <div class="completion-detail-grid">${other.map(item => completionCardHtml(item)).join('')}</div>
    </details>`;
}

function completionCardHtml(item) {
  const stateClass = item.state === 'COMPLETED' ? 'complete' : 'partial';
  return `<article class="completion-card ${stateClass}">
    <div class="label">${htmlEscape(item.state)} · job ${htmlEscape(item.job)}</div>
    <h4>${htmlEscape(item.label)}</h4>
    <p><strong>${htmlEscape(item.rows)}</strong> · ${htmlEscape(item.cellN)}</p>
    <p>${htmlEscape(item.note)}</p>
  </article>`;
}

function bestMetricSentence(records, ds, metric) {
  const cfg = matrixMetricConfig(ds, metric);
  const winner = metricWinner(records, ds, metric);
  if (!winner) return null;
  const stat = winner.metric_values[metric];
  const label = ds.domain === 'alphaflow' ? alphaVariantLabelFromRecord(winner) : schedulerLabel(winner.scheduler);
  return `${cfg.label}: ${label} (${formatValue(stat.mean, cfg.fmt)} ± ${formatValue(stat.ci || 0, cfg.fmt)}, n=${formatInt(stat.n)})`;
}

function matrixSchedulerLabel(records, scheduler) {
  const alphaRow = records.find(r => r.domain === 'alphaflow' && r.scheduler === scheduler);
  return alphaRow ? alphaVariantLabelFromRecord(alphaRow) : schedulerLabel(scheduler);
}

function matrixSchedulerColor(records, scheduler) {
  const alphaRow = records.find(r => r.domain === 'alphaflow' && r.scheduler === scheduler);
  return alphaRow ? alphaVariantColor(alphaVariantKeyFromRecord(alphaRow)) : schedulerColor(scheduler);
}

function sizeNarrative(ds, records) {
  if (ds.domain === 'edm') {
    return 'EDM is a single image-generation benchmark here, so interpret the row as quality at fixed NFE rather than as a size stratum; runtime is audited separately.';
  }
  const plddtWinner = metricWinner(records, ds, 'plddt_mean');
  const n = plddtWinner?.metric_values?.plddt_mean?.n;
  if (ds.key.endsWith('_small')) return `Small proteins are cheap enough that timing gaps are a cost audit, not the main interpretation; the main risk is uncertainty from fewer targets${n ? ` (n=${formatInt(n)})` : ''}.`;
  if (ds.key.endsWith('_medium')) return `Medium proteins carry most of the endpoint evidence${n ? ` (n=${formatInt(n)})` : ''}, so reversals here are more representative than small-bin outliers.`;
  if (ds.key.endsWith('_large')) return `Large proteins stress the integration path; endpoint spread and validity become more visible, so confidence gains must be checked against pairwise spread and invalid outputs${n ? ` (n=${formatInt(n)})` : ''}.`;
  return `The overall block pools sizes${n ? ` (n=${formatInt(n)})` : ''}; use it for a headline only after checking the small, medium, and large strata.`;
}

function metricWhy(ds, metric, winnerScheduler) {
  if (ds.domain === 'edm') {
    if (metric === 'infer_seconds') {
      return winnerScheduler === 'linear'
        ? 'Linear often wins seconds because it is the least shaped schedule; at equal NFE, runtime differences should be treated as guardrails unless quality also holds.'
        : 'Runtime differences at fixed NFE are smaller than quality differences, so this metric mainly checks that a quality gain is not paid for with excessive latency.';
    }
    if (winnerScheduler === EDM_SPOTLIGHT_SCHEDULER) {
      return 'This supports the EDM highlight: log1p compression keeps the entropic allocation from over-spiking and puts more useful work into denoising regions that move FID.';
    }
    return 'A fixed schedule winning here means the hand-shaped allocation matched this noise band better than the entropic weighting for this metric and NFE.';
  }
  if (metric === 'plddt_mean') {
    return winnerScheduler === EDM_SPOTLIGHT_SCHEDULER
      ? 'Log1p cond-marg softens the bridge weighting, which tends to preserve confidence while still using conditional-minus-marginal structure.'
      : 'The winner is keeping the denoising path stable enough for high-confidence endpoints; compare with endpoint spread before treating confidence as a complete endpoint-quality story.';
  }
  if (metric === 'diversity') {
    return winnerScheduler === EDM_SPOTLIGHT_SCHEDULER
      ? 'The log1p form dampens the cond-marg bridge-rate signal before the grid is built, so it is the regularized cond-marg comparison rather than a different sampler.'
      : 'Diversity rewards maintaining multiple plausible conformations; aggressive concentration can improve confidence or validity while reducing spread.';
  }
  if (metric === 'rmsd_mean') {
    return winnerScheduler === 'entropic'
      ? 'Plain cond-marg entropic allocation is sharper; here the pairwise endpoint RMSD reports how much conformational spread remains.'
      : 'This is pairwise endpoint spread, not native-reference accuracy. Read larger values as more generated-ensemble diversity when confidence and validity are acceptable.';
  }
  if (metric === 'invalid_rate') {
    return 'Invalid rate is mostly a validity gate: when every method is at or near zero, it should not overrule pLDDT, diversity, or endpoint spread.';
  }
  if (metric === 'infer_seconds_per_output') {
    return 'Runtime scales strongly with protein size; at fixed NFE, use seconds/output to catch expensive paths rather than to define the scientific winner by itself.';
  }
  return 'Interpret this metric alongside the companion quality and efficiency metrics; AlphaFlow scheduler effects are metric-specific.';
}

function datasetBottomLine(records, ds) {
  if (ds.domain === 'edm') {
    const fidWinner = metricWinner(records, ds, 'fid_inception');
    const pixelWinner = metricWinner(records, ds, 'fid_pixel');
    if (fidWinner?.scheduler === EDM_SPOTLIGHT_SCHEDULER && pixelWinner?.scheduler === EDM_SPOTLIGHT_SCHEDULER) {
      return 'Bottom line: entropic-log1p is the EDM quality pick in this view; seconds are tracked only in the timing-distribution audit.';
    }
    return 'Bottom line: EDM is mixed in this view; prioritize the FID metrics and use the dedicated timing figure only as a practical cost check.';
  }
  const plddtWinner = metricWinner(records, ds, 'plddt_mean');
  const diversityWinner = metricWinner(records, ds, 'diversity');
  const rmsdWinner = metricWinner(records, ds, 'rmsd_mean');
  const alphaSpotlight = isAlphaSpotlightFamily($('matrixAlphaFamily').value);
  if (alphaSpotlight) {
    return `Bottom line: cond-marg splits cleanly here: ${plddtWinner ? alphaVariantLabelFromRecord(plddtWinner) : 'one variant'} leads pLDDT, ${diversityWinner ? alphaVariantLabelFromRecord(diversityWinner) : 'one variant'} leads diversity, and ${rmsdWinner ? alphaVariantLabelFromRecord(rmsdWinner) : 'one variant'} leads endpoint spread. Choose the variant by endpoint objective, not by a single pooled score.`;
  }
  return 'Bottom line: this is a standard-family comparator. Use it to explain what cond-marg changes, but keep the primary AlphaFlow story anchored on the cond-marg family.';
}

function datasetAnalysisCard(records, ds) {
  const lines = datasetTableMetrics(ds).map(metric => {
    const cfg = matrixMetricConfig(ds, metric);
    const winner = metricWinner(records, ds, metric);
    if (!winner) return null;
    const stat = winner.metric_values[metric];
    const label = ds.domain === 'alphaflow' ? alphaVariantLabelFromRecord(winner) : schedulerLabel(winner.scheduler);
    return `<li><strong>${htmlEscape(cfg.label)}:</strong> ${htmlEscape(label)} wins at ${htmlEscape(formatValue(stat.mean, cfg.fmt))} ± ${htmlEscape(formatValue(stat.ci || 0, cfg.fmt))}, n=${htmlEscape(formatInt(stat.n))}. ${htmlEscape(metricWhy(ds, metric, winner.scheduler))}</li>`;
  }).filter(Boolean).join('');
  const headlineMetric = ds.domain === 'edm' ? 'fid_inception' : 'plddt_mean';
  const headline = bestMetricSentence(records, ds, headlineMetric);
  const spotlightText = ds.domain === 'edm'
    ? `The EDM spotlight row is ${schedulerLabel(EDM_SPOTLIGHT_SCHEDULER)}; runtime ranking is intentionally moved out of this table.`
    : `The AlphaFlow spotlight is ${ALPHA_SPOTLIGHT_LABEL}; this block explains how that family behaves for ${ds.short_label}.`;
  return `<article class="analysis-card dataset-card ${ds.domain === 'edm' ? 'edm-focus' : 'alpha-focus'}">
    <div class="card-kicker">${htmlEscape(ds.domain === 'edm' ? 'EDM' : ALPHA_SPOTLIGHT_LABEL)}</div>
    <h4>${htmlEscape(ds.label)}</h4>
    <p><strong>Analysis.</strong> ${htmlEscape(sizeNarrative(ds, records))} ${htmlEscape(headline || 'No leading metric is available.')} ${htmlEscape(spotlightText)}</p>
    <ul>${lines}</ul>
    <p class="bottom-line"><strong>${htmlEscape(datasetBottomLine(records, ds))}</strong></p>
  </article>`;
}

function schedulerWhyText(scheduler) {
  const text = {
    linear: 'Linear is the neutral allocation baseline. It can look strong on stable metrics because it avoids aggressive reweighting, but it often loses quality when difficult regions need more integration budget.',
    cosine: 'Cosine is a smooth fixed nonlinear schedule. It can help when the true difficulty curve is also smooth, but it has no data-dependent correction when CAMEO, ATLAS, or EDM need a different concentration of steps.',
    sigmoid: 'Sigmoid concentrates work around the middle of the path. That can stabilize some transitions, but it may under-serve endpoint or high-noise regions depending on the metric.',
    log: 'Log gives a hand-shaped compression of early or late path regions. It is useful as a simple nonlinear comparator, but it is not tied to conditional-minus-marginal or entropy evidence.',
    power_2: 'Power-2 is a stronger fixed skew than cosine or sigmoid. It can help when late-path refinement dominates, but it can be too blunt for confidence, diversity, or endpoint-spread tradeoffs.',
    power_3: 'Power-3 is the most aggressive fixed skew in the visible scheduler set. It is a stress test for step concentration and usually needs a very aligned metric to win.',
    entropic: 'Plain entropic follows the entropy-derived allocation directly. In EDM this is the empirical-Hutchinson entropy-rate scheduler; in AlphaFlow standard it is the entropy-only baseline. The AlphaFlow cond-marg version is shown as a separate main protein card.',
    entropic_log1p: 'Entropic-log1p is the damped entropy variant. In EDM it is the quality spotlight; in AlphaFlow it should be read with its family label, either Entropic-log1p · cond-marg or Entropic-log1p · standard.',
    entropic_reverse: 'Entropic-reverse is a directionality control. If it loses, the evidence says the sign/order of allocation matters rather than entropy alone.',
    entropic_log1p_reverse: 'Entropic-log1p-reverse is the damped directionality control. It is useful for falsifying whether the benefit comes from log compression alone or from putting steps in the correct order.'
  };
  return text[scheduler] || 'This scheduler is interpreted by where it wins or loses across metrics; inspect its row against the highlighted entropic and cond-marg mechanisms.';
}

function schedulerBottomLine(scheduler, wins, totalCells, domain = 'edm') {
  if (domain === 'edm' && isEdmSpotlightScheduler(scheduler)) {
    return `Bottom line: keep ${schedulerLabel(scheduler)} as the EDM quality headline, and read AlphaFlow log1p through its explicit family label when it appears.`;
  }
  if (domain === 'alphaflow' && isEdmSpotlightScheduler(scheduler)) {
    return 'Bottom line: this is an AlphaFlow log1p-family row; do not read the EDM spotlight label into the protein result.';
  }
  if (scheduler === 'entropic') {
    return 'Bottom line: use plain entropic for the main AlphaFlow cond-marg claim, then verify it does not trade away confidence, endpoint spread, or validity.';
  }
  if (!wins.length) {
    return `Bottom line: in this visible ${formatInt(totalCells)}-cell matrix it is mainly a comparator, not a headline scheduler.`;
  }
  return `Bottom line: it wins ${formatInt(wins.length)} of ${formatInt(totalCells)} visible metric cells, so any claim should stay tied to those specific datasets and metrics.`;
}

function renderSchedulerBehavior() {
  const records = visibleMatrixRecords();
  const datasets = (D.matrix?.datasets || []).filter(ds => records.some(r => r.dataset_key === ds.key));
  const schedulers = schedulersFrom(records);
  if (!records.length || !datasets.length || !schedulers.length) {
    $('schedulerBehavior').innerHTML = '<p class="notice">No scheduler behavior analysis is available for this view.</p>';
    return;
  }
  const best = matrixBestMap(records);
  const totalCells = datasets.reduce((sum, ds) => sum + datasetTableMetrics(ds).length, 0);
  $('schedulerBehavior').innerHTML = schedulers.map(scheduler => {
    const alphaRow = records.find(r => r.domain === 'alphaflow' && r.scheduler === scheduler);
    const wins = [];
    datasets.forEach(ds => datasetTableMetrics(ds).forEach(metric => {
      if (best[`${ds.key}:${metric}`] === scheduler) {
        wins.push(`${ds.short_label} ${matrixMetricConfig(ds, metric).label}`);
      }
    }));
    const edmWins = wins.filter(w => w.startsWith('EDM')).length;
    const alphaWins = wins.length - edmWins;
    const winList = wins.length
      ? `<ul>${wins.slice(0, 8).map(w => `<li>${htmlEscape(w)}</li>`).join('')}${wins.length > 8 ? `<li>${formatInt(wins.length - 8)} more metric cells</li>` : ''}</ul>`
      : '<p class="weak">No best-mean cells in the current matrix.</p>';
    const cls = [
      !alphaRow && isEdmSpotlightScheduler(scheduler) ? 'edm-focus' : '',
      alphaRow && (scheduler === 'entropic' || isEdmSpotlightScheduler(scheduler)) ? 'alpha-focus' : ''
    ].filter(Boolean).join(' ');
    return `<article class="analysis-card scheduler-card ${cls}">
      <h4><span class="scheduler-name"><span class="swatch" style="background:${matrixSchedulerColor(records, scheduler)}"></span>${htmlEscape(matrixSchedulerLabel(records, scheduler))}</span>${schedulerBadges(scheduler, { domain: alphaRow ? 'alphaflow' : 'edm', includeAlpha: isAlphaSpotlightFamily($('matrixAlphaFamily').value) })}</h4>
      <p><strong>Performance.</strong> ${formatInt(wins.length)} / ${formatInt(totalCells)} visible metric cells are best means (${formatInt(edmWins)} EDM, ${formatInt(alphaWins)} AlphaFlow).</p>
      <p><strong>Why it behaves this way.</strong> ${htmlEscape(schedulerWhyText(scheduler))}</p>
      ${winList}
      <p class="bottom-line"><strong>${htmlEscape(schedulerBottomLine(scheduler, wins, totalCells, alphaRow ? 'alphaflow' : 'edm'))}</strong></p>
    </article>`;
  }).join('');
}

function renderMatrixAnalysis() {
  const records = visibleMatrixRecords();
  const datasets = (D.matrix?.datasets || []).filter(ds => records.some(r => r.dataset_key === ds.key));
  if (!datasets.length) {
    $('matrixAnalysis').innerHTML = '<p class="notice">No dataset conclusions are available for this view.</p>';
    $('matrixPrinciples').innerHTML = '';
    return;
  }
  $('matrixAnalysis').innerHTML = datasets.map(ds => datasetAnalysisCard(records, ds)).join('');
  $('matrixPrinciples').innerHTML = (D.matrix?.analysis_principles || []).map(text => `<p>${htmlEscape(text)}</p>`).join('');
}

function renderOpeningMatrix() {
  renderSchedulerMatrix();
}

function run40FigureMatches(fig, kind, query) {
  const kindOk = kind === 'All' || fig.plot_type === kind;
  const text = `${fig.title} ${fig.source} ${fig.plot_type} ${(fig.tags || []).join(' ')} ${fig.analysis || ''} ${fig.conclusion || ''}`.toLowerCase();
  return kindOk && (!query || text.includes(query));
}

function isSupplementalEdmCondMargFigure(fig) {
  const text = `${fig.title || ''} ${fig.src || ''} ${fig.source || ''}`.toLowerCase();
  return text.includes('cond_marg') || text.includes('cond marg') || text.includes('cond-marg');
}

function run40AtlasDisplayFigure(fig) {
  if (!isSupplementalEdmCondMargFigure(fig)) return fig;
  return {
    ...fig,
    tags: unique([...(fig.tags || []), 'Supplemental EDM ablation']),
    analysis: 'Supplemental Run40 EDM conditional-minus-marginal ablation diagnostic. It is shown as historical visual context only; these rows are excluded from the main EDM summaries, tables, and charts.',
    conclusion: 'Do not use this panel as main EDM evidence. Main EDM evidence uses the standard/log1p run40 rows after excluding conditional-minus-marginal EDM ablations.',
  };
}

function renderRun40EdmAtlas() {
  const kind = $('run40FigureKind').value;
  const query = $('run40FigureSearch').value.trim().toLowerCase();
  const allFigures = D.figure_atlas?.run40_edm_figures || [];
  const figures = allFigures.filter(f => run40FigureMatches(f, kind, query));
  const pdfCount = figures.filter(f => f.pdf_src).length;
  $('run40FigureStats').innerHTML = [
    ['Visible figures', figures.length, `${allFigures.length} Run40 EDM source figures indexed`],
    ['PDF companions', pdfCount, 'linked beside matching PNG/SVG figures'],
    ['Plot types', unique(allFigures.map(f => f.plot_type)).length, 'trajectory, heatmap, entropy, runtime, comparison'],
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
  if (!figures.length) {
    $('run40EdmGallery').innerHTML = '<p class="notice">No Run40 EDM source figures match this filter.</p>';
    return;
  }
  const cardHtml = f => {
    const display = run40AtlasDisplayFigure(f);
    return `
    <article class="image-card">
      ${visualImageHtml(f.src, display.title, display)}
      <div class="caption">
        <h4>${htmlEscape(display.title)}</h4>
        ${artifactRefHtml(f.src, display)}
        <p class="source">${htmlEscape(f.source)}</p>
        <div class="tags">${(display.tags || []).map(t => `<span class="tag">${htmlEscape(t)}</span>`).join('')}${f.pdf_src ? `<a class="tag link-tag" href="${htmlEscape(f.pdf_src)}">PDF</a>` : ''}</div>
        ${figureAnalysisHtml(display)}
      </div>
    </article>`;
  };
  $('run40EdmGallery').innerHTML = renderVisualCardGroups(figures, cardHtml, f => f.src, {
    gridClass: 'gallery figure-atlas legacy-visual-grid',
    noun: 'Run40 EDM figures'
  });
}

function renderEdmAnimations() {
  const statsEl = $('edmAnimationStats');
  const galleryEl = $('edmAnimationGallery');
  if (!statsEl || !galleryEl) return;
  const allFigures = D.figure_atlas?.run40_edm_figures || [];
  const figures = allFigures.filter(f => String(f.plot_type || '').toLowerCase().includes('trajectory'));
  statsEl.innerHTML = [
    ['Trajectory panels', figures.length, 'Run40 EDM trajectory/sample grids'],
    ['GIF animations', 0, 'no EDM GIF files are present in the copied evidence'],
    ['Source figures', allFigures.length, 'full Run40 EDM atlas count'],
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
  if (!figures.length) {
    galleryEl.innerHTML = '<p class="notice">No EDM trajectory/sample panels were found in the current copied evidence.</p>';
    return;
  }
  const cardHtml = f => {
    const display = run40AtlasDisplayFigure(f);
    return `
    <article class="image-card">
      ${visualImageHtml(f.src, display.title, display)}
      <div class="caption">
        <h4>${htmlEscape(display.title)}</h4>
        ${artifactRefHtml(f.src, display)}
        <p class="source">${htmlEscape(f.source)}</p>
        <div class="tags">${unique([...(display.tags || []), 'EDM animation panel']).map(t => `<span class="tag">${htmlEscape(t)}</span>`).join('')}</div>
        ${figureAnalysisHtml(display)}
      </div>
    </article>`;
  };
  galleryEl.innerHTML = renderVisualCardGroups(figures, cardHtml, f => f.src, {
    gridClass: 'gallery figure-atlas legacy-visual-grid',
    noun: 'EDM trajectory panels'
  });
}

function run41AlphaRecords() {
  const dataset = metricKey($('run41AlphaDataset').value);
  const family = $('run41AlphaFamily').value;
  return (D.matrix?.records || []).filter(r => r.evidence_set === 'run41_rebuttal' && r.domain === 'alphaflow' && r.dataset_key === dataset && r.alpha_family === family);
}

function renderRun41AlphaPlots() {
  const records = run41AlphaRecords();
  const metric = metricKey($('run41AlphaMetric').value);
  const nfe = Number($('run41AlphaNfe').value);
  const cfg = (D.matrix?.metrics?.alphaflow || D.metrics.alphaflow)[metric] || metricConfig('alphaflow', metric);
  const datasetLabel = $('run41AlphaDataset').options[$('run41AlphaDataset').selectedIndex]?.textContent || $('run41AlphaDataset').value;
  const datasetKey = metricKey($('run41AlphaDataset').value);
  const dataset = (D.matrix?.datasets || []).find(ds => ds.key === datasetKey) || { key: datasetKey, domain: 'alphaflow', short_label: datasetLabel, label: datasetLabel, metrics: [metric] };
  const condmargSpotlight = isAlphaSpotlightFamily($('run41AlphaFamily').value);
  const selectedFamily = $('run41AlphaFamily').value;
  const selectedFamilyLabel = scheduler => alphaVariantLabel(alphaVariantKeyFromParts(selectedFamily, scheduler));
  const familyTitle = condmargSpotlight ? `${ALPHA_SPOTLIGHT_LABEL} spotlight` : `${$('run41AlphaFamily').value} comparator`;
  const sourceNote = D.figure_atlas?.run41_alphaflow?.source_note || 'Run41 AlphaFlow plots are rendered from static metrics.';
  $('run41SourceNote').innerHTML = `<strong>Source note.</strong> ${htmlEscape(sourceNote)} <span class="inline-spotlight">AlphaFlow highlight: ${htmlEscape(ALPHA_SPOTLIGHT_LABEL)}</span>`;
  if (!records.length) {
    $('run41PlotAnalysis').innerHTML = '<p class="notice">No Run41 AlphaFlow records are available for this plot selection.</p>';
    Plotly.purge('run41AlphaLinePlot');
    Plotly.purge('run41AlphaHeatmapPlot');
    Plotly.purge('run41AlphaWinnerPlot');
    return;
  }

  const steps = stepsFrom(records);
  const schedulers = schedulersFrom(records);
  const lineTraces = schedulers.map(scheduler => {
    const pts = steps.map(step => records.find(r => r.scheduler === scheduler && Number(r.n_steps) === Number(step))).filter(Boolean);
    const colorKey = `${$('run41AlphaFamily').value}__${scheduler}`;
    return {
      x: pts.map(r => Number(r.n_steps)),
      y: pts.map(r => r.metric_values?.[metric]?.mean ?? null),
      error_y: { type: 'data', array: pts.map(r => r.metric_values?.[metric]?.ci || 0), visible: true, thickness: 1 },
      mode: 'lines+markers',
      name: selectedFamilyLabel(scheduler),
      line: { color: alphaVariantColor(colorKey), width: condmargSpotlight ? 4 : (isEntropicScheduler(scheduler) ? 3 : 2) },
      marker: { size: condmargSpotlight ? 10 : (isEntropicScheduler(scheduler) ? 9 : 7), line: condmargSpotlight ? { color: '#101828', width: 1.5 } : undefined }
    };
  });
  Plotly.newPlot('run41AlphaLinePlot', lineTraces, plotLayout(`Run41 AlphaFlow ${datasetLabel}: ${cfg.label} · ${familyTitle}`, 'NFE steps', cfg.label), { responsive: true, displaylogo: false });

  const z = schedulers.map(s => steps.map(step => {
    const row = records.find(r => r.scheduler === s && Number(r.n_steps) === Number(step));
    return row?.metric_values?.[metric]?.mean ?? null;
  }));
  const text = z.map(row => row.map(v => v === null ? '' : formatValue(v, cfg.fmt)));
  const heatmapY = schedulers.map(selectedFamilyLabel);
  const heatmapBase = {
    type: 'heatmap',
    x: steps,
    y: heatmapY,
    z,
    text,
    texttemplate: '%{text}',
    colorscale: HEATMAP_VALUE_SCALE,
    colorbar: { title: cfg.label }
  };
  Plotly.newPlot(
    'run41AlphaHeatmapPlot',
    [heatmapBase, bestHeatmapOverlayTrace(z, steps, heatmapY, cfg.direction, text)].filter(Boolean),
    plotLayout(`Run41 heatmap: ${datasetLabel} · ${familyTitle}`, 'NFE steps', 'scheduler variant'),
    { responsive: true, displaylogo: false }
  );

  const nfeRows = records.filter(r => Number(r.n_steps) === nfe && r.metric_values?.[metric]);
  const ranked = [...nfeRows].sort((a, b) => {
    const av = a.metric_values[metric].mean;
    const bv = b.metric_values[metric].mean;
    return cfg.direction === 'higher' ? bv - av : av - bv;
  });
  Plotly.newPlot('run41AlphaWinnerPlot', [{
    type: 'bar',
    x: ranked.map(r => selectedFamilyLabel(r.scheduler)),
    y: ranked.map(r => r.metric_values[metric].mean),
    error_y: { type: 'data', array: ranked.map(r => r.metric_values[metric].ci || 0), visible: true },
    marker: {
      color: ranked.map((r, index) => index === 0 ? BEST_HIGHLIGHT_COLOR : '#cbd5e1'),
      line: {
        color: ranked.map((r, index) => index === 0 ? '#3d2b00' : '#94a3b8'),
        width: ranked.map((r, index) => index === 0 ? 1.8 : 0.8)
      }
    }
  }], plotLayout(`Run41 ${nfe} NFE ranking: ${cfg.label} · ${familyTitle}`, 'scheduler variant', cfg.label), { responsive: true, displaylogo: false });

  const bestByNfe = steps.map(step => {
    const rows = records.filter(r => Number(r.n_steps) === Number(step) && r.metric_values?.[metric]);
    if (!rows.length) return null;
    rows.sort((a, b) => {
      const av = a.metric_values[metric].mean;
      const bv = b.metric_values[metric].mean;
      return cfg.direction === 'higher' ? bv - av : av - bv;
    });
    const stat = rows[0].metric_values[metric];
    return `${step} NFE: ${selectedFamilyLabel(rows[0].scheduler)} (${formatValue(stat.mean, cfg.fmt)} ± ${formatValue(stat.ci || 0, cfg.fmt)}, n=${formatInt(stat.n)})`;
  }).filter(Boolean);
  const selectedBest = ranked[0];
  const selectedStat = selectedBest?.metric_values?.[metric];
  $('run41PlotAnalysis').innerHTML = `
    <article class="analysis-card alpha-focus">
      <h4>Metric analysis</h4>
      <p><strong>Analysis.</strong> For ${htmlEscape(datasetLabel)} / ${htmlEscape(familyTitle)}, ${htmlEscape(cfg.label)} is ${htmlEscape(cfg.direction)}-is-better. ${htmlEscape(metricWhy(dataset, metric, selectedBest?.scheduler || ''))} The line plot shows whether scheduler order is stable across NFE, while the heatmap exposes budget-specific reversals.</p>
      <ul>${bestByNfe.map(line => `<li>${htmlEscape(line)}</li>`).join('')}</ul>
    </article>
    <article class="analysis-card alpha-focus">
      <h4>Selected-NFE conclusion</h4>
      <p><strong>Conclusion.</strong> At ${nfe} NFE, ${selectedBest ? htmlEscape(selectedFamilyLabel(selectedBest.scheduler)) : 'n/a'} is the visible leader for ${htmlEscape(cfg.label)}${selectedStat ? ` (${htmlEscape(formatValue(selectedStat.mean, cfg.fmt))} ± ${htmlEscape(formatValue(selectedStat.ci || 0, cfg.fmt))})` : ''}. ${condmargSpotlight ? 'This is the requested cond-marg view; keep the conclusion metric-specific and compare pLDDT, diversity, endpoint spread, and validity before claiming a global AlphaFlow winner.' : `This is a comparator view; the AlphaFlow spotlight remains ${ALPHA_SPOTLIGHT_LABEL}.`}</p>
    </article>`;
}

function renderRun40Run41Figures() {
  renderRun40EdmAtlas();
  renderEdmAnimations();
  renderRun41AlphaPlots();
  renderRun41ProteinEvidence();
}

function renderOverview() {
  const s = D.metadata.source_status;
  const condmargRows = D.summary.alphaflow.filter(r => r.schedule_family === ALPHA_SPOTLIGHT_FAMILY);
  const cards = [
    ['EDM rows', s.edm_rows, D.metadata.edm_source],
    ['AlphaFlow rows', s.alphaflow_rows, 'run41 rank CSVs'],
    ['Key cond-marg figures', D.figures.key.length, 'promoted diagnostics'],
    ['EDM figures', D.figures.diagnostics.filter(f => f.tags.includes('EDM')).length, 'diagnostic images'],
    ['AlphaFlow cond-marg cells', condmargRows.length, 'spotlight summary groups'],
    ['Paper tables', (D.paper_tables || []).length, 'LaTeX fragments rendered'],
    ['Generated', D.metadata.generated_at.replace('T', ' '), 'local build time'],
  ];
  $('overviewCards').innerHTML = cards.map(([label, value, detail]) => `<div class="stat-card"><div class="label">${label}</div><div class="value">${value}</div><div class="detail">${detail}</div></div>`).join('');
  renderPaletteLegend();
}

function statText(value, ci, fmt) {
  if (value === null || value === undefined) return '<span class="weak">n/a</span>';
  const ciText = ci === null || ci === undefined ? '' : `<span class="ci">± ${formatValue(ci, fmt)}</span>`;
  return `${formatValue(value, fmt)}${ciText}`;
}

function evidenceDomainRows() {
  const domain = $('evidenceDomain').value;
  const q = $('leaderboardSearch').value.trim().toLowerCase();
  return (D.evidence?.leaderboard || []).filter(row => {
    if (isRuntimeMetric(row.metric)) return false;
    const domainOk = domain === 'All' || row.domain === domain;
    const text = JSON.stringify(row).toLowerCase();
    return domainOk && (!q || text.includes(q));
  });
}

function renderEvidenceCards() {
  const cards = D.evidence?.cards || [];
  $('evidenceCards').innerHTML = cards.map(card => `
    <article class="evidence-card">
      <div class="label">${htmlEscape(card.kicker)}</div>
      <div class="value">${htmlEscape(card.value)}</div>
      <h3>${htmlEscape(card.label)}</h3>
      <p>${htmlEscape(card.detail)}</p>
    </article>`).join('');
}

function renderEvidenceLeaderboard() {
  const rows = evidenceDomainRows();
  const entropicWins = rows.filter(r => r.winner_is_entropic).length;
  const ciWins = rows.filter(r => r.ci_separates_runner_up).length;
  const sourceRuns = unique(rows.map(r => r.source_run)).join(' · ') || 'n/a';
  $('evidenceLeaderboardStats').innerHTML = [
    ['Visible slices', rows.length, $('evidenceDomain').value],
    ['Entropic wins', entropicWins, 'winner starts with entropic'],
    ['CI-separated wins', ciWins, 'winner vs runner-up 95% CI'],
    ['Sources', sourceRuns, 'primary run provenance'],
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');

  if (!rows.length) {
    $('evidenceLeaderboard').innerHTML = '<p class="notice">No leaderboard rows match this filter.</p>';
    return;
  }
  const displayRows = rows.slice(0, 500);
  let html = '<table><thead><tr><th>Domain</th><th>Run</th><th>Context</th><th>Metric</th><th>Winner</th><th>Winner value</th><th>Runner-up</th><th>Advantage</th><th>CI sep?</th><th>n</th></tr></thead><tbody>';
  displayRows.forEach(row => {
    const winnerClass = row.winner_is_entropic ? 'winner-entropic' : '';
    html += `<tr>
      <td>${htmlEscape(row.domain)}</td>
      <td>${htmlEscape(row.source_run)}</td>
      <td>${htmlEscape(row.context)}</td>
      <td>${htmlEscape(row.metric_label)} <span class="weak">(${htmlEscape(row.direction)})</span></td>
      <td><span class="scheduler-name ${winnerClass}"><span class="swatch" style="background:${schedulerColor(row.winner)}"></span>${htmlEscape(row.winner_label)}</span></td>
      <td>${statText(row.winner_value, row.winner_ci, row.metric_fmt)}</td>
      <td>${row.runner_up ? htmlEscape(row.runner_up_label) : '<span class="weak">n/a</span>'}</td>
      <td>${row.advantage === null || row.advantage === undefined ? '<span class="weak">n/a</span>' : formatValue(row.advantage, row.metric_fmt)}</td>
      <td>${row.ci_separates_runner_up ? '<span class="yes">yes</span>' : '<span class="weak">no</span>'}</td>
      <td>${formatInt(row.winner_n)}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  $('evidenceLeaderboard').innerHTML = html;
}

function formatRawValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '<span class="weak">n/a</span>';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'number') return Number.isInteger(value) ? formatInt(value) : Number(value).toPrecision(6);
  return htmlEscape(value);
}

function updateEvidenceTableOptions() {
  const allTables = D.evidence?.tables || [];
  const group = $('evidenceTableGroup').value;
  const eligible = allTables.map((table, index) => ({ table, index })).filter(item => group === 'All' || item.table.group === group);
  const select = $('evidenceTableSelect');
  const current = select.value;
  select.innerHTML = '';
  if (!eligible.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No tables';
    select.appendChild(opt);
    return null;
  }
  eligible.forEach(({ table, index }) => {
    const opt = document.createElement('option');
    opt.value = String(index);
    opt.textContent = table.title;
    select.appendChild(opt);
  });
  if (eligible.some(item => String(item.index) === current)) {
    select.value = current;
  } else {
    select.value = String(eligible[0].index);
  }
  return allTables[Number(select.value)];
}

function renderEvidenceTables() {
  const table = updateEvidenceTableOptions();
  if (!table) {
    $('evidenceTableSummary').innerHTML = '';
    $('evidenceTable').innerHTML = '<p class="notice">No evidence tables are available for this group.</p>';
    return;
  }
  const q = $('evidenceTableSearch').value.trim().toLowerCase();
  const rows = (table.rows || []).filter(row => {
    if (isRuntimeMetric(row.metric)) return false;
    return !q || JSON.stringify(row).toLowerCase().includes(q);
  });
  const columns = table.columns && table.columns.length ? table.columns : (rows[0] ? Object.keys(rows[0]) : []);
  $('evidenceTableSummary').innerHTML = [
    ['Selected table', table.title, table.source],
    ['Run', table.run, table.group],
    ['Rows', `${formatInt(rows.length)} visible`, `${formatInt(table.row_count)} total in CSV`],
    ['Columns', columns.length, table.note],
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');

  if (!rows.length) {
    $('evidenceTable').innerHTML = '<p class="notice">No rows in the selected evidence table match this filter.</p>';
    return;
  }
  let html = '<table><thead><tr>' + columns.map(col => `<th>${htmlEscape(col)}</th>`).join('') + '</tr></thead><tbody>';
  rows.forEach(row => {
    html += '<tr>' + columns.map(col => `<td>${formatRawValue(row[col])}</td>`).join('') + '</tr>';
  });
  html += '</tbody></table>';
  $('evidenceTable').innerHTML = html;
}

function renderEvidence() {
  renderEvidenceCards();
  renderEvidenceLeaderboard();
  renderEvidenceTables();
}

function renderPaletteLegend() {
  const schedulerItems = schedulerOrder.filter(s => colors[s]).map(s => `<span class="palette-chip"><span class="swatch" style="background:${colors[s]}"></span>${schedulerLabel(s)}</span>`).join('');
  const entropicItems = Object.keys(EDM_SPLIT_VARIANTS).map(s => `<span class="palette-chip"><span class="swatch" style="background:${schedulerColor(s)}"></span>${schedulerLabel(s)}</span>`).join('');
  const alphaVariantItems = ALPHA_UNIFIED_VARIANT_ORDER.map(key => `<span class="palette-chip"><span class="swatch" style="background:${alphaVariantColor(key)}"></span>${alphaVariantLabel(key)}</span>`).join('');
  const solverItems = Object.keys(solverColors).map(s => `<span class="palette-chip"><span class="swatch" style="background:${solverColors[s]}"></span>${solverLabel(s)}</span>`).join('');
  $('paletteLegend').innerHTML = `
    <h3>Visual encoding</h3>
    <div class="palette-label">Base scheduler colors</div>
    <div class="palette-row">${schedulerItems}</div>
    <div class="palette-label">EDM split variants</div>
    <div class="palette-row">${entropicItems}</div>
    <div class="palette-label">AlphaFlow scheduler variants</div>
    <div class="palette-row">${alphaVariantItems}</div>
    <div class="palette-label">SDE vs ODE</div>
    <div class="palette-row">${solverItems}</div>
    <div class="palette-label">Heatmaps</div>
    <div class="palette-row"><span class="palette-chip">neutral value scale; yellow marks the best row in each column</span></div>`;
}

function renderKeyEvidence() {
  const figures = D.figures.key || [];
  if (!figures.length) {
    $('keyEvidence').innerHTML = '<p class="notice">No key cond-marginal figures were found in the current build.</p>';
    return;
  }
  const cardHtml = f => {
    const featured = f.priority === 'featured';
    return `<article class="key-card ${featured ? 'featured' : ''}">
      ${visualImageHtml(f.src, f.title, f)}
      <div class="caption">
        <h3>${htmlEscape(f.title)}</h3>
        ${artifactRefHtml(f.src, f)}
        <p>${htmlEscape(f.why)}</p>
        ${figureAnalysisHtml(f)}
        ${figureLinksHtml(f)}
        <p class="source">${htmlEscape(f.source)}</p>
      </div>
    </article>`;
  };
  $('keyEvidence').innerHTML = renderVisualCardGroups(figures, cardHtml, f => f.src, {
    gridClass: 'key-evidence-grid legacy-visual-grid',
    noun: 'key evidence figures'
  });
}

function figureLinksHtml(f) {
  const links = [
    ['HTML', f.html_src],
    ['PDF', f.pdf_src],
    ['2D PDF', f.pdf_2d_src],
    ['3D PDF', f.pdf_3d_src],
    ['2D PNG', f.png_2d_src],
    ['3D PNG', f.png_3d_src],
  ].filter(([, href]) => href);
  if (!links.length) return '';
  return `<div class="tags figure-links">${links.map(([label, href]) => `<a class="tag link-tag" href="${htmlEscape(href)}">${htmlEscape(label)}</a>`).join('')}</div>`;
}

function figureAnalysisHtml(f) {
  const focus = (f.dataset_focus || []).map(x => `<span class="tag">${htmlEscape(x)}</span>`).join('');
  const type = f.plot_type ? `<span class="tag">${htmlEscape(f.plot_type)}</span>` : '';
  const analysis = f.analysis ? `<p class="figure-analysis"><strong>Analysis.</strong> ${htmlEscape(f.analysis)}</p>` : '';
  const conclusion = f.conclusion ? `<p class="figure-conclusion"><strong>Conclusion.</strong> ${htmlEscape(f.conclusion)}</p>` : '';
  return `<div class="tags">${type}${focus}</div>${analysis}${conclusion}`;
}

function renderRun41ProteinEvidence() {
  const figures = D.figures?.protein_evidence || [];
  const diagnostics = D.figures?.protein_diagnostics || [];
  const s = D.metadata.source_status || {};
  const sizeLabel = value => {
    const text = String(value || '');
    if (text.includes('<=50') || text.toLowerCase().includes('short')) return 'Short';
    if (text.includes('51-400') || text.toLowerCase().includes('medium')) return 'Medium';
    if (text.includes('>400') || text.toLowerCase().includes('long')) return 'Large';
    return text || 'Unknown';
  };
  const sizeRank = value => ({ Short: 0, Medium: 1, Large: 2 }[sizeLabel(value)] ?? 9);
  const datasetRank = value => ({ ATLAS: 0, CAMEO: 1 }[(value || [])[0]] ?? 9);
  const coverage = unique(figures.map(f => `${(f.dataset_focus || [])[0] || 'run41'} ${sizeLabel(f.protein_size)}`)).join(' · ');
  $('run41ProteinEvidenceStats').innerHTML = [
    ['Construction GIFs', s.run41_protein_evidence_gifs || figures.length, 'animated run41 PDB-frame trajectories'],
    ['HTML viewers', s.run41_protein_evidence_html || unique(figures.map(f => f.html_src)).length, 'interactive 3Dmol grids'],
    ['PDF storyboards', s.run41_protein_evidence_pdfs || 0, '2D and 3D static companions'],
    ['Coverage', coverage || 'n/a', 'dataset-size representatives'],
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');

  if (!figures.length) {
    $('run41ProteinEvidenceGallery').innerHTML = '<p class="notice">No run41 protein-construction evidence was found in this build.</p>';
    $('run41ProteinEvidenceLinks').innerHTML = '';
    return;
  }

  const ordered = [...figures].sort((a, b) =>
    datasetRank(a.dataset_focus) - datasetRank(b.dataset_focus) ||
    sizeRank(a.protein_size) - sizeRank(b.protein_size) ||
    Number(a.n_steps || 0) - Number(b.n_steps || 0) ||
    String(a.sample_name).localeCompare(String(b.sample_name))
  );
  const cardHtml = f => `
    <article class="image-card protein-card">
      ${visualImageHtml(f.src, f.title, f)}
      <div class="caption">
        <h4>${htmlEscape(f.title)}</h4>
        ${artifactRefHtml(f.src, f)}
        <p>${htmlEscape(f.analysis || '')}</p>
        <div class="tags">${(f.tags || []).map(t => `<span class="tag">${htmlEscape(t)}</span>`).join('')}</div>
        ${figureLinksHtml(f)}
      </div>
    </article>`;
  $('run41ProteinEvidenceGallery').innerHTML = renderVisualCardGroups(ordered, cardHtml, f => f.src, {
    gridClass: 'gallery legacy-visual-grid',
    noun: 'run41 protein evidence figures'
  });

  const htmlLinks = new Map();
  ordered.forEach(f => {
    if (f.html_src) htmlLinks.set(f.html_src, { title: `${f.n_steps} step interactive 3D viewer`, detail: 'All selected run41 proteins for this NFE', href: f.html_src });
  });
  const diagnosticLinks = diagnostics
    .filter(f => f.pdf_src || f.src)
    .slice(0, 8)
    .map(f => ({ title: f.title, detail: 'Run41 cond-marg schedule diagnostic', href: f.pdf_src || f.src }));
  const links = [...htmlLinks.values(), ...diagnosticLinks];
  $('run41ProteinEvidenceLinks').innerHTML = links.map(link => `
    <a class="link-card" href="${htmlEscape(link.href)}">
      <span class="link-card-title">${htmlEscape(link.title)}</span>
      <span class="link-card-detail">${htmlEscape(link.detail)}</span>
    </a>`).join('');
}

function manifestStatusText(run) {
  const manifest = run.manifest || {};
  if (!manifest.available) return 'no manifest';
  const counts = Object.entries(manifest.status_counts || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
  return counts || `${manifest.experiment_count || 0} experiments`;
}

function renderRunEvidence() {
  const runs = D.runs?.ledger || [];
  $('runCards').innerHTML = runs.map(run => `
    <article class="run-card">
      <h3>${htmlEscape(run.label)}</h3>
      <p><strong>${htmlEscape(run.role)}</strong></p>
      <p>${htmlEscape(run.primary_use)}</p>
      <p class="weak">${htmlEscape(run.caveat)}</p>
      <div class="counts">
        <span class="count-chip">${formatInt(run.counts.rank_csv_rows)} rank rows</span>
        <span class="count-chip">${formatInt(run.counts.summary_csv_files)} summary CSVs</span>
        <span class="count-chip">${formatInt(run.counts.png_figures)} PNGs</span>
        ${run.counts.gif_figures ? `<span class="count-chip">${formatInt(run.counts.gif_figures)} GIFs</span>` : ''}
        ${run.counts.html_files ? `<span class="count-chip">${formatInt(run.counts.html_files)} HTML</span>` : ''}
      </div>
    </article>`).join('');

  let html = '<table><thead><tr><th>Run</th><th>Primary use</th><th>Rank CSV rows</th><th>Rank CSV files</th><th>Summary CSV files</th><th>Figures</th><th>Manifest status</th><th>Representative artifacts</th></tr></thead><tbody>';
  runs.forEach(run => {
    const artifactList = (run.representative_artifacts || []).slice(0, 8).map(a => `<li>${htmlEscape(a)}</li>`).join('');
    html += `<tr>
      <td><strong>${htmlEscape(run.label)}</strong><br><span class="weak">${htmlEscape(run.path)}</span></td>
      <td>${htmlEscape(run.primary_use)}<br><span class="weak">${htmlEscape(run.caveat)}</span></td>
      <td>${formatInt(run.counts.rank_csv_rows)}</td>
      <td>${formatInt(run.counts.rank_csv_files)}</td>
      <td>${formatInt(run.counts.summary_csv_files)}</td>
      <td>${formatInt(run.counts.png_figures)} PNG / ${formatInt(run.counts.gif_figures || 0)} GIF / ${formatInt(run.counts.pdf_figures)} PDF / ${formatInt(run.counts.html_files || 0)} HTML</td>
      <td>${htmlEscape(manifestStatusText(run))}</td>
      <td><ul class="artifact-list">${artifactList}</ul></td>
    </tr>`;
  });
  html += '</tbody></table>';
  $('runLedger').innerHTML = html;
  renderRunEvidenceGallery();
}

function renderRunEvidenceGallery() {
  const selected = metricKey($('runFigureRun').value);
  const q = $('runFigureSearch').value.trim().toLowerCase();
  const figures = (D.runs?.figures || []).filter(f => {
    const runOk = selected === 'All' || f.run === selected;
    const text = `${f.title} ${f.run_label} ${f.source} ${(f.tags || []).join(' ')} ${f.interpretation || ''}`.toLowerCase();
    return runOk && (!q || text.includes(q));
  });
  if (!figures.length) {
    $('runEvidenceGallery').innerHTML = '<p class="notice">No copied PNG figure evidence matches this filter. Runs without figure suites are represented by the ledger and manifest/CSV coverage above.</p>';
    return;
  }
  const cardHtml = f => {
    const interp = f.interpretation ? f.interpretation.replace(/\\textbf\{|\}/g, '').split('\n').filter(Boolean).slice(0, 2).join(' ') : f.source;
    return `<article class="image-card">${visualImageHtml(f.src, f.title, f)}<div class="caption"><h4>${htmlEscape(f.run_label)}: ${htmlEscape(f.title)}</h4>${artifactRefHtml(f.src, f)}<p>${htmlEscape(interp)}</p><div class="tags">${(f.tags || []).map(t => `<span class="tag">${htmlEscape(t)}</span>`).join('')}</div>${figureAnalysisHtml(f)}${figureLinksHtml(f)}</div></article>`;
  };
  $('runEvidenceGallery').innerHTML = renderVisualCardGroups(figures, cardHtml, f => f.src, {
    gridClass: 'gallery run-evidence-legacy-grid legacy-visual-grid',
    noun: 'run evidence figures'
  });
}

function renderEdm() {
  const rows = filteredEdmSummary();
  const metric = metricKey($('edmMetric').value);
  renderBestCards('edmBestCards', rows, metric, 'edm');
  renderScorecard('edmScorecard', rows, HERO_EDM_METRICS, 'edm');
  linePlot('edmLinePlot', rows, metric, 'edm', `EDM ${metricConfig('edm', metric).label} by NFE · entropic-log1p spotlight`);
  heatmapPlot('edmHeatmap', rows, metric, 'edm', `EDM heatmap: ${metricConfig('edm', metric).label} · entropic-log1p spotlight`);
  renderDelta('edm');
}

function renderAlpha() {
  const rows = filteredAlphaSummary();
  const metric = metricKey($('alphaMetric').value);
  const familyTitle = isAlphaSpotlightFamily($('alphaFamily').value) ? `${ALPHA_SPOTLIGHT_LABEL} spotlight` : `${$('alphaFamily').value} comparator`;
  renderBestCards('alphaBestCards', rows, metric, 'alphaflow');
  renderScorecard('alphaScorecard', rows, HERO_ALPHA_METRICS, 'alphaflow');
  linePlot('alphaLinePlot', rows, metric, 'alphaflow', `AlphaFlow ${metricConfig('alphaflow', metric).label} by NFE · ${familyTitle}`);
  heatmapPlot('alphaHeatmap', rows, metric, 'alphaflow', `AlphaFlow heatmap: ${metricConfig('alphaflow', metric).label} · ${familyTitle}`);
  renderDelta('alphaflow');
}

function renderAlphaUnified() {
  const rows = alphaUnifiedRows();
  const metric = metricKey($('alphaUnifiedMetric').value);
  renderAlphaUnifiedSummary(rows, metric);
  renderAlphaUnifiedAnalysis(rows, metric);
  renderAlphaUnifiedScorecard(rows);
  alphaUnifiedLinePlot('alphaUnifiedLinePlot', rows, metric);
  alphaUnifiedHeatmapPlot('alphaUnifiedHeatmap', rows, metric);
}

function renderEdmExamples() {
  const items = D.figures.edm_examples || [];
  const cardHtml = item => `<article class="image-card">${visualImageHtml(item.src, item.title, item)}<div class="caption"><h4>${htmlEscape(item.title)}</h4>${artifactRefHtml(item.src, item)}<p>Source: ${htmlEscape(item.source)}</p>${figureAnalysisHtml(item)}</div></article>`;
  $('edmExampleGrid').innerHTML = renderVisualCardGroups(items, cardHtml, item => item.src, {
    gridClass: 'gallery legacy-visual-grid',
    noun: 'EDM example figures'
  });
}

function renderFigureGallery() {
  const tag = $('figureTag').value;
  const q = $('figureSearch').value.trim().toLowerCase();
  const figs = D.figures.diagnostics.filter(f => (tag === 'All' || f.tags.includes(tag)) && (!q || `${f.title} ${f.tags.join(' ')} ${f.interpretation}`.toLowerCase().includes(q)));
  const cardHtml = f => {
    const interp = f.interpretation ? f.interpretation.replace(/\\textbf\{|\}/g, '').split('\n').filter(Boolean).slice(0, 2).join(' ') : f.source;
    return `<article class="image-card">${visualImageHtml(f.src, f.title, f)}<div class="caption"><h4>${htmlEscape(f.title)}</h4>${artifactRefHtml(f.src, f)}<p>${htmlEscape(interp)}</p><div class="tags">${(f.tags || []).map(t => `<span class="tag">${htmlEscape(t)}</span>`).join('')}</div>${figureAnalysisHtml(f)}${figureLinksHtml(f)}</div></article>`;
  };
  $('figureGallery').innerHTML = renderVisualCardGroups(figs, cardHtml, f => f.src, {
    gridClass: 'gallery legacy-visual-grid',
    noun: 'diagnostic figures'
  });
}

function renderPaperTables() {
  const group = $('paperTableGroup').value;
  const q = $('paperTableSearch').value.trim().toLowerCase();
  const tables = (D.paper_tables || []).filter(t => {
    const groupOk = group === 'All' || t.group === group;
    const haystack = `${t.title} ${t.group} ${t.filename} ${t.suggested_placement} ${t.data_source} ${t.interpretation} ${t.caption} ${t.label}`.toLowerCase();
    return groupOk && (!q || haystack.includes(q));
  });
  const groupCounts = {};
  (D.paper_tables || []).forEach(t => { groupCounts[t.group] = (groupCounts[t.group] || 0) + 1; });
  $('paperTableSummary').innerHTML = [
    ['Visible tables', tables.length, group === 'All' ? 'all groups' : group],
    ['Total fragments', (D.paper_tables || []).length, 'PAPER_READY/latex'],
    ['Groups', Object.keys(groupCounts).length, Object.entries(groupCounts).map(([k, v]) => `${k}: ${v}`).join(' · ')],
  ].map(([label, value, detail]) => `<div class="stat-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
  if (!tables.length) {
    $('paperTables').innerHTML = '<p class="notice">No paper tables match this filter.</p>';
    return;
  }
  $('paperTables').innerHTML = tables.map(t => `
    <article class="paper-table-card">
      <header>
        <div class="tags"><span class="tag">${htmlEscape(t.group)}</span><span class="tag">${htmlEscape(t.filename)}</span>${t.label ? `<span class="tag">${htmlEscape(t.label)}</span>` : ''}</div>
        <h3>${htmlEscape(t.title)}</h3>
        <p class="caption-text">${htmlEscape(t.caption || t.interpretation || '')}</p>
        <div class="paper-meta-grid">
          <div class="paper-meta-item"><strong>Suggested placement</strong>${htmlEscape(t.suggested_placement || 'n/a')}</div>
          <div class="paper-meta-item"><strong>Data source</strong>${htmlEscape(t.data_source || 'n/a')}</div>
          <div class="paper-meta-item"><strong>Interpretation</strong>${htmlEscape(t.interpretation || 'n/a')}</div>
        </div>
      </header>
      <div class="paper-table-body">
        <div class="table-wrap paper-rendered">${t.rendered_html || '<p class="notice">No rendered tabular block found; inspect LaTeX source.</p>'}</div>
        <details class="latex-source">
          <summary>LaTeX source</summary>
          <pre>${htmlEscape(t.latex || '')}</pre>
        </details>
      </div>
    </article>`).join('');
}

function renderRawTable() {
  const domain = $('rawDomain').value;
  const q = $('rawSearch').value.trim().toLowerCase();
  const rows = D.raw[domain].filter(r => !q || JSON.stringify(r).toLowerCase().includes(q)).slice(0, 10);
  if (!rows.length) {
    $('rawTable').innerHTML = '<p class="notice">No rows match the current filter.</p>';
    return;
  }
  const cols = Object.keys(rows[0]);
  let html = '<table><thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
  rows.forEach(r => {
    html += '<tr>' + cols.map(c => {
      const v = r[c];
      return `<td>${typeof v === 'number' ? Number(v).toPrecision(5) : (v ?? '')}</td>`;
    }).join('') + '</tr>';
  });
  html += '</tbody></table>';
  $('rawTable').innerHTML = html;
}

function schedulerGuideItems() {
  const baseItems = schedulerOrder
    .filter(scheduler => ['linear', 'cosine', 'sigmoid', 'log', 'power_2', 'power_3', 'entropic', 'entropic_log1p', 'entropic_reverse', 'entropic_log1p_reverse'].includes(scheduler))
    .map(scheduler => ({
      scheduler,
      label: schedulerLabel(scheduler),
      text: schedulerWhyText(scheduler)
    }));
  const entropicIndex = baseItems.findIndex(item => item.scheduler === 'entropic');
  const condmargCard = {
    scheduler: 'entropic',
    label: 'Entropic · cond-marg',
    className: 'alpha-condmarg-card',
    chip: 'AlphaFlow main',
    text: 'This is the missing main protein variant: schedule_family = condmarg with scheduler = entropic. It allocates AlphaFlow steps by the conditional-minus-marginal bridge-rate signal. It is distinct from EDM cond-marg ablations, which are historical supplemental rows and excluded from main EDM evidence.'
  };
  const condmargLogCard = {
    scheduler: 'entropic_log1p',
    label: 'Entropic-log1p · cond-marg',
    className: 'alpha-condmarg-card',
    chip: 'AlphaFlow main',
    text: 'This is the damped cond-marg protein variant: the conditional-minus-marginal bridge-rate signal is log1p-compressed before inverse-CDF timestep placement. It is the regularized comparison for raw Entropic · cond-marg.'
  };
  if (entropicIndex >= 0) {
    baseItems.splice(entropicIndex + 1, 0, condmargCard);
  } else {
    baseItems.push(condmargCard);
  }
  const logIndex = baseItems.findIndex(item => item.scheduler === 'entropic_log1p' && !item.className);
  if (logIndex >= 0) {
    baseItems.splice(logIndex + 1, 0, condmargLogCard);
  } else {
    baseItems.push(condmargLogCard);
  }
  return baseItems;
}

function renderSchedulerGuide() {
  const el = $('schedulerGuide');
  if (!el) return;
  el.innerHTML = schedulerGuideItems().map(item => `
    <article class="scheduler-guide-card ${isEntropicScheduler(item.scheduler) ? 'entropic-card' : ''} ${item.className || ''}">
      <h3><span class="swatch" style="background:${schedulerColor(item.scheduler)}"></span>${htmlEscape(item.label)}${item.chip ? `<span class="spotlight-chip alpha-chip">${htmlEscape(item.chip)}</span>` : ''}</h3>
      <p>${htmlEscape(item.text)}</p>
    </article>`).join('');
}

function pctImprovementLower(best, baseline) {
  if (!best || !baseline || !Number.isFinite(best) || !Number.isFinite(baseline) || baseline === 0) return null;
  return 100 * (baseline - best) / baseline;
}

function deltaHigher(best, baseline) {
  if (!best || !baseline || !Number.isFinite(best) || !Number.isFinite(baseline)) return null;
  return best - baseline;
}

function signedPctImprovementLower(value, baseline) {
  if (!Number.isFinite(value) || !Number.isFinite(baseline) || baseline === 0) return null;
  return 100 * (baseline - value) / baseline;
}

function signedDeltaText(value, suffix = '%') {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'n/a';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatValue(value, '.1f')}${suffix}`;
}

function tableColGroup(classes) {
  return `<colgroup>${classes.map(cls => `<col class="${htmlEscape(cls)}">`).join('')}</colgroup>`;
}

function renderOverallStrongTables() {
  const edmSteps = [5, 10, 25];

  const alphaDatasets = ['CAMEO', 'ATLAS'];
  const alphaHeadlineRow = row => row.size_group === 'All' && row.scheduler !== 'entropic_log1p';
  const alphaRows = alphaDatasets.flatMap(dataset =>
    alphaRowsForDataset(dataset).filter(alphaHeadlineRow)
  );
  const alphaVariants = rankedAlphaMetricPivotVariants(alphaRows);
  const alphaBest = {};
  alphaDatasets.forEach(dataset => edmSteps.forEach(step => {
    alphaBest[`${dataset}:${step}`] = bestHeroRow(
      alphaRowsForDataset(dataset).filter(row => alphaHeadlineRow(row) && Number(row.n_steps) === step),
      'plddt_mean',
      'alphaflow'
    );
  }));

  function edmHeadlineHtml(mode, regimeLabelText) {
    const edmRows = edmRowsForMode(mode);
    const edmSchedulers = rankedEdmSchedulers(edmRows, allMeasuredEdmSchedulers());
    const edmBest = {};
    edmSteps.forEach(step => {
      edmBest[step] = bestHeroRow(edmRows.filter(row => Number(row.n_steps) === step), 'fid_inception', 'edm')?.scheduler;
    });
    const edmColGroup = tableColGroup(['ode-sched-col', ...edmSteps.flatMap(() => ['nfe-metric-col', 'nfe-metric-col'])]);
    let html = `<table>${edmColGroup}<thead><tr><th rowspan="2" class="sticky-table-head">${htmlEscape(regimeLabelText)} sched.</th>`;
    edmSteps.forEach(step => { html += `<th class="nfe-group-head nfe-start" colspan="2">${step} NFE</th>`; });
    html += '</tr><tr>';
    edmSteps.forEach(() => { html += '<th class="nfe-start" title="Inception FID">FID-I</th><th class="nfe-end" title="Percent change versus linear">vs Lin.</th>'; });
    html += '</tr></thead><tbody>';
    let seenEdmEntropic = false;
    edmSchedulers.forEach(scheduler => {
      const isEntropicGroup = isEntropicScheduler(scheduler);
      const rowClass = [
        isEdmSpotlightScheduler(scheduler) ? 'spotlight-row-edm' : '',
        isEntropicGroup && !seenEdmEntropic ? 'entropic-section-start' : ''
      ].filter(Boolean).join(' ');
      if (isEntropicGroup) seenEdmEntropic = true;
      html += `<tr class="${rowClass}"><td class="hero-row-label" title="${htmlEscape(schedulerLabel(scheduler))}"><span class="scheduler-name"><span class="swatch" style="background:${schedulerColor(scheduler)}"></span>${htmlEscape(shortSchedulerLabel(scheduler))}</span>${schedulerBadges(scheduler, { domain: 'edm' })}</td>`;
      edmSteps.forEach(step => {
        const row = edmRows.find(r => r.scheduler === scheduler && Number(r.n_steps) === step);
        const linear = edmRows.find(r => r.scheduler === 'linear' && Number(r.n_steps) === step);
        const stat = row?.metric_values?.fid_inception;
        const linearStat = linear?.metric_values?.fid_inception;
        const delta = signedPctImprovementLower(Number(stat?.mean), Number(linearStat?.mean));
        const isBest = edmBest[step] === scheduler;
        html += `<td class="nfe-start ${isBest ? 'best' : ''} ${isEdmSpotlightScheduler(scheduler) ? 'spotlight-cell-edm' : ''}">${heroStatCell(stat, metricConfig('edm', 'fid_inception'), 'edm')}</td><td class="nfe-end">${signedDeltaText(delta)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function alphaHeadlineHtml(regimeLabelText) {
    const alphaColGroup = tableColGroup(['alpha-sched-col', ...alphaDatasets.flatMap(() => edmSteps.map(() => 'nfe-metric-col'))]);
    let html = `<table>${alphaColGroup}<thead><tr><th rowspan="2" class="sticky-table-head">${htmlEscape(regimeLabelText)} AF sched.</th>`;
    alphaDatasets.forEach(dataset => { html += `<th class="nfe-group-head nfe-start" colspan="${edmSteps.length}">${htmlEscape(dataset)} all proteins · pLDDT</th>`; });
    html += '</tr><tr>';
    alphaDatasets.forEach(() => edmSteps.forEach((step, stepIndex) => {
      html += `<th class="${stepIndex === 0 ? 'nfe-start' : ''} ${stepIndex === edmSteps.length - 1 ? 'nfe-end' : ''}">${step} NFE</th>`;
    }));
    html += '</tr></thead><tbody>';
    let seenAlphaEntropic = false;
    alphaVariants.forEach(key => {
      const family = alphaVariantFamily(key);
      const scheduler = alphaVariantScheduler(key);
      const isCondmarg = isAlphaSpotlightFamily(family);
      const isEntropicGroup = isAlphaEntropicVariant(key);
      const rowClass = [
        isCondmarg ? 'spotlight-row-alpha alpha-unified-condmarg' : 'alpha-unified-standard',
        isEntropicGroup && !seenAlphaEntropic ? 'entropic-section-start' : ''
      ].filter(Boolean).join(' ');
      if (isEntropicGroup) seenAlphaEntropic = true;
      html += `<tr class="${rowClass}"><td class="hero-row-label" title="${htmlEscape(alphaVariantLabel(key))}"><span class="scheduler-name"><span class="swatch variant-swatch ${isCondmarg ? 'condmarg-swatch' : 'standard-swatch'}" style="background:${alphaVariantColor(key)}"></span>${htmlEscape(shortAlphaVariantLabel(key))}</span>${schedulerBadges(scheduler, { domain: 'alphaflow', includeAlpha: isCondmarg })}</td>`;
      alphaDatasets.forEach(dataset => edmSteps.forEach((step, stepIndex) => {
        const row = alphaRows.find(r => r.dataset_group === dataset && r.size_group === 'All' && alphaVariantKey(r) === key && Number(r.n_steps) === step);
        const winner = alphaBest[`${dataset}:${step}`];
        const isBest = winner && alphaVariantKey(winner) === key;
        const cellClasses = [
          stepIndex === 0 ? 'nfe-start' : '',
          stepIndex === edmSteps.length - 1 ? 'nfe-end' : '',
          isBest ? 'best' : '',
          isCondmarg ? 'spotlight-cell-alpha' : ''
        ].filter(Boolean).join(' ');
        html += `<td class="${cellClasses}">${heroStatCell(row?.metric_values?.plddt_mean, metricConfig('alphaflow', 'plddt_mean'), 'alphaflow')}</td>`;
      }));
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  const headlineTables = [
    ['overallEdmHeroStrong', edmHeadlineHtml('ode_heun', 'ODE')],
    ['overallAlphaHeroStrong', alphaHeadlineHtml('ODE')],
    ['overallEdmSdeHeroStrong', edmHeadlineHtml('sde_heun', 'SDE')],
    ['overallAlphaSdeHeroStrong', alphaHeadlineHtml('SDE')]
  ];
  headlineTables.forEach(([id, html]) => {
    const el = $(id);
    if (el) el.innerHTML = html;
  });
}

function renderTheoryValidationStatement() {
  const el = $('theoryValidationStatement');
  if (!el) return;
  const edm5 = bestHeroRow(edmRowsForMode('ode_heun').filter(row => Number(row.n_steps) === 5), 'fid_inception', 'edm');
  const edmLinear = edmRowsForMode('ode_heun').find(row => Number(row.n_steps) === 5 && row.scheduler === 'linear');
  const edmGain = pctImprovementLower(edm5?.metric_values?.fid_inception?.mean, edmLinear?.metric_values?.fid_inception?.mean);
  const cameoCond = alphaRowsForDataset('CAMEO').find(row => row.size_group === 'All' && Number(row.n_steps) === 5 && row.schedule_family === ALPHA_SPOTLIGHT_FAMILY && row.scheduler === 'entropic');
  const atlasCond = alphaRowsForDataset('ATLAS').find(row => row.size_group === 'All' && Number(row.n_steps) === 5 && row.schedule_family === ALPHA_SPOTLIGHT_FAMILY && row.scheduler === 'entropic');
  el.innerHTML = `
    <div class="verdict-main">
      <span class="verdict-kicker">At a glance</span>
      <strong>Entropic scheduling is strongest in selected low-NFE slices.</strong>
      <p>EDM ODE 5 NFE: ${htmlEscape(schedulerLabel(edm5?.scheduler || 'n/a'))}${edmGain === null ? '' : `, ${formatValue(edmGain, '.1f')}% better FID than linear`}. AlphaFlow 5 NFE pLDDT: CAMEO ${formatValue(cameoCond?.metric_values?.plddt_mean?.mean, '.2f')}, ATLAS ${formatValue(atlasCond?.metric_values?.plddt_mean?.mean, '.2f')}.</p>
    </div>
  `;
}

function renderTheoryEvidenceCards() {
  const el = $('theoryEvidenceCards');
  if (!el) return;
  const cards = [
    ['Bridge signal', 'Conditional-minus-marginal rate.'],
    ['Shape', 'Endpoint-heavy U profile.'],
    ['Allocation', 'Inverse-CDF step placement.'],
    ['Boundary', 'Metric-specific low-NFE gains.']
  ];
  el.innerHTML = cards.map(([title, text]) => `<article class="theory-mini-card"><h3>${htmlEscape(title)}</h3><p>${htmlEscape(text)}</p></article>`).join('');
}

function renderTarchicTheoryGallery() {
  const el = $('tarchicTheoryGallery');
  if (!el) return;
  const pdfFragment = '#toolbar=0&navpanes=0&scrollbar=0&view=FitH';
  const cardHtml = asset => `
    <article class="pdf-card">
      <header>
        <span class="tag">${htmlEscape(asset.category)}</span>
        ${evidenceStatusBadgeHtml(asset.href, asset)}
        <h3>${htmlEscape(asset.title)}</h3>
        ${artifactRefHtml(asset.href, asset)}
        <p>${htmlEscape(asset.note)}</p>
      </header>
      <div class="pdf-viewer-pane">
        ${originBadgeHtml(asset.href, asset)}
        ${evidenceStatusBadgeHtml(asset.href, asset)}
        <span class="lazy-preview-label">PDF preview loads when visible</span>
        <iframe class="pdf-viewer-frame lazy-preview-frame" data-lazy-preview-src="${htmlEscape(asset.href)}${pdfFragment}" title="${htmlEscape(asset.title)}" loading="lazy"></iframe>
        <button class="pdf-viewer-open" type="button" data-visual-src="${htmlEscape(asset.href)}" data-visual-title="${htmlEscape(asset.title)}" data-origin-key="${htmlEscape(assetOrigin(asset.href, asset))}" aria-label="Open enlarged PDF: ${htmlEscape(asset.title)}">Open enlarged PDF</button>
      </div>
      <a class="link-tag pdf-open-link" href="${htmlEscape(asset.href)}" data-visual-title="${htmlEscape(asset.title)}" data-origin-key="${htmlEscape(assetOrigin(asset.href, asset))}">Open PDF</a>
    </article>`;
  el.innerHTML = renderVisualCardGroups(TARCHIC_THEORY_ASSETS, cardHtml, asset => asset.href, {
    gridClass: 'pdf-gallery legacy-visual-grid',
    noun: 'theory figures'
  });
  hydrateLazyPreviewFrames(el);
}

function filteredTarchicCharts() {
  const run = $('tarchicAtlasRun')?.value || 'All';
  const category = $('tarchicAtlasCategory')?.value || 'All';
  const query = ($('tarchicAtlasSearch')?.value || '').trim().toLowerCase();
  return TARCHIC_CHARTS.filter(chart => {
    const runOk = run === 'All' || chart.run === run;
    const categoryOk = category === 'All' || chart.category === category;
    const haystack = `${chart.title} ${chart.note} ${chart.href} ${chart.source_path} ${chart.run} ${chart.domain} ${chart.scope} ${chart.collection} ${chart.category}`.toLowerCase();
    return runOk && categoryOk && (!query || haystack.includes(query));
  });
}

function renderTarchicChartAtlas() {
  const statsEl = $('tarchicAtlasStats');
  const galleryEl = $('tarchicAtlasGallery');
  if (!statsEl || !galleryEl) return;
  const pdfFragment = '#toolbar=0&navpanes=0&scrollbar=0&view=FitH';
  const charts = filteredTarchicCharts();
  const total = TARCHIC_CHARTS.length;
  const categories = unique(TARCHIC_CHARTS.map(chart => chart.category)).length;
  const runs = unique(TARCHIC_CHARTS.map(chart => chart.run)).join(' · ');
  statsEl.innerHTML = [
    ['Visible charts', charts.length, `${total} PDFs indexed from ./tarchic-charts`],
    ['Lazy previews', charts.length, 'PDF thumbnails load only near the viewport'],
    ['Categories', categories, 'domain / scope / collection / NFE bins'],
    ['Origin buckets', runs || 'n/a', 'derived from chart path provenance'],
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
  if (!charts.length) {
    galleryEl.innerHTML = '<p class="notice">No tarchic chart PDFs match the current filters.</p>';
    return;
  }
  const cardHtml = chart => `
    <article class="link-card tarchic-chart-card">
      <div class="tarchic-chart-card-head">
        ${originBadgeHtml(chart.href, chart)}
        ${evidenceStatusBadgeHtml(chart.href, chart)}
        <span class="tag">${htmlEscape(chart.category)}</span>
      </div>
      <div class="tarchic-chart-preview">
        <span class="lazy-preview-label">PDF preview loads when visible</span>
        <iframe class="lazy-preview-frame" data-lazy-preview-src="${htmlEscape(chart.href)}${pdfFragment}" title="${htmlEscape(chart.title)} preview" loading="lazy"></iframe>
        <button class="tarchic-chart-preview-open" type="button" data-visual-src="${htmlEscape(chart.href)}" data-visual-title="${htmlEscape(chart.title)}" data-origin-key="${htmlEscape(assetOrigin(chart.href, chart))}" aria-label="Open enlarged preview: ${htmlEscape(chart.title)}"></button>
      </div>
      <span class="link-card-title">${htmlEscape(chart.title)}</span>
      <span class="link-card-detail">${htmlEscape(chart.note || chart.source_path)}</span>
      ${artifactRefHtml(chart.href, chart)}
      <div class="tarchic-chart-actions">
        <button class="tag link-tag" type="button" data-visual-src="${htmlEscape(chart.href)}" data-visual-title="${htmlEscape(chart.title)}" data-origin-key="${htmlEscape(assetOrigin(chart.href, chart))}">Open PDF</button>
        <a class="tag link-tag" href="${htmlEscape(chart.href)}" data-visual-title="${htmlEscape(chart.title)}" data-origin-key="${htmlEscape(assetOrigin(chart.href, chart))}">Direct PDF</a>
      </div>
    </article>`;
  galleryEl.innerHTML = renderVisualCardGroups(charts, cardHtml, chart => chart.href, {
    gridClass: 'link-card-grid tarchic-atlas-grid legacy-visual-grid',
    noun: 'tarchic charts'
  });
  hydrateLazyPreviewFrames(galleryEl);
}

function sizeRank(size) {
  const idx = SIZE_ORDER.indexOf(size);
  return idx >= 0 ? idx : SIZE_ORDER.length;
}

function displaySize(size) {
  return size === 'All' ? 'All proteins' : size;
}

function activeProteinSizes() {
  return activeProteinSizeFilter === '__all__'
    ? SIZE_ORDER
    : SIZE_ORDER.filter(size => size === activeProteinSizeFilter);
}

function syncProteinSizeFilterControls() {
  document.querySelectorAll('[data-protein-size-filter]').forEach(button => {
    const active = button.getAttribute('data-protein-size-filter') === activeProteinSizeFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function setProteinSizeFilter(size) {
  activeProteinSizeFilter = SIZE_ORDER.includes(size) ? size : '__all__';
  syncProteinSizeFilterControls();
  const chartSize = SIZE_ORDER.includes(activeProteinSizeFilter) ? activeProteinSizeFilter : 'All';
  ['odeAlphaSize', 'sdeAlphaSize'].forEach(id => {
    const select = $(id);
    if (select) select.value = chartSize;
  });
  renderAlphaHeroTable('odeCameoHero', 'CAMEO');
  renderAlphaMetricPivotTable('odeCameoMetricHero', 'CAMEO');
  renderAlphaHeroTable('odeAtlasHero', 'ATLAS');
  renderAlphaHeroTable('sdeCameoHero', 'CAMEO');
  renderAlphaMetricPivotTable('sdeCameoMetricHero', 'CAMEO');
  renderAlphaHeroTable('sdeAtlasHero', 'ATLAS');
  renderRegimeCharts('ode');
  renderRegimeCharts('sde');
}

function regimeMode(regime) {
  return `${regime}_heun`;
}

function regimeLabel(regime) {
  return regime.toUpperCase();
}

function isAlphaDisplayRow(row) {
  return Boolean(row);
}

function edmRowsForMode(mode) {
  return D.summary.edm
    .filter(row => row.mode === mode)
    .map(row => ({
      ...row,
      metric_values: cloneMetricValuesWithEdmSupport(row.metric_values)
    }));
}

function alphaRowsForDataset(dataset) {
  return D.summary.alphaflow
    .filter(row => row.dataset_group === dataset && SIZE_ORDER.includes(row.size_group) && isAlphaDisplayRow(row))
    .sort((a, b) =>
      sizeRank(a.size_group) - sizeRank(b.size_group) ||
      alphaVariantRank(alphaVariantKey(a)) - alphaVariantRank(alphaVariantKey(b)) ||
      Number(a.n_steps) - Number(b.n_steps)
    );
}

function heroStatCell(stat, cfg, domain) {
  return `${formatCell(stat, cfg)}${formatSupport(stat, domain)}`;
}

function bestHeroRow(rows, metric, domain) {
  const cfg = metricConfig(domain, metric);
  const candidates = rows
    .filter(row => row.metric_values?.[metric]?.mean !== null && row.metric_values?.[metric]?.mean !== undefined)
    .sort((a, b) => {
      const av = a.metric_values[metric].mean;
      const bv = b.metric_values[metric].mean;
      return cfg.direction === 'higher' ? bv - av : av - bv;
    });
  return candidates[0] || null;
}

function heroRankScore(rows, metric, domain) {
  const cfg = metricConfig(domain, metric);
  const values = rows
    .map(row => row.metric_values?.[metric]?.mean)
    .filter(value => value !== null && value !== undefined)
    .map(Number)
    .filter(Number.isFinite);
  if (!values.length) return cfg.direction === 'higher' ? -Infinity : Infinity;
  return cfg.direction === 'higher' ? Math.max(...values) : Math.min(...values);
}

function compareHeroRankScores(a, b, metric, domain) {
  const cfg = metricConfig(domain, metric);
  if (a.score !== b.score) {
    return cfg.direction === 'higher' ? b.score - a.score : a.score - b.score;
  }
  return 0;
}

function rankedEdmSchedulers(rows, schedulers) {
  const metric = 'fid_inception';
  return [...schedulers].sort((a, b) => {
    const aEntropic = isEntropicScheduler(a);
    const bEntropic = isEntropicScheduler(b);
    if (aEntropic !== bEntropic) return aEntropic ? 1 : -1;
    const cmp = compareHeroRankScores(
      { score: heroRankScore(rows.filter(row => row.scheduler === a), metric, 'edm') },
      { score: heroRankScore(rows.filter(row => row.scheduler === b), metric, 'edm') },
      metric,
      'edm'
    );
    return cmp || schedulerRank(a) - schedulerRank(b);
  });
}

function isAlphaEntropicVariant(key) {
  return isEntropicScheduler(alphaVariantScheduler(key));
}

function rankedAlphaHeroRowIds(rows, sizes = SIZE_ORDER) {
  const metric = 'plddt_mean';
  return allAlphaHeroRowIds(sizes).sort((a, b) => {
    const [aSize, ...aRest] = a.split('__');
    const [bSize, ...bRest] = b.split('__');
    const sizeCmp = sizeRank(aSize) - sizeRank(bSize);
    if (sizeCmp) return sizeCmp;
    const aKey = aRest.join('__');
    const bKey = bRest.join('__');
    const aEntropic = isAlphaEntropicVariant(aKey);
    const bEntropic = isAlphaEntropicVariant(bKey);
    if (aEntropic !== bEntropic) return aEntropic ? 1 : -1;
    const cmp = compareHeroRankScores(
      { score: heroRankScore(rows.filter(row => alphaHeroRowId(row) === a), metric, 'alphaflow') },
      { score: heroRankScore(rows.filter(row => alphaHeroRowId(row) === b), metric, 'alphaflow') },
      metric,
      'alphaflow'
    );
    return cmp || alphaVariantRank(aKey) - alphaVariantRank(bKey);
  });
}

function rankedAlphaMetricPivotVariants(rows) {
  const metric = 'plddt_mean';
  return allMeasuredAlphaVariants().sort((a, b) => {
    const aEntropic = isAlphaEntropicVariant(a);
    const bEntropic = isAlphaEntropicVariant(b);
    if (aEntropic !== bEntropic) return aEntropic ? 1 : -1;
    const cmp = compareHeroRankScores(
      { score: heroRankScore(rows.filter(row => alphaVariantKey(row) === a), metric, 'alphaflow') },
      { score: heroRankScore(rows.filter(row => alphaVariantKey(row) === b), metric, 'alphaflow') },
      metric,
      'alphaflow'
    );
    return cmp || alphaVariantRank(a) - alphaVariantRank(b);
  });
}

function renderEdmHeroTable(containerId, mode) {
  const el = $(containerId);
  if (!el) return;
  const rows = edmRowsForMode(mode);
  const steps = stepsFrom(rows);
  const schedulers = rankedEdmSchedulers(rows, allMeasuredEdmSchedulers());
  const best = {};
  steps.forEach(step => HERO_EDM_METRICS.forEach(metric => {
    best[`${step}:${metric}`] = bestHeroRow(rows.filter(row => Number(row.n_steps) === Number(step)), metric, 'edm')?.scheduler;
  }));
  const colGroup = tableColGroup(['ode-sched-col', ...steps.flatMap(() => HERO_EDM_METRICS.map(() => 'nfe-metric-col'))]);
  let html = `<table>${colGroup}<thead><tr><th rowspan="2" class="sticky-table-head">Scheduler</th>`;
  steps.forEach(step => { html += `<th class="nfe-group-head nfe-start" colspan="${HERO_EDM_METRICS.length}">${step} NFE</th>`; });
  html += '</tr><tr>';
  steps.forEach(() => HERO_EDM_METRICS.forEach((metric, metricIndex) => {
    const boundaryClass = metricIndex === 0 ? 'nfe-start' : (metricIndex === HERO_EDM_METRICS.length - 1 ? 'nfe-end' : '');
    const cfg = metricConfig('edm', metric);
    html += `<th class="${boundaryClass}" title="${htmlEscape(cfg.label)}; ${htmlEscape(directionShort(cfg.direction))}">${htmlEscape(shortMetricLabel('edm', metric))}</th>`;
  }));
  html += '</tr></thead><tbody>';
  let seenEntropicRows = false;
  schedulers.forEach(scheduler => {
    const isEntropicGroup = isEntropicScheduler(scheduler);
    const rowClass = [
      isEdmSpotlightScheduler(scheduler) ? 'spotlight-row-edm' : '',
      isEntropicGroup && !seenEntropicRows ? 'entropic-section-start' : ''
    ].filter(Boolean).join(' ');
    if (isEntropicGroup) seenEntropicRows = true;
    html += `<tr class="${rowClass}"><td class="hero-row-label" title="${htmlEscape(schedulerLabel(scheduler))}"><span class="scheduler-name"><span class="swatch" style="background:${schedulerColor(scheduler)}"></span>${htmlEscape(shortSchedulerLabel(scheduler))}</span>${schedulerBadges(scheduler, { domain: 'edm' })}</td>`;
    steps.forEach(step => HERO_EDM_METRICS.forEach((metric, metricIndex) => {
      const row = rows.find(r => r.scheduler === scheduler && Number(r.n_steps) === Number(step));
      const cfg = metricConfig('edm', metric);
      const isBest = best[`${step}:${metric}`] === scheduler;
      const cellClasses = [
        metricIndex === 0 ? 'nfe-start' : '',
        metricIndex === HERO_EDM_METRICS.length - 1 ? 'nfe-end' : '',
        isBest ? 'best' : '',
        isEdmSpotlightScheduler(scheduler) ? 'spotlight-cell-edm' : ''
      ].filter(Boolean).join(' ');
      html += `<td class="${cellClasses}">${heroStatCell(row?.metric_values?.[metric], cfg, 'edm')}</td>`;
    }));
    html += '</tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function alphaHeroRowId(row) {
  return `${row.size_group}__${alphaVariantKey(row)}`;
}

function renderAlphaHeroTable(containerId, dataset) {
  const el = $(containerId);
  if (!el) return;
  const rows = alphaRowsForDataset(dataset);
  const steps = stepsFrom(rows);
  const sizes = activeProteinSizes();
  const rowIds = rankedAlphaHeroRowIds(rows, sizes);
  const best = {};
  sizes.forEach(size => steps.forEach(step => HERO_ALPHA_METRICS.forEach(metric => {
    const candidates = rows.filter(row => row.size_group === size && Number(row.n_steps) === Number(step));
    best[`${size}:${step}:${metric}`] = bestHeroRow(candidates, metric, 'alphaflow');
  })));
  const colGroup = tableColGroup(['size-sched-col', ...steps.flatMap(() => HERO_ALPHA_METRICS.map(() => 'nfe-metric-col'))]);
  let html = `<table>${colGroup}<thead><tr><th rowspan="2" class="sticky-table-head">Size + sched.</th>`;
  steps.forEach(step => { html += `<th class="nfe-group-head nfe-start" colspan="${HERO_ALPHA_METRICS.length}">${step} NFE</th>`; });
  html += '</tr><tr>';
  steps.forEach(() => HERO_ALPHA_METRICS.forEach((metric, metricIndex) => {
    const boundaryClass = metricIndex === 0 ? 'nfe-start' : (metricIndex === HERO_ALPHA_METRICS.length - 1 ? 'nfe-end' : '');
    const cfg = metricConfig('alphaflow', metric);
    html += `<th class="${boundaryClass}" title="${htmlEscape(cfg.label)}; ${htmlEscape(directionShort(cfg.direction))}">${htmlEscape(shortMetricLabel('alphaflow', metric))}</th>`;
  }));
  html += '</tr></thead><tbody>';
  let previousSize = null;
  const seenEntropicBySize = {};
  rowIds.forEach(rowId => {
    const [size, ...variantParts] = rowId.split('__');
    const key = variantParts.join('__');
    const isCondmarg = isAlphaSpotlightFamily(alphaVariantFamily(key));
    const isEntropicGroup = isAlphaEntropicVariant(key);
    const sizeStart = size !== previousSize;
    const entropicStart = isEntropicGroup && !seenEntropicBySize[size];
    previousSize = size;
    if (isEntropicGroup) seenEntropicBySize[size] = true;
    const sizeChip = `<span class="size-chip ${size === 'All' ? 'all-size-chip' : ''}">${htmlEscape(displaySize(size))}</span>`;
    const rowClasses = [
      isCondmarg ? 'spotlight-row-alpha alpha-unified-condmarg' : 'alpha-unified-standard',
      sizeStart ? 'protein-size-start' : '',
      entropicStart ? 'entropic-section-start' : ''
    ].filter(Boolean).join(' ');
    html += `<tr class="${rowClasses}"><td class="hero-row-label" title="${htmlEscape(`${displaySize(size)} / ${alphaVariantLabel(key)}`)}">${sizeChip}<span class="scheduler-name"><span class="swatch variant-swatch ${isCondmarg ? 'condmarg-swatch' : 'standard-swatch'}" style="background:${alphaVariantColor(key)}"></span>${htmlEscape(shortAlphaVariantLabel(key))}</span></td>`;
    steps.forEach(step => HERO_ALPHA_METRICS.forEach((metric, metricIndex) => {
      const row = rows.find(r => alphaHeroRowId(r) === rowId && Number(r.n_steps) === Number(step));
      const cfg = metricConfig('alphaflow', metric);
      const winner = best[`${size}:${step}:${metric}`];
      const isBest = winner && alphaHeroRowId(winner) === rowId;
      const cellClasses = [
        metricIndex === 0 ? 'nfe-start' : '',
        metricIndex === HERO_ALPHA_METRICS.length - 1 ? 'nfe-end' : '',
        isBest ? 'best' : '',
        isCondmarg ? 'spotlight-cell-alpha' : ''
      ].filter(Boolean).join(' ');
      html += `<td class="${cellClasses}">${heroStatCell(row?.metric_values?.[metric], cfg, 'alphaflow')}</td>`;
    }));
    html += '</tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function renderAlphaMetricPivotTable(containerId, dataset) {
  const el = $(containerId);
  if (!el) return;
  const rows = alphaRowsForDataset(dataset);
  const steps = stepsFrom(rows);
  const sizes = activeProteinSizes();
  const variants = rankedAlphaMetricPivotVariants(rows);
  const firstEntropicIndex = variants.findIndex(isAlphaEntropicVariant);
  const best = {};
  sizes.forEach(size => HERO_ALPHA_METRICS.forEach(metric => steps.forEach(step => {
    const candidates = rows.filter(row => row.size_group === size && Number(row.n_steps) === Number(step));
    best[`${size}:${metric}:${step}`] = bestHeroRow(candidates, metric, 'alphaflow');
  })));
  const colGroup = tableColGroup(['metric-pivot-size-col', 'metric-pivot-label-col', ...steps.flatMap(() => variants.map(() => 'variant-metric-col'))]);
  let html = `<table>${colGroup}<thead><tr><th rowspan="2" class="sticky-table-head metric-pivot-size-head">Size</th><th rowspan="2" class="metric-pivot-metric-head">Metric</th>`;
  steps.forEach(step => { html += `<th class="nfe-group-head nfe-start" colspan="${variants.length}">${step} NFE</th>`; });
  html += '</tr><tr>';
  steps.forEach(() => variants.forEach((key, variantIndex) => {
    const cellClasses = [
      variantIndex === 0 ? 'nfe-start' : '',
      variantIndex === variants.length - 1 ? 'nfe-end' : '',
      variantIndex === firstEntropicIndex ? 'entropic-col-start' : ''
    ].filter(Boolean).join(' ');
    html += `<th class="${cellClasses}" title="${htmlEscape(alphaVariantLabel(key))}">${htmlEscape(shortAlphaVariantLabel(key))}</th>`;
  }));
  html += '</tr></thead><tbody>';
  sizes.forEach(size => {
    HERO_ALPHA_METRICS.forEach((metric, metricIndex) => {
      const cfg = metricConfig('alphaflow', metric);
      const rowClasses = metricIndex === 0 ? 'protein-size-start' : '';
      html += `<tr class="${rowClasses}">`;
      if (metricIndex === 0) {
        const sizeChip = `<span class="size-chip ${size === 'All' ? 'all-size-chip' : ''}">${htmlEscape(displaySize(size))}</span>`;
        html += `<td class="hero-row-label metric-pivot-size" rowspan="${HERO_ALPHA_METRICS.length}">${sizeChip}</td>`;
      }
      html += `<td class="metric-row-label" title="${htmlEscape(cfg.label)}"><span>${htmlEscape(shortMetricLabel('alphaflow', metric))}</span><span class="source-tag">${htmlEscape(directionShort(cfg.direction))}</span></td>`;
      steps.forEach(step => variants.forEach((key, variantIndex) => {
        const row = rows.find(r => r.size_group === size && Number(r.n_steps) === Number(step) && alphaVariantKey(r) === key);
        const winner = best[`${size}:${metric}:${step}`];
        const isBest = winner && alphaVariantKey(winner) === key;
        const isCondmarg = isAlphaSpotlightFamily(alphaVariantFamily(key));
        const cellClasses = [
          variantIndex === 0 ? 'nfe-start' : '',
          variantIndex === variants.length - 1 ? 'nfe-end' : '',
          variantIndex === firstEntropicIndex ? 'entropic-col-start' : '',
          isBest ? 'best' : '',
          isCondmarg ? 'spotlight-cell-alpha' : ''
        ].filter(Boolean).join(' ');
        html += `<td class="${cellClasses}">${heroStatCell(row?.metric_values?.[metric], cfg, 'alphaflow')}</td>`;
      }));
      html += '</tr>';
    });
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function metricSummaryText(row, metric, domain) {
  if (!row) return 'n/a';
  const cfg = metricConfig(domain, metric);
  const stat = row.metric_values?.[metric];
  return `${domain === 'alphaflow' ? alphaVariantLabel(alphaVariantKey(row)) : schedulerLabel(row.scheduler)} · ${formatCell(stat, cfg)}`;
}

function renderRegimeQuickCards(regime) {
  const container = $(`${regime}QuickCards`);
  if (!container) return;
  const mode = regimeMode(regime);
  const edmRows = edmRowsForMode(mode).filter(row => Number(row.n_steps) === 25);
  const cameoRows = alphaRowsForDataset('CAMEO').filter(row => row.size_group === 'All' && Number(row.n_steps) === 25);
  const atlasRows = alphaRowsForDataset('ATLAS').filter(row => row.size_group === 'All' && Number(row.n_steps) === 25);
  const cards = [
    ['Sampler view', `${regimeLabel(regime)} Heun`, regime === 'ode' ? 'deterministic EDM sampler rows' : 'stochastic EDM sampler rows'],
    ['EDM 25 NFE FID leader', metricSummaryText(bestHeroRow(edmRows, 'fid_inception', 'edm'), 'fid_inception', 'edm'), 'lower Inception FID is better'],
    ['CAMEO all-protein pLDDT leader', metricSummaryText(bestHeroRow(cameoRows, 'plddt_mean', 'alphaflow'), 'plddt_mean', 'alphaflow'), 'higher pLDDT is better'],
    ['ATLAS all-protein pLDDT leader', metricSummaryText(bestHeroRow(atlasRows, 'plddt_mean', 'alphaflow'), 'plddt_mean', 'alphaflow'), 'higher pLDDT is better']
  ];
  container.innerHTML = cards.map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${value}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
}

function renderRegimeTables(regime) {
  renderRegimeQuickCards(regime);
  renderEdmHeroTable(`${regime}EdmHero`, regimeMode(regime));
  renderAlphaHeroTable(`${regime}CameoHero`, 'CAMEO');
  renderAlphaMetricPivotTable(`${regime}CameoMetricHero`, 'CAMEO');
  renderAlphaHeroTable(`${regime}AtlasHero`, 'ATLAS');
}

function alphaLineRows(dataset, size) {
  return D.summary.alphaflow.filter(row => row.dataset_group === dataset && row.size_group === size && isAlphaDisplayRow(row));
}

function plotAlphaDataset(divId, dataset, size, metric, regime, selectedVariantKeys) {
  const allRows = alphaLineRows(dataset, size);
  const selected = new Set(selectedVariantKeys || unique(allRows.map(alphaVariantKey)));
  const rows = allRows.filter(row => selected.has(alphaVariantKey(row)));
  const cfg = metricConfig('alphaflow', metric);
  const variants = unique(rows.map(alphaVariantKey)).sort((a, b) => alphaVariantRank(a) - alphaVariantRank(b));
  if (!allRows.length) {
    showPlotNotice(divId, `No AlphaFlow rows for ${dataset} / ${size}.`);
    return;
  }
  if (!rows.length || !variants.length) {
    showPlotNotice(divId, `No AlphaFlow scheduler variants are selected for ${dataset} / ${displaySize(size)}.`);
    return;
  }
  const traces = variants.map(key => {
    const pts = rows.filter(row => alphaVariantKey(row) === key && row.metric_values?.[metric]).sort((a, b) => Number(a.n_steps) - Number(b.n_steps));
    const isCondmarg = isAlphaSpotlightFamily(alphaVariantFamily(key));
    return {
      x: pts.map(row => Number(row.n_steps)),
      y: pts.map(row => row.metric_values[metric].mean),
      error_y: { type: 'data', array: pts.map(row => row.metric_values[metric].ci || 0), visible: true, thickness: isCondmarg ? 1.4 : 1 },
      mode: 'lines+markers',
      name: alphaVariantLabel(key),
      line: { color: alphaVariantColor(key), width: isCondmarg ? 4 : 2.2, dash: isCondmarg ? 'solid' : 'dot' },
      marker: { size: isCondmarg ? 10 : 7, symbol: isCondmarg ? 'diamond' : 'circle' }
    };
  });
  Plotly.newPlot(
    divId,
    traces,
    plotLayout(`AlphaFlow ${dataset} ${displaySize(size)}: ${cfg.label} · ${regimeLabel(regime)} companion`, 'NFE steps', cfg.label),
    { responsive: true, displaylogo: false }
  );
}

function renderAlphaChartContext(regime, metric, size, selectedVariantKeys) {
  const el = $(`${regime}AlphaChartContext`);
  if (!el) return;
  const cfg = metricConfig('alphaflow', metric);
  const selected = new Set(selectedVariantKeys || []);
  const selectedSlice = `<div class="notice"><strong>Chart slice.</strong> The AlphaFlow hero tables above show every metric and every protein-size row. These charts show only the selected slice: ${htmlEscape(cfg.label)} / ${htmlEscape(displaySize(size))}, restricted to the visible scheduler checkboxes. Compare them to the matching ${htmlEscape(displaySize(size))} rows and ${htmlEscape(cfg.label)} columns in the CAMEO and ATLAS tables.</div>`;
  const cards = ['CAMEO', 'ATLAS'].map(dataset => {
    const rows = alphaLineRows(dataset, size).filter(row => !selectedVariantKeys || selected.has(alphaVariantKey(row)));
    const winners = stepsFrom(rows).map(step => {
      const winner = bestHeroRow(rows.filter(row => Number(row.n_steps) === Number(step)), metric, 'alphaflow');
      if (!winner) return `${step} NFE: n/a`;
      const stat = winner.metric_values?.[metric];
      return `${step} NFE: ${alphaVariantLabel(alphaVariantKey(winner))} (${formatValue(stat.mean, cfg.fmt)} +/- ${formatValue(stat.ci || 0, cfg.fmt)})`;
    });
    return `<div class="mini-card">
      <div class="label">${htmlEscape(dataset)} ${htmlEscape(displaySize(size))}</div>
      <div class="value">${htmlEscape(cfg.label)} winners</div>
      <div class="detail">${htmlEscape(winners.join(' · '))}</div>
    </div>`;
  }).join('');
  el.innerHTML = selectedSlice + cards;
}

function renderRegimeCharts(regime) {
  const edmMetric = metricKey($(`${regime}EdmMetric`)?.value || 'fid_inception');
  const alphaMetric = metricKey($(`${regime}AlphaMetric`)?.value || 'plddt_mean');
  const alphaSize = $(`${regime}AlphaSize`)?.value || 'All';
  const edmRows = edmRowsForMode(regimeMode(regime));
  const alphaRows = ['CAMEO', 'ATLAS'].flatMap(dataset => alphaLineRows(dataset, alphaSize));
  const selected = renderSchedulerFilterPanel(regime, edmRows, alphaRows);
  renderSchedulerFilterPanel(regime, edmRows, alphaRows, `${regime}AlphaSchedulerFilters`, 'alpha');
  renderSchedulerFilterPanel(regime, edmRows, alphaRows, `${regime}EdmSchedulerFilters`, 'edm');
  const visibleEdmRows = edmRows.filter(row => selected.edm.includes(row.scheduler));
  renderAlphaChartContext(regime, alphaMetric, alphaSize, selected.alpha);
  linePlot(`${regime}EdmLinePlot`, visibleEdmRows, edmMetric, 'edm', `EDM ${regimeLabel(regime)}: ${metricConfig('edm', edmMetric).label} by NFE`);
  heatmapPlot(`${regime}EdmHeatmap`, visibleEdmRows, edmMetric, 'edm', `EDM ${regimeLabel(regime)} heatmap: ${metricConfig('edm', edmMetric).label}`);
  plotAlphaDataset(`${regime}CameoLinePlot`, 'CAMEO', alphaSize, alphaMetric, regime, selected.alpha);
  plotAlphaDataset(`${regime}AtlasLinePlot`, 'ATLAS', alphaSize, alphaMetric, regime, selected.alpha);
}

function renderHeroWorkflow() {
  renderSchedulerGuide();
  ['ode', 'sde'].forEach(regime => {
    renderRegimeTables(regime);
    renderRegimeCharts(regime);
  });
}

function explorerMetricConfig(key) {
  if (D.metrics.edm[key]) return D.metrics.edm[key];
  if (D.metrics.alphaflow[key]) return D.metrics.alphaflow[key];
  if (key === 'seq_len') return { label: 'Sequence length', direction: 'higher', fmt: '.1f' };
  return { label: key, direction: 'higher', fmt: '.3f' };
}

function explorerMetricLabel(key) {
  return explorerMetricConfig(key).label;
}

function explorerMetricSelectValue(key) {
  return `${key}|${explorerMetricLabel(key)}`;
}

function numericValue(value) {
  const x = Number(value);
  return Number.isFinite(x) ? x : null;
}

function nfeRegime(nfe) {
  const n = Number(nfe);
  if (!Number.isFinite(n)) return 'n/a';
  if (n <= 5) return 'low';
  if (n <= 10) return 'medium';
  return 'high';
}

function metricAvailableCount(row) {
  return EXPLORER_METRICS.reduce((sum, metric) => sum + (Number.isFinite(Number(row[metric])) ? 1 : 0), 0);
}

function edmEvidenceStream(row) {
  return row.entropy_mode === 'conditional_minus_marginal'
    ? 'supplemental EDM cond-marg'
    : 'main EDM';
}

function alphaEvidenceStream(row) {
  if (row.schedule_family === ALPHA_SPOTLIGHT_FAMILY && row.scheduler === 'entropic_log1p') return 'supplemental AlphaFlow log1p';
  if (row.schedule_family === ALPHA_SPOTLIGHT_FAMILY) return 'main AlphaFlow cond-marg';
  return 'main AlphaFlow standard comparator';
}

function normalizedExplorerRows() {
  if (explorerRowsCache) return explorerRowsCache;
  const edmRows = (D.raw.edm || [])
    .map((row, index) => {
      const cleaned = {
        row_uid: `edm-${index}`,
        domain: 'EDM',
        source_run: 'run40',
        source_table: 'run40_edm_all_metrics.csv',
        evidence_stream: edmEvidenceStream(row),
        main_evidence: row.entropy_mode === 'conditional_minus_marginal' ? 'supplemental' : 'main',
        sampler_regime: solverLabel(row.mode),
        dataset: 'CIFAR-10',
        protein_size: 'n/a',
        schedule_family: row.entropy_mode || 'standard',
        scheduler: schedulerLabel(row.scheduler),
        scheduler_key: row.scheduler,
        nfe: Number(row.n_steps),
        nfe_regime: nfeRegime(row.n_steps),
        metric_family: 'image quality/runtime',
        protein: 'n/a',
        seed: row.seed,
        fid_inception: numericValue(row.fid_inception),
        fid_pixel: numericValue(row.fid_pixel),
        infer_seconds: numericValue(row.infer_seconds),
        plddt_mean: null,
        diversity: null,
        rmsd_mean: null,
        invalid_rate: null,
        infer_seconds_per_output: null,
        seq_len: null
      };
      cleaned.metric_available_count = metricAvailableCount(cleaned);
      return cleaned;
    });
  const alphaRows = (D.raw.alphaflow || [])
    .filter(isAlphaDisplayRow)
    .map((row, index) => {
      const cleaned = {
        row_uid: `alphaflow-${index}`,
        domain: 'AlphaFlow',
        source_run: 'run41',
        source_table: 'run41_alphaflow_all_metrics.csv',
        evidence_stream: alphaEvidenceStream(row),
        main_evidence: row.schedule_family === ALPHA_SPOTLIGHT_FAMILY && row.scheduler === 'entropic_log1p' ? 'supplemental' : 'main',
        sampler_regime: 'Protein flow endpoint',
        dataset: row.dataset_group,
        protein_size: row.size_group,
        schedule_family: alphaFamilyLabel(row.schedule_family),
        scheduler: alphaVariantLabelFromRecord(row),
        scheduler_key: row.scheduler,
        nfe: Number(row.n_steps),
        nfe_regime: nfeRegime(row.n_steps),
        metric_family: 'protein endpoint/runtime',
        protein: row.sample_name,
        seed: row.seed,
        fid_inception: null,
        fid_pixel: null,
        infer_seconds: null,
        plddt_mean: numericValue(row.plddt_mean),
        diversity: numericValue(row.diversity),
        rmsd_mean: numericValue(row.rmsd_mean),
        invalid_rate: numericValue(row.invalid_rate),
        infer_seconds_per_output: numericValue(row.infer_seconds_per_output),
        seq_len: numericValue(row.seq_len)
      };
      cleaned.metric_available_count = metricAvailableCount(cleaned);
      return cleaned;
    });
  explorerRowsCache = [...edmRows, ...alphaRows];
  return explorerRowsCache;
}

function selectedExplorerMetric() {
  return pivotState.values[0] || metricKey($('explorerMetric')?.value || 'plddt_mean');
}

function explorerDomainRows() {
  const domain = $('explorerDomain')?.value || 'AlphaFlow';
  return normalizedExplorerRows().filter(row => domain === 'All' || row.domain === domain);
}

function explorerFilterLabel(field) {
  return EXPLORER_FILTER_FIELDS.find(item => item.key === field)?.label || field;
}

function explorerFilterValue(row, field) {
  const value = row[field];
  return value === null || value === undefined || value === '' ? 'n/a' : String(value);
}

function explorerFilterValues(rows, field) {
  return sortKeys(unique(rows.map(row => explorerFilterValue(row, field))));
}

function syncExplorerFilterState(baseRows) {
  const synced = {};
  EXPLORER_FILTER_FIELDS.forEach(({ key }) => {
    const values = explorerFilterValues(baseRows, key);
    const state = explorerFilterState[key] || { known: [], selected: [] };
    const previousKnown = new Set(state.known || []);
    if (!state.known?.length && !state.selected?.length) {
      state.selected = [...values];
    } else {
      const valueSet = new Set(values);
      const kept = (state.selected || []).filter(value => valueSet.has(value));
      const additions = values.filter(value => !previousKnown.has(value));
      state.selected = [...kept, ...additions];
    }
    state.known = [...values];
    explorerFilterState[key] = state;
    synced[key] = state;
  });
  return synced;
}

function applyExplorerFilters(rows) {
  return rows.filter(row => EXPLORER_FILTER_FIELDS.every(({ key }) => {
    const state = explorerFilterState[key];
    if (!state || !state.known?.length) return true;
    return (state.selected || []).includes(explorerFilterValue(row, key));
  }));
}

function activeExplorerFilterCount() {
  return EXPLORER_FILTER_FIELDS.reduce((sum, { key }) => {
    const state = explorerFilterState[key];
    if (!state) return sum;
    return sum + Math.max(0, (state.known || []).length - (state.selected || []).length);
  }, 0);
}

function setExplorerFilterValue(field, value, checked) {
  const state = explorerFilterState[field] || { known: [], selected: [] };
  const selected = new Set(state.selected || []);
  if (checked) selected.add(value);
  else selected.delete(value);
  state.selected = (state.known || []).filter(item => selected.has(item));
  explorerFilterState[field] = state;
  renderExplorer();
}

function setAllExplorerFilterValues(field, checked) {
  const state = explorerFilterState[field] || { known: [], selected: [] };
  state.selected = checked ? [...(state.known || [])] : [];
  explorerFilterState[field] = state;
  renderExplorer();
}

function renderExplorerFilters(baseRows) {
  const el = $('explorerFilters');
  if (!el) return;
  const state = syncExplorerFilterState(baseRows);
  el.innerHTML = EXPLORER_FILTER_FIELDS.map(({ key, label }) => {
    const values = state[key]?.known || [];
    const selected = new Set(state[key]?.selected || []);
    const options = values.map(value => `
      <label class="explorer-filter-option" title="${htmlEscape(value)}">
        <input type="checkbox" data-explorer-filter-field="${htmlEscape(key)}" data-explorer-filter-value="${htmlEscape(value)}" ${selected.has(value) ? 'checked' : ''}>
        <span>${htmlEscape(value)}</span>
      </label>
    `).join('');
    return `<div class="explorer-filter-card">
      <div class="explorer-filter-head">
        <span>${htmlEscape(label)}</span>
        <span class="explorer-filter-count">${selected.size}/${values.length}</span>
        <span class="explorer-filter-actions">
          <button type="button" data-explorer-filter-field="${htmlEscape(key)}" data-explorer-filter-action="all">All</button>
          <button type="button" data-explorer-filter-field="${htmlEscape(key)}" data-explorer-filter-action="none">None</button>
        </span>
      </div>
      <div class="explorer-filter-options">${options || '<span class="weak">No values</span>'}</div>
    </div>`;
  }).join('');
  el.querySelectorAll('input[data-explorer-filter-value]').forEach(input => {
    input.addEventListener('change', () => {
      setExplorerFilterValue(input.dataset.explorerFilterField, input.dataset.explorerFilterValue, input.checked);
    });
  });
  el.querySelectorAll('button[data-explorer-filter-action]').forEach(button => {
    button.addEventListener('click', () => {
      setAllExplorerFilterValues(button.dataset.explorerFilterField, button.dataset.explorerFilterAction === 'all');
    });
  });
}

function finiteMetricRows(rows, metric) {
  return rows.filter(row => Number.isFinite(Number(row[metric])));
}

function groupKey(row, fields) {
  if (!fields.length) return 'All';
  return fields.map(field => row[field] ?? 'n/a').join('\u001f');
}

function keyLabel(key) {
  return String(key).split('\u001f').join(' / ');
}

function sortKeys(keys) {
  return [...keys].sort((a, b) => {
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  });
}

function aggregateValues(values, agg) {
  const nums = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  const n = nums.length;
  if (agg === 'count') return { value: n, ci: null, n };
  if (!n) return { value: null, ci: null, n: 0 };
  const mean = nums.reduce((sum, value) => sum + value, 0) / n;
  const std = n > 1
    ? Math.sqrt(nums.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (n - 1))
    : 0;
  const ci = agg === 'mean' && n > 1 ? 1.96 * std / Math.sqrt(n) : null;
  if (agg === 'sum') return { value: nums.reduce((sum, value) => sum + value, 0), ci: null, n };
  if (agg === 'min') return { value: nums[0], ci: null, n };
  if (agg === 'max') return { value: nums[nums.length - 1], ci: null, n };
  if (agg === 'median') {
    const mid = Math.floor(nums.length / 2);
    return { value: nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2, ci: null, n };
  }
  return { value: mean, ci, n };
}

function pivotAggregate(rows, rowFields, colFields, metric, agg) {
  const rowKeys = new Set();
  const colKeys = new Set();
  const buckets = new Map();
  rows.forEach(row => {
    const rKey = groupKey(row, rowFields);
    const cKey = groupKey(row, colFields);
    rowKeys.add(rKey);
    colKeys.add(cKey);
    const bucketKey = `${rKey}\u001e${cKey}`;
    if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
    buckets.get(bucketKey).push(row[metric]);
  });
  const values = {};
  buckets.forEach((bucketValues, key) => {
    values[key] = aggregateValues(bucketValues, agg);
  });
  return { rowKeys: sortKeys([...rowKeys]), colKeys: sortKeys([...colKeys]), values };
}

function pivotCellValue(pivot, rowKey, colKey) {
  return pivot.values[`${rowKey}\u001e${colKey}`];
}

function pivotStatNumber(stat) {
  const value = stat && typeof stat === 'object' ? stat.value : stat;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function pivotStatCi(stat) {
  const ci = stat && typeof stat === 'object' ? Number(stat.ci) : null;
  return Number.isFinite(ci) ? ci : null;
}

function pivotStatSupport(stat) {
  const n = stat && typeof stat === 'object' ? Number(stat.n) : null;
  return Number.isFinite(n) && n > 0 ? n : null;
}

function formatExplorerValue(stat, metric, agg) {
  const value = pivotStatNumber(stat);
  if (value === null) return '<span class="weak">n/a</span>';
  if (agg === 'count') return formatInt(value);
  const cfg = explorerMetricConfig(metric);
  const ci = pivotStatCi(stat);
  const ciText = agg === 'mean' && ci !== null ? `<span class="ci">± ${formatValue(ci, cfg.fmt)}</span>` : '';
  const n = pivotStatSupport(stat);
  const support = n !== null ? `<span class="n">n=${formatInt(n)}</span>` : '';
  return `${formatValue(value, cfg.fmt)}${ciText}${support}`;
}

function formatExplorerHover(stat, metric, agg) {
  const value = pivotStatNumber(stat);
  if (value === null) return 'n/a';
  if (agg === 'count') return `Count: ${formatInt(value)}`;
  const cfg = explorerMetricConfig(metric);
  const label = agg === 'mean' ? 'Mean' : agg.replace(/\b\w/g, c => c.toUpperCase());
  const ci = pivotStatCi(stat);
  const ciText = agg === 'mean' && ci !== null ? ` ± ${formatValue(ci, cfg.fmt)}` : '';
  const n = pivotStatSupport(stat);
  const support = n !== null ? `<br>n=${formatInt(n)}` : '';
  return `${label} ${htmlEscape(cfg.label)}: ${formatValue(value, cfg.fmt)}${ciText}${support}`;
}

function formatExplorerHeatmapText(stat, metric, agg) {
  const value = pivotStatNumber(stat);
  if (value === null) return '';
  if (agg === 'count') return formatInt(value);
  const cfg = explorerMetricConfig(metric);
  const ci = pivotStatCi(stat);
  return agg === 'mean' && ci !== null
    ? `${formatValue(value, cfg.fmt)}<br>± ${formatValue(ci, cfg.fmt)}`
    : formatValue(value, cfg.fmt);
}

function renderPivotSummary(rows, metric, rowFields, colFields) {
  const summary = $('pivotSummary');
  if (!summary) return;
  const domain = $('explorerDomain')?.value || 'AlphaFlow';
  const metricRows = finiteMetricRows(rows, metric);
  summary.innerHTML = [
    ['Domain', domain, `${formatInt(rows.length)} rows after active filters`],
    ['Filters', `${formatInt(activeExplorerFilterCount())} removed`, 'checkbox filters update every tab'],
    ['Metric rows', formatInt(metricRows.length), explorerMetricLabel(metric)],
    ['Rows shelf', rowFields.map(field => EXPLORER_DIMENSIONS.find(item => item.key === field)?.label || field).join(' / ') || 'All rows', 'drag dimensions to change grouping'],
    ['Columns shelf', colFields.map(field => EXPLORER_DIMENSIONS.find(item => item.key === field)?.label || field).join(' / ') || 'All columns', 'tabs reuse the same pivot state']
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
}

function countBy(rows, field) {
  const counts = {};
  rows.forEach(row => {
    const key = explorerFilterValue(row, field);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function renderCleanedDataOverview(baseRows, rows, metric) {
  const el = $('cleanedDataOverview');
  if (!el) return;
  const domains = countBy(rows, 'domain');
  const main = rows.filter(row => row.main_evidence === 'main').length;
  const supplemental = rows.length - main;
  const finiteRows = finiteMetricRows(rows, metric).length;
  el.innerHTML = [
    ['Cleaned rows', formatInt(rows.length), `${formatInt(baseRows.length)} rows in selected domain before checkbox filters`],
    ['Domain split', Object.entries(domains).map(([k, v]) => `${k}: ${formatInt(v)}`).join(' · ') || 'n/a', 'EDM and AlphaFlow use one normalized schema'],
    ['Evidence split', `${formatInt(main)} main · ${formatInt(supplemental)} supplemental`, 'Supplemental rows are visible but labeled, not mixed into headline claims'],
    ['Active metric coverage', formatInt(finiteRows), `${explorerMetricLabel(metric)} has finite values in the filtered rows`]
  ].map(([label, value, detail]) => `<div class="mini-card"><div class="label">${htmlEscape(label)}</div><div class="value">${htmlEscape(value)}</div><div class="detail">${htmlEscape(detail)}</div></div>`).join('');
}

function renderCleanedDataSchema() {
  const el = $('cleanedDataSchema');
  if (!el) return;
  const cards = [
    ['Split', 'Rows are split by domain, source run, source table, evidence stream, main/supplemental status, dataset, scheduler, NFE, and protein-size bin.'],
    ['Clean', 'Numeric metric fields are parsed once; missing cross-domain metrics are explicit nulls, so EDM and AlphaFlow can share one pivot table.'],
    ['Guardrails', 'EDM conditional-minus-marginal and AlphaFlow log1p rows remain inspectable as supplemental evidence rather than headline evidence.'],
    ['Live charts', 'The pivot table, raw table, bar chart, heatmap, split chart, and metric-completeness chart all update from the same active filters.']
  ];
  el.innerHTML = cards.map(([title, text]) => `<article class="cleaned-schema-card"><h3>${htmlEscape(title)}</h3><p>${htmlEscape(text)}</p></article>`).join('');
}

function renderRawDataPlots(rows) {
  const splitDiv = 'rawSplitPlot';
  const completenessDiv = 'rawCompletenessPlot';
  if (!rows.length) {
    showPlotNotice(splitDiv, 'No cleaned rows match the active filters.');
    showPlotNotice(completenessDiv, 'No cleaned rows match the active filters.');
    return;
  }

  const domains = sortKeys(unique(rows.map(row => row.domain)));
  const streams = sortKeys(unique(rows.map(row => row.evidence_stream)));
  const streamTraces = domains.map(domain => ({
    type: 'bar',
    name: domain,
    x: streams,
    y: streams.map(stream => rows.filter(row => row.domain === domain && row.evidence_stream === stream).length)
  }));
  Plotly.newPlot(
    splitDiv,
    streamTraces,
    { ...plotLayout('Cleaned row split by evidence stream', 'evidence stream', 'rows'), barmode: 'stack' },
    { responsive: true, displaylogo: false }
  );

  const metricCounts = EXPLORER_METRICS.map(metric => ({
    metric,
    count: finiteMetricRows(rows, metric).length
  })).filter(item => item.count > 0);
  Plotly.newPlot(
    completenessDiv,
    [{
      type: 'bar',
      x: metricCounts.map(item => explorerMetricLabel(item.metric)),
      y: metricCounts.map(item => item.count),
      marker: { color: metricCounts.map(item => item.metric === selectedExplorerMetric() ? BEST_HIGHLIGHT_COLOR : '#cbd5e1') }
    }],
    plotLayout('Metric availability after filters', 'metric', 'finite rows'),
    { responsive: true, displaylogo: false }
  );
}

function renderPivotTableView(rows, metric, agg) {
  const el = $('pivotTable');
  if (!el) return;
  const rowFields = pivotState.rows;
  const colFields = pivotState.cols;
  const metricRows = finiteMetricRows(rows, metric);
  if (!metricRows.length) {
    el.innerHTML = '<p class="notice">No numeric rows are available for the selected domain and metric.</p>';
    return;
  }
  const pivot = pivotAggregate(metricRows, rowFields, colFields, metric, agg);
  const rowKeys = pivot.rowKeys.slice(0, 140);
  const colKeys = pivot.colKeys.slice(0, 60);
  const rowHead = rowFields.length ? rowFields.map(field => htmlEscape(field)).join(' / ') : 'Rows';
  let html = `<table><thead><tr><th>${rowHead}</th>${colKeys.map(key => `<th>${htmlEscape(keyLabel(key))}</th>`).join('')}</tr></thead><tbody>`;
  rowKeys.forEach(rowKey => {
    html += `<tr><td>${htmlEscape(keyLabel(rowKey))}</td>${colKeys.map(colKey => `<td>${formatExplorerValue(pivotCellValue(pivot, rowKey, colKey), metric, agg)}</td>`).join('')}</tr>`;
  });
  html += '</tbody></table>';
  const truncated = pivot.rowKeys.length > rowKeys.length || pivot.colKeys.length > colKeys.length
    ? `<p class="notice">Showing ${formatInt(rowKeys.length)} of ${formatInt(pivot.rowKeys.length)} row groups and ${formatInt(colKeys.length)} of ${formatInt(pivot.colKeys.length)} column groups.</p>`
    : '';
  el.innerHTML = truncated + html;
}

function renderPivotBarChart(rows, metric, agg) {
  const divId = 'pivotBarPlot';
  const metricRows = finiteMetricRows(rows, metric);
  if (!metricRows.length) {
    showPlotNotice(divId, 'No numeric rows are available for the selected domain and metric.');
    return;
  }
  const groupFields = pivotState.rows.length ? pivotState.rows : ['scheduler'];
  const grouped = pivotAggregate(metricRows, groupFields, [], metric, agg);
  const cfg = explorerMetricConfig(metric);
  const items = grouped.rowKeys.map(key => ({
    key,
    stat: pivotCellValue(grouped, key, 'All')
  })).map(item => ({
    ...item,
    value: pivotStatNumber(item.stat),
    ci: pivotStatCi(item.stat)
  })).filter(item => item.value !== null);
  items.sort((a, b) => cfg.direction === 'lower' ? a.value - b.value : b.value - a.value);
  const visible = items.slice(0, 30).reverse();
  const showCi = agg === 'mean' && visible.some(item => item.ci !== null);
  const trace = {
    type: 'bar',
    orientation: 'h',
    x: visible.map(item => item.value),
    y: visible.map(item => keyLabel(item.key)),
    text: visible.map(item => formatExplorerHover(item.stat, metric, agg)),
    hovertemplate: '%{y}<br>%{text}<extra></extra>',
    marker: {
      color: visible.map(item => item.key === items[0]?.key ? BEST_HIGHLIGHT_COLOR : '#cbd5e1'),
      line: {
        color: visible.map(item => item.key === items[0]?.key ? '#3d2b00' : '#94a3b8'),
        width: visible.map(item => item.key === items[0]?.key ? 1.8 : 0.8)
      }
    }
  };
  if (showCi) {
    trace.error_x = {
      type: 'data',
      array: visible.map(item => item.ci || 0),
      visible: true,
      thickness: 1,
      color: '#667085'
    };
  }
  Plotly.newPlot(divId, [{
    ...trace
  }], plotLayout(`Pivot bar chart: ${metricKey($('explorerAgg')?.value || 'mean')} ${cfg.label}`, cfg.label, groupFields.join(' / ')), { responsive: true, displaylogo: false });
}

function renderPivotHeatmapChart(rows, metric, agg) {
  const divId = 'pivotHeatmapPlot';
  const metricRows = finiteMetricRows(rows, metric);
  if (!metricRows.length) {
    showPlotNotice(divId, 'No numeric rows are available for the selected domain and metric.');
    return;
  }
  const rowFields = pivotState.rows.length ? pivotState.rows : ['scheduler'];
  const colFields = pivotState.cols.length ? pivotState.cols : ['nfe'];
  const pivot = pivotAggregate(metricRows, rowFields, colFields, metric, agg);
  const yKeys = pivot.rowKeys.slice(0, 40);
  const xKeys = pivot.colKeys.slice(0, 30);
  const stats = yKeys.map(rowKey => xKeys.map(colKey => pivotCellValue(pivot, rowKey, colKey)));
  const z = stats.map(row => row.map(stat => pivotStatNumber(stat)));
  const hover = stats.map(row => row.map(stat => formatExplorerHover(stat, metric, agg)));
  const cellCount = yKeys.length * xKeys.length;
  const cfg = explorerMetricConfig(metric);
  const trace = {
    type: 'heatmap',
    x: xKeys.map(keyLabel),
    y: yKeys.map(keyLabel),
    z,
    customdata: hover,
    hovertemplate: `${htmlEscape(rowFields.join(' / ') || 'Rows')}: %{y}<br>${htmlEscape(colFields.join(' / ') || 'Columns')}: %{x}<br>%{customdata}<extra></extra>`,
    colorscale: HEATMAP_VALUE_SCALE,
    colorbar: { title: cfg.label }
  };
  if (cellCount <= 120) {
    trace.text = stats.map(row => row.map(stat => formatExplorerHeatmapText(stat, metric, agg)));
    trace.texttemplate = '%{text}';
    trace.textfont = { size: 10 };
  }
  const direction = agg === 'count' ? 'higher' : cfg.direction;
  const traces = [trace, bestHeatmapOverlayTrace(z, xKeys.map(keyLabel), yKeys.map(keyLabel), direction, trace.text)].filter(Boolean);
  Plotly.newPlot(divId, traces, plotLayout(`Pivot heatmap: ${metricKey($('explorerAgg')?.value || 'mean')} ${cfg.label}`, colFields.join(' / '), rowFields.join(' / ')), { responsive: true, displaylogo: false });
}

function renderExplorerRawRows(rows) {
  const el = $('rawTable');
  if (!el) return;
  const q = $('rawSearch')?.value.trim().toLowerCase() || '';
  const allFiltered = rows.filter(row => !q || JSON.stringify(row).toLowerCase().includes(q));
  const filtered = allFiltered.slice(0, 10);
  if (!filtered.length) {
    el.innerHTML = '<p class="notice">No raw rows match the current domain and search filter.</p>';
    return;
  }
  const metricCols = EXPLORER_METRICS.filter(metric => filtered.some(row => row[metric] !== null && row[metric] !== undefined));
  const cols = ['row_uid', 'domain', 'source_run', 'source_table', 'evidence_stream', 'main_evidence', 'sampler_regime', 'dataset', 'protein_size', 'schedule_family', 'scheduler', 'nfe_regime', 'nfe', 'protein', 'seed', 'metric_available_count', ...metricCols];
  let html = '<table><thead><tr>' + cols.map(col => `<th>${htmlEscape(col)}</th>`).join('') + '</tr></thead><tbody>';
  filtered.forEach(row => {
    html += '<tr>' + cols.map(col => `<td>${formatRawValue(row[col])}</td>`).join('') + '</tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = `<div class="raw-row-limit-note">Showing 10 of ${formatInt(allFiltered.length)} filtered cleaned rows.</div>${html}`;
}

function renderRawPreviewTable() {
  const el = $('rawPreviewTable');
  if (!el) return;
  const rows = normalizedExplorerRows().slice(0, 10);
  if (!rows.length) {
    el.innerHTML = '<p class="notice">No cleaned rows are available.</p>';
    return;
  }
  const metricCols = EXPLORER_METRICS.filter(metric => rows.some(row => row[metric] !== null && row[metric] !== undefined));
  const cols = ['row_uid', 'domain', 'source_run', 'source_table', 'main_evidence', 'sampler_regime', 'dataset', 'protein_size', 'scheduler', 'nfe_regime', 'nfe', 'protein', ...metricCols];
  let html = '<table><thead><tr>' + cols.map(col => `<th>${htmlEscape(col)}</th>`).join('') + '</tr></thead><tbody>';
  rows.forEach(row => {
    html += '<tr>' + cols.map(col => `<td>${formatRawValue(row[col])}</td>`).join('') + '</tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = `<div class="raw-row-limit-note">Showing 10 of ${formatInt(normalizedExplorerRows().length)} cleaned rows.</div>${html}`;
}

function updateExplorerTabs() {
  const tabs = $('explorerTabs');
  if (!tabs) return;
  tabs.querySelectorAll('[data-explorer-tab]').forEach(button => {
    button.classList.toggle('active', button.dataset.explorerTab === activeExplorerTab);
  });
  ['Pivot', 'Bar', 'Heatmap', 'Raw'].forEach(name => {
    const panel = $(`explorer${name}Panel`);
    if (panel) panel.classList.toggle('active', name.toLowerCase() === activeExplorerTab);
  });
}

function renderExplorer() {
  const baseRows = explorerDomainRows();
  renderExplorerFilters(baseRows);
  const rows = applyExplorerFilters(baseRows);
  const metric = selectedExplorerMetric();
  const agg = metricKey($('explorerAgg')?.value || 'mean');
  renderCleanedDataOverview(baseRows, rows, metric);
  renderCleanedDataSchema();
  renderRawDataPlots(rows);
  renderPivotSummary(rows, metric, pivotState.rows, pivotState.cols);
  updateExplorerTabs();
  if (activeExplorerTab === 'pivot') renderPivotTableView(rows, metric, agg);
  if (activeExplorerTab === 'bar') renderPivotBarChart(rows, metric, agg);
  if (activeExplorerTab === 'heatmap') renderPivotHeatmapChart(rows, metric, agg);
  if (activeExplorerTab === 'raw') renderExplorerRawRows(rows);
}

function setExplorerMetric(metric) {
  const select = $('explorerMetric');
  if (select) select.value = explorerMetricSelectValue(metric);
  pivotState.values = [metric];
  if (pivotUi) pivotUi.setState({ ...pivotState });
  else renderExplorer();
}

function resetExplorerForDomain() {
  explorerFilterState = {};
  const domain = $('explorerDomain')?.value || 'AlphaFlow';
  if (domain === 'EDM') {
    pivotState = { rows: ['sampler_regime', 'scheduler'], cols: ['nfe'], values: ['fid_inception'] };
    setExplorerMetric('fid_inception');
    return;
  }
  pivotState = { rows: ['dataset', 'scheduler'], cols: ['nfe'], values: ['plddt_mean'] };
  setExplorerMetric('plddt_mean');
}

function initPivotExplorer() {
  const root = $('pivotBuilder');
  if (!root || !window.PivotLite) return;
  const fields = [
    ...EXPLORER_DIMENSIONS,
    ...EXPLORER_METRICS.map(metric => ({ key: metric, label: explorerMetricLabel(metric), type: 'metric' }))
  ];
  pivotUi = window.PivotLite.create({
    root,
    fields,
    initial: pivotState,
    onChange: state => {
      pivotState = state;
      const metric = selectedExplorerMetric();
      const select = $('explorerMetric');
      if (select && select.value !== explorerMetricSelectValue(metric)) select.value = explorerMetricSelectValue(metric);
      renderExplorer();
    }
  });
}

function rawDataDownloadPayload() {
  return {
    generated_at: new Date().toISOString(),
    site_generated_at: D.metadata.generated_at,
    sources: {
      edm: D.metadata.edm_source,
      alphaflow: D.metadata.alphaflow_source,
    },
    source_status: D.metadata.source_status || {},
    cleaned_rows: normalizedExplorerRows(),
    raw_tables: D.raw || {},
  };
}

function downloadRawData() {
  const payload = rawDataDownloadPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = String(D.metadata.generated_at || new Date().toISOString()).replace(/[:T]/g, '-').slice(0, 19);
  const link = document.createElement('a');
  link.href = url;
  link.download = `entropic_scheduler_raw_data_${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const VISUAL_ASSET_RE = /\.(png|jpe?g|gif|webp|svg|pdf)(?:[?#].*)?$/i;
let lazyPreviewObserver = null;

function loadLazyPreviewFrame(frame) {
  const src = frame?.getAttribute('data-lazy-preview-src');
  if (!src || frame.getAttribute('src')) return;
  const pane = frame.closest('.tarchic-chart-preview, .pdf-viewer-pane');
  pane?.classList.add('preview-loading');
  frame.addEventListener('load', () => {
    pane?.classList.remove('preview-loading');
    pane?.classList.add('preview-loaded');
  }, { once: true });
  frame.setAttribute('src', src);
  frame.removeAttribute('data-lazy-preview-src');
}

function lazyPreviewFrameObserver() {
  if (lazyPreviewObserver || typeof IntersectionObserver === 'undefined') return lazyPreviewObserver;
  lazyPreviewObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      lazyPreviewObserver.unobserve(entry.target);
      loadLazyPreviewFrame(entry.target);
    });
  }, {
    rootMargin: '900px 0px',
    threshold: 0.01
  });
  return lazyPreviewObserver;
}

function hydrateLazyPreviewFrames(root = document) {
  const frames = [...root.querySelectorAll('iframe[data-lazy-preview-src]')];
  if (!frames.length) return;
  const observer = lazyPreviewFrameObserver();
  if (!observer) {
    frames.forEach(loadLazyPreviewFrame);
    return;
  }
  frames.forEach(frame => observer.observe(frame));
}

function visualAssetKind(src) {
  const clean = String(src || '').split('#')[0].split('?')[0].toLowerCase();
  return clean.endsWith('.pdf') ? 'pdf' : 'image';
}

function visualAssetModalSrc(src) {
  if (visualAssetKind(src) !== 'pdf') return src;
  const clean = String(src || '').split('#')[0];
  return `${clean}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
}

function visualElementTitle(el, fallback = 'Expanded visual asset') {
  const explicit = (el.getAttribute('data-visual-title') || el.getAttribute('alt') || el.getAttribute('title') || '').trim();
  if (explicit) return explicit;
  const card = el.closest('article, .panel, section');
  const heading = card?.querySelector('h4, h3, h2');
  if (heading?.textContent?.trim()) return heading.textContent.trim();
  const text = el.textContent?.trim();
  return text || fallback;
}

function visualTargetFromEventTarget(target) {
  const control = target.closest('[data-visual-src]');
  if (control) {
    return {
      src: control.getAttribute('data-visual-src'),
      title: visualElementTitle(control),
      origin: control.getAttribute('data-origin-key') || ''
    };
  }
  const link = target.closest('a[href]');
  const href = link?.getAttribute('href') || '';
  if (href && VISUAL_ASSET_RE.test(href)) {
    return {
      src: href,
      title: visualElementTitle(link),
      origin: link.getAttribute('data-origin-key') || ''
    };
  }
  const img = target.closest('img');
  if (img) {
    return {
      src: img.getAttribute('src') || img.currentSrc || img.src,
      title: visualElementTitle(img, 'Expanded image'),
      origin: img.getAttribute('data-origin-key') || ''
    };
  }
  return null;
}

function openVisualLightbox({ src, title: displayTitle, origin }) {
  const lightbox = $('imageLightbox');
  const panel = lightbox?.querySelector('.image-lightbox-panel');
  const modalImage = $('imageLightboxImage');
  const modalFrame = $('imageLightboxFrame');
  const titleEl = $('imageLightboxTitle');
  const originEl = $('imageLightboxOrigin');
  const path = $('imageLightboxPath');
  const close = $('imageLightboxClose');
  if (!lightbox || !panel || !modalImage || !modalFrame || !src) return;
  const kind = visualAssetKind(src);
  const originKey = origin || assetOrigin(src);
  panel.classList.toggle('show-frame', kind === 'pdf');
  if (kind === 'pdf') {
    modalImage.removeAttribute('src');
    modalImage.alt = '';
    modalFrame.src = visualAssetModalSrc(src);
  } else {
    modalFrame.removeAttribute('src');
    modalImage.src = src;
    modalImage.alt = displayTitle || '';
  }
  titleEl.textContent = displayTitle || 'Expanded visual asset';
  if (originEl) {
    originEl.textContent = `origin: ${ORIGIN_LABELS[originKey] || originKey}`;
    originEl.className = `origin-badge ${originClass(originKey)}`;
    originEl.setAttribute('data-origin-key', originKey);
  }
  path.textContent = src.startsWith('data:') ? '' : artifactRefPath(src);
  lightbox.hidden = false;
  document.body.classList.add('lightbox-open');
  close?.focus();
}

function closeImageLightbox() {
  const lightbox = $('imageLightbox');
  const panel = lightbox?.querySelector('.image-lightbox-panel');
  const modalImage = $('imageLightboxImage');
  const modalFrame = $('imageLightboxFrame');
  const originEl = $('imageLightboxOrigin');
  if (!lightbox) return;
  lightbox.hidden = true;
  panel?.classList.remove('show-frame');
  document.body.classList.remove('lightbox-open');
  if (modalImage) {
    modalImage.removeAttribute('src');
    modalImage.alt = '';
  }
  if (modalFrame) modalFrame.removeAttribute('src');
  if (originEl) {
    originEl.textContent = '';
    originEl.removeAttribute('data-origin-key');
  }
}

function wireImageLightbox() {
  const lightbox = $('imageLightbox');
  const panel = lightbox?.querySelector('.image-lightbox-panel');
  const close = $('imageLightboxClose');
  if (close) close.addEventListener('click', closeImageLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      if (panel?.contains(event.target)) return;
      closeImageLightbox();
    });
  }
  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('#imageLightbox')) return;
    const visualTarget = visualTargetFromEventTarget(event.target);
    if (!visualTarget?.src) return;
    event.preventDefault();
    openVisualLightbox(visualTarget);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !$('imageLightbox')?.hidden) closeImageLightbox();
  });
}

function wireEvents() {
  const bind = (id, event, handler) => {
    const el = $(id);
    if (el) el.addEventListener(event, handler);
  };
  ['odeEdmMetric', 'odeAlphaMetric'].forEach(id => bind(id, 'change', () => renderRegimeCharts('ode')));
  ['sdeEdmMetric', 'sdeAlphaMetric'].forEach(id => bind(id, 'change', () => renderRegimeCharts('sde')));
  bind('odeAlphaSize', 'change', () => setProteinSizeFilter($('odeAlphaSize').value));
  bind('sdeAlphaSize', 'change', () => setProteinSizeFilter($('sdeAlphaSize').value));
  document.querySelectorAll('[data-protein-size-filter]').forEach(button => {
    button.addEventListener('click', () => setProteinSizeFilter(button.getAttribute('data-protein-size-filter')));
  });
  ['run40FigureKind'].forEach(id => bind(id, 'change', renderRun40EdmAtlas));
  ['run40FigureSearch'].forEach(id => bind(id, 'input', renderRun40EdmAtlas));
  ['run41AlphaDataset', 'run41AlphaFamily', 'run41AlphaMetric', 'run41AlphaNfe'].forEach(id => bind(id, 'change', renderRun41AlphaPlots));
  ['figureTag'].forEach(id => bind(id, 'change', renderFigureGallery));
  ['figureSearch'].forEach(id => bind(id, 'input', renderFigureGallery));
  ['evidenceDomain'].forEach(id => bind(id, 'change', renderEvidenceLeaderboard));
  ['leaderboardSearch'].forEach(id => bind(id, 'input', renderEvidenceLeaderboard));
  ['evidenceTableGroup', 'evidenceTableSelect'].forEach(id => bind(id, 'change', renderEvidenceTables));
  ['evidenceTableSearch'].forEach(id => bind(id, 'input', renderEvidenceTables));
  ['paperTableGroup'].forEach(id => bind(id, 'change', renderPaperTables));
  ['paperTableSearch'].forEach(id => bind(id, 'input', renderPaperTables));
  ['tarchicAtlasRun', 'tarchicAtlasCategory'].forEach(id => bind(id, 'change', renderTarchicChartAtlas));
  ['tarchicAtlasSearch'].forEach(id => bind(id, 'input', renderTarchicChartAtlas));
  ['deltaDomain', 'deltaSampler', 'deltaDataset', 'deltaSize', 'deltaMetric', 'deltaStatus'].forEach(id => bind(id, 'change', renderDeltas));
  ['deltaSearch'].forEach(id => bind(id, 'input', renderDeltas));
  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('#downloadRawData') : null;
    if (!button) return;
    event.preventDefault();
    downloadRawData();
  });
  bind('explorerDomain', 'change', resetExplorerForDomain);
  bind('explorerMetric', 'change', () => setExplorerMetric(metricKey($('explorerMetric').value)));
  bind('explorerAgg', 'change', renderExplorer);
  bind('rawSearch', 'input', renderExplorer);
  const tabs = $('explorerTabs');
  if (tabs) {
    tabs.querySelectorAll('[data-explorer-tab]').forEach(button => {
      button.addEventListener('click', () => {
        activeExplorerTab = button.dataset.explorerTab;
        renderExplorer();
      });
    });
  }
  const rawDetails = document.querySelector('.raw-data-details');
  if (rawDetails) {
    rawDetails.addEventListener('toggle', () => {
      if (!rawDetails.open) return;
      renderExplorer();
      requestAnimationFrame(() => {
        ['rawSplitPlot', 'rawCompletenessPlot', 'pivotBarPlot', 'pivotHeatmapPlot'].forEach(id => {
          const el = $(id);
          if (el && window.Plotly?.Plots?.resize) window.Plotly.Plots.resize(el);
        });
      });
    });
  }
}

function main() {
  initControls();
  initPivotExplorer();
  wireEvents();
  wireImageLightbox();
  syncProteinSizeFilterControls();
  renderHeroWorkflow();
  renderOverallStrongTables();
  renderDeltas();
  renderTheoryValidationStatement();
  renderTheoryEvidenceCards();
  renderTarchicTheoryGallery();
  renderTarchicChartAtlas();
  renderKeyEvidence();
  renderRun40Run41Figures();
  renderFigureGallery();
  renderEvidence();
  renderPaperTables();
  renderRawPreviewTable();
  if (document.querySelector('.raw-data-details')?.open) renderExplorer();
}

main();
