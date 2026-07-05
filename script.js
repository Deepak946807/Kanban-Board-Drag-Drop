
  const STORAGE_KEY = 'flowboard-data-v1';
  const defaultData = {
    todo: [
      { text: "Design homepage", priority: "high", created: Date.now() - 86400000 },
      { text: "Write project proposal", priority: "medium", created: Date.now() - 43200000 }
    ],
    progress: [
      { text: "Build login page", priority: "medium", created: Date.now() - 7200000 }
    ],
    done: [
      { text: "Setup project repo", priority: "low", created: Date.now() - 172800000 }
    ]
  };

  let draggedCard = null;

  // ===== Time formatting =====
  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  }

  // ===== Create a card element =====
  function createCard({ text, priority = 'medium', created = Date.now() }) {
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.dataset.priority = priority;
    card.dataset.created = created;

    card.innerHTML = `
      <div class="card-top">
        <div class="card-text" tabindex="0">${escapeHtml(text)}</div>
        <button class="card-delete">&times;</button>
      </div>
      <div class="card-footer">
        <span class="priority-pill" data-priority="${priority}">${priority}</span>
        <span class="card-time">${timeAgo(created)}</span>
      </div>
    `;

    attachCardEvents(card);
    return card;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===== Card interactions =====
  function attachCardEvents(card) {
    card.addEventListener('dragstart', () => {
      draggedCard = card;
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedCard = null;
      saveState();
      updateCounts();
    });

    const delBtn = card.querySelector('.card-delete');
    delBtn.addEventListener('click', () => {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      setTimeout(() => { card.remove(); saveState(); updateCounts(); }, 150);
    });

    // Inline edit: click text to edit, Enter or blur to save
    const textEl = card.querySelector('.card-text');
    textEl.addEventListener('click', (e) => {
      e.stopPropagation();
      textEl.contentEditable = true;
      textEl.classList.add('editing');
      textEl.focus();
      document.execCommand('selectAll', false, null);
    });
    textEl.addEventListener('blur', () => {
      textEl.contentEditable = false;
      textEl.classList.remove('editing');
      if (!textEl.textContent.trim()) textEl.textContent = 'Untitled task';
      saveState();
    });
    textEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); textEl.blur(); }
      if (e.key === 'Escape') { textEl.blur(); }
    });

    // Cycle priority by clicking the pill
    const pill = card.querySelector('.priority-pill');
    const order = ['low', 'medium', 'high'];
    pill.addEventListener('click', () => {
      const next = order[(order.indexOf(card.dataset.priority) + 1) % order.length];
      card.dataset.priority = next;
      pill.dataset.priority = next;
      pill.textContent = next;
      saveState();
    });
  }

  // ===== Insertion point while dragging =====
  function getDragAfterElement(list, y) {
    const cards = [...list.querySelectorAll('.card:not(.dragging)')];
    return cards.reduce((closest, card) => {
      const box = card.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: card };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  // ===== Confetti burst =====
  function launchConfetti(x, y) {
    const colors = ['#5fd9a0', '#7c9cff', '#ffb454', '#eef0fb'];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement('div');
      p.className = 'confetti';
      const angle = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.setProperty('--rot', `${Math.random() * 360}deg`);
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  // ===== Column drop-target events =====
  document.querySelectorAll('.card-list').forEach(list => {
    const column = list.closest('.column');

    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      column.classList.add('drag-over');
      if (!draggedCard) return;
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) list.appendChild(draggedCard);
      else list.insertBefore(draggedCard, afterElement);
    });

    list.addEventListener('dragleave', (e) => {
      if (!list.contains(e.relatedTarget)) column.classList.remove('drag-over');
    });

    list.addEventListener('drop', () => {
      column.classList.remove('drag-over');
      if (draggedCard && list.id === 'done') {
        const rect = draggedCard.getBoundingClientRect();
        launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
      renderEmptyStates();
    });
  });

  // ===== Add-task form logic =====
  document.querySelectorAll('.add-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      document.getElementById(`form-${target}`).classList.add('active');
      btn.style.display = 'none';
      document.getElementById(`form-${target}`).querySelector('textarea').focus();
    });
  });

  document.querySelectorAll('.add-cancel').forEach(btn => {
    btn.addEventListener('click', () => closeForm(btn.closest('.add-form')));
  });

  function closeForm(form) {
    form.classList.remove('active');
    form.querySelector('textarea').value = '';
    form.previousElementSibling.style.display = 'block';
  }

  document.querySelectorAll('.priority-picker').forEach(picker => {
    picker.querySelectorAll('.priority-choice').forEach(choice => {
      choice.addEventListener('click', () => {
        picker.querySelectorAll('.priority-choice').forEach(c => c.classList.remove('active'));
        choice.classList.add('active');
      });
    });
  });

  document.querySelectorAll('.add-form textarea').forEach(ta => {
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        ta.closest('.add-form').querySelector('.add-confirm').click();
      }
      if (e.key === 'Escape') closeForm(ta.closest('.add-form'));
    });
  });

  document.querySelectorAll('.add-confirm').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = btn.closest('.add-form');
      const textarea = form.querySelector('textarea');
      const text = textarea.value.trim();
      if (!text) return;

      const priority = form.querySelector('.priority-choice.active').dataset.priority;
      const listId = form.id.replace('form-', '');
      document.getElementById(listId).appendChild(createCard({ text, priority, created: Date.now() }));

      closeForm(form);
      form.querySelectorAll('.priority-choice').forEach(c => c.classList.remove('active'));
      form.querySelector('[data-priority="medium"]').classList.add('active');

      saveState();
      updateCounts();
      renderEmptyStates();
    });
  });

  // ===== Search / filter =====
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
      const text = card.querySelector('.card-text').textContent.toLowerCase();
      card.classList.toggle('filtered-out', q.length > 0 && !text.includes(q));
    });
  });

  // ===== Empty state placeholders =====
  function renderEmptyStates() {
    ['todo', 'progress', 'done'].forEach(id => {
      const list = document.getElementById(id);
      let placeholder = list.querySelector('.empty-state');
      if (list.children.length === 0) {
        if (!placeholder) {
          placeholder = document.createElement('div');
          placeholder.className = 'empty-state';
          placeholder.textContent = 'No tasks yet';
          list.appendChild(placeholder);
        }
      } else if (list.children.length > 1 && placeholder) {
        placeholder.remove();
      }
    });
  }

  // ===== Counts + progress bar =====
  function updateCounts() {
    let total = 0, done = 0;
    ['todo', 'progress', 'done'].forEach(id => {
      const realCards = document.getElementById(id).querySelectorAll('.card').length;
      document.getElementById(`count-${id}`).textContent = realCards;
      total += realCards;
      if (id === 'done') done = realCards;
    });
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    document.getElementById('progressFill').style.width = `${pct}%`;
    document.getElementById('progressPercent').textContent = `${pct}%`;
    document.getElementById('progressLabel').textContent = `${done} of ${total} tasks done`;
  }

  // ===== Save / load from localStorage =====
  function saveState() {
    const data = { todo: [], progress: [], done: [] };
    ['todo', 'progress', 'done'].forEach(id => {
      document.getElementById(id).querySelectorAll('.card').forEach(card => {
        data[id].push({
          text: card.querySelector('.card-text').textContent,
          priority: card.dataset.priority,
          created: Number(card.dataset.created)
        });
      });
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Could not save board state', err);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultData;
    } catch (err) {
      console.error('Could not load saved board, using defaults', err);
      return defaultData;
    }
  }

  // ===== Boot =====
  const data = loadState();
  Object.entries(data).forEach(([status, tasks]) => {
    const list = document.getElementById(status);
    tasks.forEach(task => list.appendChild(createCard(task)));
  });
  updateCounts();
  renderEmptyStates();
