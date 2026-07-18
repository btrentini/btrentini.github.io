(() => {
  if (window.__WaveMeshSingleton) return;           // prevent double init
  window.__WaveMeshSingleton = true;

  const CONFIG = {
    opacity: 0.70,
    lineWidth: 0.14,
    color: '255,255,255',
    points: 150,
    speed: 0.12,
    step: 0.09,
    fieldScale: 0.16,
    fade: 0.95,
    zMin: 0.49,
    zMax: 0.70,
    wobbleAmp: 3.0,
    wobbleFreq: 11.5,
    wobbleSpatial: 0.06,
    brownianFraction: 0.75,
    brownianStrength: 0.99,
    connectEnabled: true,
    connectPerFrame: 2,
    connectRadius: 150,
    connectRandomLongProb: 1e-7,
    connectLife: 950,
    connectWidth: 0.15,
    connectOpacity: 0.20
  };

  /* Mobile/perf guards */
  const isCoarse = matchMedia('(pointer: coarse)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const DPR_CAP  = isCoarse ? 1.5 : 2;              // lower cap on mobile

  /* State */
  const STRIDE = 3;                                 // [x,y,z] per agent
  let canvas, ctx;
  let viewW = 0, viewH = 0, dpr = 1;
  let worldW = 0, worldH = 0;                       // fixed world coords
  let scale = 1, offX = 0, offY = 0;                // cover transform

  let pos = null;                                   // Float32Array
  let links = [];                                   // {a,b,life}[]
  let brownCount = 0;
  let running = false, rafId = 0, t = 0;

  /* Utilities */
  const clamp = (v,a,b) => v < a ? a : (v > b ? b : v);
  const rand  = (min,max) => min + Math.random()*(max-min);
  const randInt = n => (Math.random()*n)|0;
  const smoothstep = x => x*x*(3-2*x);

  function hash(i,j,k){
    let n = (i|0)*15731 ^ (j|0)*789221 ^ (k|0)*1376312589;
    n = (n<<13) ^ n;
    return 1 - ((n*(n*n*15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824;
  }
  function noise3(x,y,z){
    const i0 = Math.floor(x), j0 = Math.floor(y), k0 = Math.floor(z);
    const fx = x - i0, fy = y - j0, fz = z - k0;
    const u = smoothstep(fx), v = smoothstep(fy), w = smoothstep(fz);
    const lerp = (a,b,t) => a + (b-a)*t;

    const v000 = hash(i0,   j0,   k0  ), v100 = hash(i0+1, j0,   k0  );
    const v010 = hash(i0,   j0+1, k0  ), v110 = hash(i0+1, j0+1, k0  );
    const v001 = hash(i0,   j0,   k0+1), v101 = hash(i0+1, j0,   k0+1);
    const v011 = hash(i0,   j0+1, k0+1), v111 = hash(i0+1, j0+1, k0+1);

    const x00 = lerp(v000, v100, u), x10 = lerp(v010, v110, u);
    const x01 = lerp(v001, v101, u), x11 = lerp(v011, v111, u);
    const y0  = lerp(x00,  x10,  v), y1  = lerp(x01,  x11,  v);
    return lerp(y0, y1, w);
  }
  const angleAt = (x,y,time) => noise3(x*CONFIG.fieldScale, y*CONFIG.fieldScale, time*CONFIG.fieldScale*0.3) * Math.PI * 2;

  /* Stable world: pick once (and on orientation changes) */
  function initWorld(){
    worldW = Math.max(1280, Math.min(1920, window.innerWidth));
    worldH = Math.max(800,  Math.min(1080, window.innerHeight));
    seed();
  }

  function seed(){
    const n = clamp(CONFIG.points|0, 1, 40000);
    pos = new Float32Array(n*STRIDE);
    brownCount = (CONFIG.brownianFraction * n)|0;
    for (let i=0;i<n;i++){
      const base = i*STRIDE;
      pos[base]   = Math.random()*worldW;
      pos[base+1] = Math.random()*worldH;
      pos[base+2] = rand(CONFIG.zMin, CONFIG.zMax);
    }
    links.length = 0;
  }

  /* Viewport mapping: cover (no squeeze) */
  function resize(){
    if (!canvas) return;
    dpr   = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    viewW = Math.round(canvas.clientWidth);
    viewH = Math.round(canvas.clientHeight);

    canvas.width  = Math.max(1, Math.floor(viewW * dpr));
    canvas.height = Math.max(1, Math.floor(viewH * dpr));

    const sx = viewW / worldW, sy = viewH / worldH;
    scale = Math.max(sx, sy);               // cover
    offX  = (viewW - worldW*scale) * 0.5;  // center
    offY  = (viewH - worldH*scale) * 0.5;
  }

  function warp(x,y,z){
    const A  = CONFIG.wobbleAmp * (0.6 + 0.4*z);
    const fT = CONFIG.wobbleFreq * 0.01 * t;
    const k  = CONFIG.wobbleSpatial;
    const dx = A * Math.sin(fT + y*k);
    const dy = A * Math.cos(fT + x*k);
    return [x + dx, y + dy];
  }

  function stepAgents(){
    t += CONFIG.speed;

    /* Fade trails in view space (identity transform) */
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = 'rgba(0,0,0,' + (1 - Math.exp(-CONFIG.fade)) + ')';
    ctx.fillRect(0, 0, viewW*dpr, viewH*dpr);
    ctx.globalCompositeOperation = 'source-over';

    /* Draw in world space mapped to view (cover) */
    ctx.setTransform(scale*dpr, 0, 0, scale*dpr, offX*dpr, offY*dpr);
    ctx.lineWidth   = CONFIG.lineWidth;
    ctx.strokeStyle = 'rgba('+CONFIG.color+','+CONFIG.opacity+')';
    ctx.beginPath();

    const n = pos.length / STRIDE;
    for (let i=0;i<n;i++){
      const base = i*STRIDE;
      const x = pos[base], y = pos[base+1], z = pos[base+2];

      const a  = angleAt(x, y, t*0.002);
      let nx = x + Math.cos(a) * CONFIG.step * z;
      let ny = y + Math.sin(a) * CONFIG.step * z;

      if (i < brownCount){
        nx += (Math.random()-0.5) * CONFIG.brownianStrength;
        ny += (Math.random()-0.5) * CONFIG.brownianStrength;
      }

      const p0 = warp(x,y,z);
      const p1 = warp(nx,ny,z);
      ctx.moveTo(p0[0], p0[1]);
      ctx.lineTo(p1[0], p1[1]);

      /* Wrap in world coords only */
      pos[base]   = (nx + worldW)  % worldW;
      pos[base+1] = (ny + worldH) % worldH;
    }
    ctx.stroke();
  }

  function spawnLinks(){
    if (!CONFIG.connectEnabled) return;

    const n = pos.length / STRIDE;
    const tries = CONFIG.connectPerFrame|0;

    /* Radius in world units (constant irrespective of view scaling) */
    const R2 = CONFIG.connectRadius * CONFIG.connectRadius;

    for (let k=0;k<tries;k++){
      const a = randInt(n);
      let b = -1;

      if (Math.random() < CONFIG.connectRandomLongProb){
        b = randInt(n);
        if (b === a) continue;
      } else {
        let best = Infinity, bestIdx = -1;
        const samples = 22;
        const ax = pos[a*STRIDE], ay = pos[a*STRIDE+1];
        for (let s=0;s<samples;s++){
          const j = randInt(n);
          if (j === a) continue;
          const jx = pos[j*STRIDE], jy = pos[j*STRIDE+1];
          const dx = jx-ax, dy = jy-ay;
          const d2 = dx*dx + dy*dy;
          if (d2 < best && d2 <= R2){ best = d2; bestIdx = j; }
        }
        if (bestIdx !== -1) b = bestIdx;
      }

      if (b !== -1){
        links.push({ a, b, life: CONFIG.connectLife|0 });
        if (links.length > 2000) links.splice(0, links.length - 2000);
      }
    }
  }

  function drawLinks(){
    if (!CONFIG.connectEnabled || links.length === 0) return;

    ctx.setTransform(scale*dpr, 0, 0, scale*dpr, offX*dpr, offY*dpr);
    for (let i = links.length - 1; i >= 0; i--){
      const e = links[i];
      e.life -= 1;
      if (e.life <= 0){ links.splice(i,1); continue; }

      const fa = e.life / CONFIG.connectLife;
      const ax = pos[e.a*STRIDE], ay = pos[e.a*STRIDE+1], az = pos[e.a*STRIDE+2];
      const bx = pos[e.b*STRIDE], by = pos[e.b*STRIDE+1], bz = pos[e.b*STRIDE+2];
      const P = warp(ax,ay,az);
      const Q = warp(bx,by,bz);

      ctx.lineWidth = CONFIG.connectWidth;
      ctx.strokeStyle = 'rgba('+CONFIG.color+','+(CONFIG.connectOpacity*fa)+')';
      ctx.beginPath();
      ctx.moveTo(P[0], P[1]);
      ctx.lineTo(Q[0], Q[1]);
      ctx.stroke();
    }
  }

  function frame(){
    if (!running) return;
    stepAgents();
    spawnLinks();
    drawLinks();
    rafId = requestAnimationFrame(frame);
  }

  function start(){ if (running || reduceMotion.matches || !ctx) return; running = true; rafId = requestAnimationFrame(frame); }
  function stop(){ if (!running) return; running = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }

  const scheduleResize = (() => {
    let pending = false;
    return () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; resize(); });
    };
  })();

  function init(){
    canvas = document.getElementById('waveMeshCanvas');
    if (!canvas){ console.warn('WaveMesh: #waveMeshCanvas not found'); return; }
    if (reduceMotion.matches){ canvas.hidden = true; return; }
    ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

    initWorld();
    resize();
    start();
  }

  /* Events */
  window.addEventListener('resize', scheduleResize, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleResize, { passive: true });
  window.addEventListener('orientationchange', () => { initWorld(); scheduleResize(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  reduceMotion.addEventListener?.('change', (event) => {
    if (!canvas) return;
    canvas.hidden = event.matches;
    if (event.matches) stop();
  });

  /* Public API */
  window.WaveMesh = {
    set(opts = {}){
      const prevPoints = CONFIG.points|0;
      Object.assign(CONFIG, opts);
      if ((CONFIG.points|0) !== prevPoints) seed();
    },
    start, stop,
    config: CONFIG
  };

  document.addEventListener('DOMContentLoaded', init);
})();
