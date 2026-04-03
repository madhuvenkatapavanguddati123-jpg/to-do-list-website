let tasks = JSON.parse(localStorage.getItem('enhanced_tasks')) || [];

const themeToggle = document.getElementById('theme-toggle');
const notifBtn = document.getElementById('notif-btn');

// Notification Permission
notifBtn.onclick = () => Notification.requestPermission().then(p => alert(p === 'granted' ? 'Notifications on!' : 'Blocked'));

themeToggle.onclick = () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '🌙' : '☀️';
};

function updateUI() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  
  tasks.forEach(task => {
    const li = document.createElement('li');
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    
    li.innerHTML = `
      <div class="task-header">
        <div class="task-left">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
          <span class="category-tag">[${task.category}]</span>
          <b style="${task.completed ? 'text-decoration:line-through' : ''}">${task.text}</b>
          <span class="badge priority-${task.priority}">${task.priority}</span>
        </div>
        <button class="btn delete" onclick="deleteTask(${task.id})">✕</button>
      </div>
      ${task.dueDate ? `<div class="due-date" style="color:${isOverdue ? 'red' : ''}">📅 Due: ${new Date(task.dueDate).toLocaleString()}</div>` : ''}
      
      <div class="subtasks-container">
        ${task.subtasks.map((st, i) => `
          <div class="subtask-item">
            <input type="checkbox" ${st.completed ? 'checked' : ''} onchange="toggleSubtask(${task.id}, ${i})">
            <span style="${st.completed ? 'text-decoration:line-through' : ''}">${st.text}</span>
          </div>
        `).join('')}
        <button class="btn add-sub" onclick="addSubtask(${task.id})">+ Add Subtask</button>
      </div>
    `;
    list.appendChild(li);
  });

  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const perc = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-fill').style.width = perc + '%';
  document.getElementById('stats-text').textContent = `${done}/${total} completed (${perc}%)`;
  document.getElementById('empty-msg').style.display = total ? 'none' : 'block';
  document.getElementById('footer-actions').style.display = total ? 'block' : 'none';
  
  localStorage.setItem('enhanced_tasks', JSON.stringify(tasks));
  checkDeadlines();
}

function addTask(e) {
  e.preventDefault();
  const task = {
    id: Date.now(),
    text: document.getElementById('task-input').value,
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
}

function toggleTask(id) {
  const t = tasks.find(t => t.id === id);
  t.completed = !t.completed;
  updateUI();
}

function addSubtask(id) {
  const txt = prompt("Enter subtask:");
  if (txt) {
    tasks.find(t => t.id === id).subtasks.push({ text: txt, completed: false });
    updateUI();
  }
}

function toggleSubtask(tId, sIdx) {
  const t = tasks.find(t => t.id === tId);
  t.subtasks[sIdx].completed = !t.subtasks[sIdx].completed;
  updateUI();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  updateUI();
}

function checkDeadlines() {
  if (Notification.permission !== 'granted') return;
  const now = new Date().getTime();
  tasks.forEach(t => {
    if (t.dueDate && !t.completed && !t.notified) {
      const due = new Date(t.dueDate).getTime();
      if (due - now < 300000 && due - now > 0) { // 5 min warning
        new Notification("Task Due Soon!", { body: t.text });
        t.notified = true;
      }
    }
  });
}

document.getElementById('todo-form').onsubmit = addTask;
document.getElementById('clear-all').onclick = () => { tasks = []; updateUI(); };
setInterval(checkDeadlines, 30000); // Check every 30s
updateUI();
