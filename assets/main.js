(() => {
  'use strict';

  const config = window.LF_CONFIG || { username: 'LonzilFox', projects: {} };
  const account = config.username || 'LonzilFox';
  const categoryNames = { tools: 'DEV TOOLS', automation: 'AUTOMATION', ai: 'AI / VISION', game: 'GAME / MOD', web: 'WEB / APPS', creative: 'CREATIVE' };
  const categoryGlyphs = { tools: '◇', automation: '⌘', ai: '⟁', game: '✳', web: '⊞', creative: '◈' };
  const $ = selector => document.querySelector(selector);
  const grid = $('#projectsGrid');
  const fallbackCatalog = Object.entries(config.projects || {}).map(([name, cfg]) => ({
    name,
    full_name: `${account}/${name}`,
    html_url: `https://github.com/${encodeURIComponent(account)}/${encodeURIComponent(name)}`,
    description: cfg.description || '',
    topics: [], language: '', stargazers_count: null, updated_at: null,
    archived: false, fork: false,
  }));
  let allProjects = fallbackCatalog;
  let filter = 'all';
  let search = '';
  let sort = 'featured';
  let liveFeed = false;
  function readMotionPreference() { try { return window.localStorage.getItem('lf-motion'); } catch { return null; } }
  function saveMotionPreference(value) { try { window.localStorage.setItem('lf-motion', value); } catch { /* storage can be unavailable in local/sandbox previews */ } }
  let motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && readMotionPreference() !== 'off';
  document.body.classList.toggle('motion-off', !motion);

  function safeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function categoryFor(repo) {
    const override = config.projects?.[repo.name];
    if (override?.category && categoryNames[override.category]) return override.category;
    const topics = (repo.topics || []).join(' ').toLowerCase();
    const hint = `${repo.name} ${repo.description || ''} ${topics}`.toLowerCase();
    if (/pixel|drawing|artwork|creative|sprite|music|midi|comfyui|design/.test(hint)) return 'creative';
    if (/ai-|artificial-intelligence|machine-learning|llm|model|ocr-assistant|openai/.test(hint)) return 'ai';
    if (/game|modding|trainer|bepinex|melonloader|minecraft|dyinglight|sky-music|simulator|mahjong/.test(hint)) return 'game';
    if (/automation|auto-click|autoclick|macro|robot|clicker|workflow/.test(hint)) return 'automation';
    if (/web|website|browser|frontend|react|vue|nextjs|lounge|html/.test(hint)) return 'web';
    return 'tools';
  }
  function decorated(repo) {
    const override = config.projects?.[repo.name] || {};
    return { ...repo, category: categoryFor(repo), also: (override.also || []).filter(category => categoryNames[category]), featured: override.featured ?? 9999,
      tagline: override.tagline || ((repo.language || 'INDEPENDENT') + ' / EXPERIMENT'),
      description: override.description || repo.description || 'An independent software project. Explore the repository for code and details.',
      tags: (override.tags || [...(repo.topics || []).slice(0, 2), repo.language].filter(Boolean)).slice(0, 4),
    };
  }
  function getVisible() {
    const needle = search.trim().toLowerCase();
    const entries = allProjects.map(decorated).filter(project => {
      if (filter !== 'all' && project.category !== filter && !project.also.includes(filter)) return false;
      if (!needle) return true;
      return [project.name, project.description, project.tagline, project.category, ...project.tags].join(' ').toLowerCase().includes(needle);
    });
    entries.sort((a, b) => {
      if (sort === 'recent') return (Date.parse(b.updated_at || 0) || 0) - (Date.parse(a.updated_at || 0) || 0) || a.name.localeCompare(b.name);
      if (sort === 'stars') return (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0) || a.name.localeCompare(b.name);
      if (sort === 'name') return a.name.localeCompare(b.name);
      return a.featured - b.featured || a.name.localeCompare(b.name);
    });
    return entries;
  }
  function projectCard(project, index) {
    const category = categoryNames[project.category] || 'PROJECT';
    const glyph = categoryGlyphs[project.category] || '◇';
    const url = /^https:\/\/github\.com\/LonzilFox\//i.test(project.html_url || '') ? project.html_url : `https://github.com/${account}/${encodeURIComponent(project.name)}`;
    const tags = project.tags.map(tag => `<span>${safeText(tag)}</span>`).join('');
    const starInfo = project.stargazers_count != null ? `★ ${project.stargazers_count}` : 'SRC / PUBLIC';
    return `<article class="project-card" aria-label="${safeText(project.name)}">
      <div class="card-top"><span class="card-index">${glyph} / ${String(index + 1).padStart(2,'0')}</span><span class="card-category">${category}</span></div>
      <a class="card-title" href="${safeText(url)}" target="_blank" rel="noopener noreferrer">${safeText(project.name)}</a>
      <div class="card-tagline">// ${safeText(project.tagline)}</div>
      <p class="card-description">${safeText(project.description)}</p>
      <div class="card-tags">${tags || '<span>INDEPENDENT</span>'}</div>
      <div class="card-bottom"><span>${safeText(starInfo)}</span><a class="card-arrow" href="${safeText(url)}" target="_blank" rel="noopener noreferrer" aria-label="View ${safeText(project.name)} on GitHub">↗</a></div>
    </article>`;
  }
  function renderProjects() {
    const visible = getVisible();
    grid.innerHTML = visible.map(projectCard).join('');
    $('#projectsEmpty').hidden = visible.length !== 0;
    $('#projectTotal').textContent = String(allProjects.length).padStart(2, '0');
    $('#projectStatus').textContent = `${String(visible.length).padStart(2,'0')} ENTRIES DISPLAYED // ${liveFeed ? 'GITHUB LIVE FEED' : 'CURATED FALLBACK INDEX'}`;
  }
  function setFeedStatus(message) {
    $('#feedIndicator').innerHTML = `<span class="live-dot"></span> ${safeText(message)}`;
  }
  async function loadGitHubProjects() {
    try {
      const repos = [];
      // Read-only public API, no token or server needed; API requests are rate-limited.
      for (let page = 1; page <= 4; page++) {
        const controller = new AbortController();
        const cancel = setTimeout(() => controller.abort(), 8000);
        let response;
        try {
          response = await fetch(`https://api.github.com/users/${encodeURIComponent(account)}/repos?per_page=100&page=${page}&sort=updated&type=owner`, {
            headers: { Accept: 'application/vnd.github+json' }, signal: controller.signal
          });
        } finally { clearTimeout(cancel); }
        if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
        const batch = await response.json();
        if (!Array.isArray(batch)) throw new Error('Invalid repository response');
        repos.push(...batch);
        if (batch.length < 100) break;
      }
      const allowed = repos.filter(repo => !repo.fork && repo.name !== account && repo.name.toLowerCase() !== `${account.toLowerCase()}.github.io`);
      if (!allowed.length) throw new Error('No public repositories returned');
      allProjects = allowed;
      liveFeed = true;
      renderProjects();
      setFeedStatus('GITHUB LIVE / SYNCED');
    } catch (err) {
      console.info('[LonzilFox] Live GitHub feed unavailable; curated fallback is shown.', err.message);
      setFeedStatus('LOCAL ARCHIVE / API OFFLINE');
      renderProjects();
    }
  }
  $('#filterList').addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    document.querySelectorAll('.filter').forEach(btn => {
      const active = btn === button;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    renderProjects();
  });
  $('#projectSearch').addEventListener('input', event => { search = event.target.value; renderProjects(); });
  $('#projectSort').addEventListener('change', event => { sort = event.target.value; renderProjects(); });
  renderProjects();
  loadGitHubProjects();

  // CRT / Matrix rainfall: no external libraries, capped frame rate and number of columns.
  const canvas = $('#matrixCanvas');
  const ctx = canvas.getContext('2d');
  let columns = [];
  let columnSize = 18;
  let frameId = 0;
  let lastFrame = 0;
  let canvasActive = true;
  function sizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(bounds.width * scale));
    canvas.height = Math.max(1, Math.floor(bounds.height * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.ceil(bounds.width / columnSize);
    columns = Array.from({length: count}, (_, i) => ({ x: i * columnSize, y: -Math.random() * (bounds.height / columnSize), speed: .25 + Math.random() * .55 }));
  }
  const glyphs = '01アイウエカケコﾊﾐﾑﾒﾓ++<>/#';
  function drawMatrix(time) {
    frameId = requestAnimationFrame(drawMatrix);
    if (!motion || !canvasActive || time - lastFrame < 48) return;
    lastFrame = time;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    ctx.fillStyle = 'rgba(10,13,13,.125)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${columnSize - 5}px monospace`;
    for (const col of columns) {
      const char = glyphs[Math.floor(Math.random() * glyphs.length)];
      ctx.fillStyle = Math.random() > .985 ? '#d9ffd3' : (Math.random() > .95 ? '#a493e3' : '#68953d');
      ctx.fillText(char, col.x, col.y * columnSize);
      col.y += col.speed;
      if (col.y * columnSize > height && Math.random() > .972) col.y = -Math.random() * 30;
    }
  }
  if (ctx) {
    sizeCanvas();
    if ('ResizeObserver' in window) new ResizeObserver(sizeCanvas).observe(canvas);
    else window.addEventListener('resize', sizeCanvas, { passive: true });
    frameId = requestAnimationFrame(drawMatrix);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { canvasActive = entries[0]?.isIntersecting || false; }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', () => { canvasActive = !document.hidden; });
  }
  const motionToggle = $('#motionToggle');
  function updateMotionButton() {
    motionToggle.textContent = motion ? 'FX: ON' : 'FX: OFF';
    motionToggle.setAttribute('aria-label', motion ? 'Disable animations' : 'Enable animations');
    motionToggle.setAttribute('aria-pressed', String(motion));
    document.body.classList.toggle('motion-off', !motion);
    if (!motion && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  motionToggle.addEventListener('click', () => {
    motion = !motion;
    saveMotionPreference(motion ? 'on' : 'off');
    updateMotionButton();
  });
  updateMotionButton();

  // Cursor illumination only for precise pointers, not touch screens.
  if (window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('pointermove', event => {
      const halo = $('#cursorHalo');
      halo.style.left = `${event.clientX}px`;
      halo.style.top = `${event.clientY}px`;
    }, { passive: true });
  }
  function updateClock() {
    $('#localClock').textContent = new Intl.DateTimeFormat('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  }
  updateClock();
  setInterval(updateClock, 1000);
  $('#copyrightYear').textContent = new Date().getFullYear();

  // Command shell: purely local, no eval, no arbitrary code execution.
  const output = $('#terminalOutput');
  const commandInput = $('#terminalInput');
  const terminalMessages = {
    help: ['AVAILABLE COMMANDS:', 'help       list supported commands', 'whoami     identify the operator', 'projects   move to project archive', 'github     open public GitHub account', 'status     show node / archive status', 'matrix     toggle the animation engine', 'clear      clear terminal output', 'date       display local system time'],
    whoami: ['USER       LonzilFox / Tiasmi', 'ROLE       Independent developer', 'FOCUS      Tools / AI / Automation / Games / Web', 'MISSION    Build strange but useful things.'],
    status: () => [`NODE       ONLINE`, `PUBLIC REPOS  ${allProjects.length}`, `DATA SOURCE   ${liveFeed ? 'github api' : 'fallback index'}`, `VISUAL FX     ${motion ? 'enabled' : 'disabled'}`],
    date: () => [new Date().toLocaleString()],
  };
  function line(text, kind = '') {
    const div = document.createElement('div');
    div.className = `terminal-response ${kind}`.trim();
    div.textContent = text;
    output.appendChild(div);
    while (output.children.length > 100) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }
  $('#terminalForm').addEventListener('submit', event => {
    event.preventDefault();
    const raw = commandInput.value.trim();
    commandInput.value = '';
    if (!raw) return;
    line(`guest@lonzilfox:~$ ${raw}`, 'command');
    const name = raw.split(/\s+/)[0].toLowerCase();
    if (name === 'clear') { output.textContent = ''; return; }
    if (name === 'projects') { line('OPENING PROJECT ARCHIVE...', 'accent'); $('#projects').scrollIntoView({ behavior: motion ? 'smooth':'instant' }); return; }
    if (name === 'github') { line('OPENING GITHUB PROFILE...', 'accent'); window.open(`https://github.com/${encodeURIComponent(account)}`, '_blank', 'noopener,noreferrer'); return; }
    if (name === 'matrix') { motionToggle.click(); line(`VISUAL FX: ${motion ? 'ON' : 'OFF'}`, 'accent'); return; }
    const handler = terminalMessages[name];
    if (handler) { for (const message of (typeof handler === 'function' ? handler() : handler)) line(message, 'accent'); }
    else line(`command not found: ${name} // type 'help'`, 'error');
  });
  document.querySelectorAll('.primary-nav a').forEach(link => link.addEventListener('click', () => {
    // Native anchor navigation; commands need no custom router.
  }));
  // Periodic subtle RGB glitch, disabled via accessibility / FX toggle.
  setInterval(() => {
    if (!motion || document.hidden) return;
    const title = $('.hero-supertext h1');
    if (!title) return;
    title.classList.add('is-glitching');
    setTimeout(() => title.classList.remove('is-glitching'), 420);
  }, 6500);
})();
