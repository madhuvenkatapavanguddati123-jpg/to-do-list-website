let tasks = JSON.parse(localStorage.getItem('enhanced_tasks')) || [];
let filterMode = 'all';
let searchQuery = '';
let reminderEnabled = true;
let reminderOffsetMinutes = 5;
let streak = Number(localStorage.getItem('todo_streak')) || 0;
let lastCompletionDate = localStorage.getItem('todo_lastCompletionDate') || null;

const themeToggle = document.getElementById('theme-toggle');
const notifBtn = document.getElementById('notif-btn');
const taskListEl = document.getElementById('task-list');
const emptyMsgEl = document.getElementById('empty-msg');
const footerActionsEl = document.getElementById('footer-actions');
const progressFillEl = document.getElementById('progress-fill');
const statsTextEl = document.getElementById('stats-text');
const streakTextEl = document.getElementById('streak-text');
const searchInput = document.getElementById('search-input');

const notifPopup = document.getElementById('notif-popup');
const notifCloseBtn = document.getElementById('notif-close');
const toggleDeadlineReminders = document.getElementById('toggle-deadline-reminders');
const reminderOffsetSelect = document.getElementById('reminder-offset');

/* THEME INIT & TOGGLE (uses data-theme + localStorage) [web:36][web:39] */
(function initTheme() {
  const storedTheme = localStorage.getItem('todo_theme');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    document.body.setAttribute('data-theme', storedTheme);
  } else {
    document.body.setAttribute('data-theme', 'dark');
  }
})();

themeToggle.onclick = () => {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  localStorage.setItem('todo_theme', next);
};

/* Notification popup */
notifBtn.onclick = () => {
  notifPopup.classList.toggle('hidden');
  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
};

notifCloseBtn.onclick = () => {
  notifPopup.classList.add('hidden');
};

toggleDeadlineReminders.onchange = (e) => {
  reminderEnabled = e.target.checked;
};

reminderOffsetSelect.onchange = (e) => {
  reminderOffsetMinutes = Number(e.target.value);
};

/* Filter chips */
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('chip-active'));
    chip.classList.add('chip-active');
    filterMode = chip.getAttribute('data-filter');
    updateUI();
  });
});

/* Search */
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  updateUI();
});

/* Form submit */
document.getElementById('todo-form').onsubmit = (e) => {
  e.preventDefault();
  const text = document.getElementById('task-input').value.trim();
  if (!text) return;

  const task = {
    id: Date.now(),
    text,
    priority: document.getElementById('priority-input').value,
    category: document.getElementById('category-input').value,
    dueDate: document.getElementById('date-input').value,
    completed: false,
    subtasks: [],
    notified: false
  };
  tasks.push(task);
  e.target.reset();
  updateUI();
};

/* Clear all */
document.getElementById('clear-all').onclick = () => {
  tasks = [];
  updateUI();
};

/* Core UI update */
function updateUI() {
  taskListEl.innerHTML = '';

  const visibleTasks = applyFilters(tasks);

  visibleTasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

    li.innerHTML = `
      <div class="task-header">
        <div class="task-main">
          <div class="task-main-left">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}" class="task-toggle">
            <span class="category-tag">[${task.category}]</span>
            <span class="task-title ${task.completed ? 'completed' : ''}">${task.text}</span>
          </div>
          <span class="badge priority-${task.priority}">${task.priority}</span>
        </div>
        <button class="btn danger task-delete" data-id="${task.id}">Delete</button>
      </div>
      ${task.dueDate ? `
        <div class="due-date ${isOverdue ? 'overdue' : ''}">
          📅 Due: ${new Date(task.dueDate).toLocaleString()}
        </div>` : ''
      }
      <div class="subtasks-container">
        ${task.subtasks.map((st, index) => `
          <div class="subtask-item">
            <input type="checkbox" data-task-id="${task.id}" data-sub-index="${index}" ${st.completed ? 'checked' : ''} class="subtask-toggle">
            <span class="subtask-text ${st.completed ? 'completed' : ''}">${st.text}</span>
          </div>
        `).join('')}
        <button class="btn secondary add-sub" data-id="${task.id}">Add Subtask</button>
      </div>
    `;
    taskListEl.appendChild(li);
  });

  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const perc = total ? Math.round((done / total) * 100) : 0;
  progressFillEl.style.width = perc + '%';
  statsTextEl.textContent = `${done}/${total} completed (${perc}%)`;

  emptyMsgEl.style.display = visibleTasks.length ? 'none' : 'block';
  footerActionsEl.style.display = total ? 'flex' : 'none';

  localStorage.setItem('enhanced_tasks', JSON.stringify(tasks));
  updateStreak(done);
  attachItemListeners();
}

