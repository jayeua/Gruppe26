// jira_page.js — render backlog cards, filters, counters and modal from data/jira.json
(function () {
  'use strict';

  const DATA_PATH = '../data/jira.json';
  const areaEl = document.getElementById('jira-area');
  const colTodo = document.getElementById('col-todo');
  const colInprog = document.getElementById('col-inprog');
  const colDone = document.getElementById('col-done');
  const statTotal = document.getElementById('stat-total');
  const statTodo = document.getElementById('stat-todo');
  const statInprog = document.getElementById('stat-inprog');
  const statDone = document.getElementById('stat-done');
  const filterBtns = Array.from(document.querySelectorAll('.jira-filters [data-filter]'));

  if (!areaEl || !colTodo || !colInprog || !colDone) return;

  // create modal
  const modal = document.createElement('div');
  modal.className = 'jira-modal';
  modal.innerHTML = '<div class="jira-modal-inner" role="dialog" aria-hidden="true"><button class="close">×</button><div class="content"></div></div>';
  document.body.appendChild(modal);
  const modalContent = modal.querySelector('.content');
  const modalClose = modal.querySelector('.close');
  modalClose.addEventListener('click', () => { modal.classList.remove('open'); document.body.classList.remove('modal-open'); });

  function openModal(issue) {
    modalContent.innerHTML = `
      <header class="modal-head"><h2>${issue.key} — ${issue.summary}</h2></header>
      <div class="modal-grid">
        <div class="modal-meta">
          <div class="meta-row"><strong>Status:</strong> <span>${issue.status || '—'}</span></div>
          <div class="meta-row"><strong>Assignee:</strong> <span>${issue.assignee || '—'}</span></div>
          <div class="meta-row"><strong>Priority:</strong> <span>${issue.priority || '—'}</span></div>
          <div class="meta-row"><strong>Labels:</strong> <span>${(issue.labels||[]).join(', ') || '—'}</span></div>
          <div class="meta-row small"><small>Created: ${issue.created || '—'}</small></div>
          <div class="meta-row small"><small>Updated: ${issue.updated || '—'}</small></div>
        </div>
        <div class="modal-body">
          <p><a href="${issue.url||'#'}" target="_blank" rel="noopener">Open in Jira</a></p>
        </div>
      </div>
      <div class="modal-actions"><button class="btn modal-exit">Exit</button></div>
    `;
    modal.classList.add('open');
    // prevent background scroll and apply backdrop effects
    document.body.classList.add('modal-open');
    // wire exit button inside modal
    const exitBtn = modalContent.querySelector('.modal-exit');
    if(exitBtn) exitBtn.addEventListener('click', ()=>{ modal.classList.remove('open'); document.body.classList.remove('modal-open'); });
  }

  // close modal with Escape key
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') { modal.classList.remove('open'); document.body.classList.remove('modal-open'); }
  });

  function createCard(i) {
    const card = document.createElement('article');
    card.className = 'jira-card';

    // no sprint highlighting — keep cards simple

    const header = document.createElement('div');
    header.className = 'card-header';
    const key = document.createElement('div');
    key.className = 'issue-key';
    key.textContent = i.key;
    const badge = document.createElement('span');
    const priorityRaw = (i.priority||'').toString();
    let prClass = '';
    const p = priorityRaw.toLowerCase();
    if(p.includes('high')) prClass = 'high';
    else if(p.includes('medium')) prClass = 'medium';
    else if(p.includes('low')) prClass = 'low';
    badge.className = `badge ${prClass}`.trim();
    badge.textContent = priorityRaw || '';
    header.appendChild(key);
    header.appendChild(badge);
    // header stays with key and priority badge only

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = i.summary;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const status = document.createElement('span');
    status.className = 'status-pill ' + ((i.status||'').toLowerCase().replace(/\s+/g,'-'));
    status.textContent = i.status || '';
    const assignee = document.createElement('small');
    assignee.textContent = i.assignee || '';
    meta.appendChild(status);
    meta.appendChild(assignee);

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const openBtn = document.createElement('button');
    openBtn.className = 'btn';
    openBtn.textContent = 'Details';
    openBtn.addEventListener('click', () => openModal(i));
    footer.appendChild(openBtn);

    card.appendChild(header);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(footer);

    card.dataset.status = (i.status||'').toLowerCase();
    // set id for persistence and drag/drop
    card.id = `card-${i.key}`;
    card.setAttribute('draggable','true');
    card.addEventListener('dragstart', (e)=>{
      e.dataTransfer.setData('text/plain', card.id);
      setTimeout(()=> card.style.opacity = '0.6', 20);
    });
    card.addEventListener('dragend', ()=>{ card.style.opacity = ''; });
    return card;
  }

  function clearColumns(){
    [colTodo, colInprog, colDone].forEach(c => c.innerHTML = '');
  }

  function populateColumns(issues){
    clearColumns();
    issues.forEach(i=>{
      const card = createCard(i);
      const st = normalizeStatus(i.status);
      if(st === 'done') colDone.appendChild(card);
      else if(st === 'inprog') colInprog.appendChild(card);
      else colTodo.appendChild(card);
    });
  }

  function updateStats(issues) {
    const total = issues.length;
    const todo = colTodo.children.length;
    const inprog = colInprog.children.length;
    const done = colDone.children.length;
    statTotal.textContent = total;
    statTodo.textContent = todo;
    statInprog.textContent = inprog;
    statDone.textContent = done;
  }

  function applyFilter(filter) {
    const cards = Array.from(document.querySelectorAll('.jira-card'));
    const f = (filter||'').toLowerCase();
    cards.forEach(c => {
      if (!f || f === 'all') { c.style.display = ''; return; }
      const st = (c.dataset.status||'').toLowerCase();
      if (f === 'to do' || f === 'to-do' || f === 'todo') {
        c.style.display = /(to do|todo|ikke|open)/i.test(st) ? '' : 'none';
      } else if (f === 'in progress' || f === 'in-progress' || f === 'pågår' || f === 'inprogress') {
        c.style.display = /(in progress|pågår|doing)/i.test(st) ? '' : 'none';
      } else if (f === 'done' || f === 'ferdig' || f === 'completed') {
        c.style.display = /(done|ferdig|completed)/i.test(st) ? '' : 'none';
      } else {
        c.style.display = st.includes(f) ? '' : 'none';
      }
    });
  }

  filterBtns.forEach(b => b.addEventListener('click', (e) => {
    filterBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    applyFilter(b.dataset.filter);
  }));

  // drag/drop events for columns
  [colTodo, colInprog, colDone].forEach(body => {
    body.addEventListener('dragover', e=>{ e.preventDefault(); body.classList.add('drag-over'); });
    body.addEventListener('dragleave', ()=> body.classList.remove('drag-over'));
    body.addEventListener('drop', e=>{
      e.preventDefault(); body.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const el = document.getElementById(id);
      if(el) body.appendChild(el);
      persistBoardState();
      // update stats count display
      updateStats(currentIssues || []);
    });
  });

  // reset button: clear local state and re-render from Jira
  const resetBtn = document.getElementById('reset-btn');
  if(resetBtn) resetBtn.addEventListener('click', ()=>{
    localStorage.removeItem('jira_kanban_state');
    fetchAndRender();
  });

  let currentIssues = [];

  function persistBoardState(){
    try{
      const state = {
        todo: Array.from(colTodo.children).map(c=>c.id),
        inprog: Array.from(colInprog.children).map(c=>c.id),
        done: Array.from(colDone.children).map(c=>c.id),
        ts: Date.now()
      };
      localStorage.setItem('jira_kanban_state', JSON.stringify(state));
    }catch(e){ console.warn('persist failed', e); }
  }

  function restoreBoardState(){
    try{
      const raw = localStorage.getItem('jira_kanban_state');
      if(!raw) return false;
      const state = JSON.parse(raw);
      // move cards to saved columns
      ['todo','inprog','done'].forEach(colKey=>{
        const ids = state[colKey] || [];
        ids.forEach(id=>{
          const el = document.getElementById(id);
          if(el){
            if(colKey === 'todo') colTodo.appendChild(el);
            if(colKey === 'inprog') colInprog.appendChild(el);
            if(colKey === 'done') colDone.appendChild(el);
          }
        });
      });
      return true;
    }catch(e){ console.warn('restore failed', e); return false; }
  }

  function normalizeStatus(name){
    if(!name) return 'todo';
    const n = name.toLowerCase();
    if(n.includes('done')||n.includes('closed')||n.includes('resolved')||n.includes('ferdig')) return 'done';
    if(n.includes('in progress')||n.includes('pågår')||n.includes('in-progress')||n.includes('doing')) return 'inprog';
    return 'todo';
  }

  function fetchAndRender(){
    fetch(DATA_PATH, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('data not found'); return r.json(); })
      .then(json => {
        const issues = json.issues || [];
        currentIssues = issues;
        populateColumns(issues);
        // if there is saved board state, restore positions
        restoreBoardState();
        updateStats(issues);
      })
      .catch(err => {
        areaEl.innerHTML = `<div class="error">Error loading data: ${err.message}</div>`;
        console.error(err);
      });
  }

  // initial load
  fetchAndRender();

})();