/* Attach listeners to dynamic items */
function attachItemListeners() {
  document.querySelectorAll('.task-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const id = Number(checkbox.getAttribute('data-id'));
      toggleTask(id);
    });
  });

  document.querySelectorAll('.task-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      deleteTask(id);
    });
  });

  document.querySelectorAll('.add-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-id'));
      addSubtask(id);
    });
  });

  document.querySelectorAll('.subtask-toggle').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const taskId = Number(checkbox.getAttribute('data-task-id'));
      const index = Number(checkbox.getAttribute('data-sub-index'));
      toggleSubtask(taskId, index);
    });
  });
}

/* Filters */
function applyFilters(list) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return list.filter(t => {
    if (searchQuery) {
      const inText = t.text.toLowerCase().includes(searchQuery);
      const inCategory = t.category.toLowerCase().includes(searchQuery);
      const inPriority = t.priority.toLowerCase().includes(searchQuery);
      if (!inText && !inCategory && !inPriority) return false;
    }

    if (filterMode === 'today') {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate).toISOString().split('T')[0];
      return d === todayStr;
    }

    if (filterMode === 'upcoming') {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) > now;
    }

    if (filterMode === 'high') {
      return t.priority === 'High';
    }

    return true;
  });
}

/* Task operations */
function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.completed = !t.completed;
  updateUI();
}

function addSubtask(id) {
  const txt = prompt('Enter subtask:');
  if (txt) {
    const t = tasks.find(t => t.id === id);
    if (!t) return;
    t.subtasks.push({ text: txt, completed: false });
    updateUI();
  }
}

function toggleSubtask(tId, sIdx) {
  const t = tasks.find(t => t.id === tId);
  if (!t) return;
  const st = t.subtasks[sIdx];
  if (!st) return;
  st.completed = !st.completed;
  updateUI();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  updateUI();
}

/* Streak logic */
function updateStreak(doneCount) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!doneCount) {
    streakTextEl.textContent = `🔥 Streak: ${streak} days`;
    return;
  }

  if (lastCompletionDate === todayStr) {
    streakTextEl.textContent = `🔥 Streak: ${streak} days`;
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];

  if (lastCompletionDate === yStr) {
    streak += 1;
  } else {
    streak = 1;
  }

  lastCompletionDate = todayStr;
  localStorage.setItem('todo_streak', String(streak));
  localStorage.setItem('todo_lastCompletionDate', lastCompletionDate);
  streakTextEl.textContent = `🔥 Streak: ${streak} days`;
}

/* Deadline checks */
function checkDeadlines() {
  if (!reminderEnabled || !window.Notification || Notification.permission !== 'granted') return;

  const now = Date.now();
  const offsetMs = reminderOffsetMinutes * 60 * 1000;

  tasks.forEach(t => {
    if (t.dueDate && !t.completed && !t.notified) {
      const due = new Date(t.dueDate).getTime();
      const delta = due - now;
      if (delta < offsetMs && delta > 0) {
        new Notification('Task Due Soon!', { body: t.text });
        t.notified = true;
      }
    }
  });

  localStorage.setItem('enhanced_tasks', JSON.stringify(tasks));
}

/* Init */
setInterval(checkDeadlines, 30000);
updateUI();