const form = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const emptyMsg = document.getElementById('empty-msg');
const themeToggle = document.getElementById('theme-toggle');
const progressFill = document.getElementById('progress-fill');
const statsText = document.getElementById('stats-text');
const footerActions = document.getElementById('footer-actions');
const clearAllBtn = document.getElementById('clear-all');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Theme Management
themeToggle.addEventListener('click', () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  themeToggle.textContent = isDark ? '🌙' : '☀️';
});

function updateUI() {
  taskList.innerHTML = '';
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressFill.style.width = `${percent}%`;
  statsText.textContent = `${completed}/${total} tasks completed (${percent}%)`;
  
  emptyMsg.style.display = total === 0 ? 'block' : 'none';
  footerActions.style.display = total === 0 ? 'none' : 'block';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
      </div>
      <div class="actions">
        <button class="btn edit">Edit</button>
        <button class="btn delete">Delete</button>
      </div>
    `;

    // Events
    li.querySelector('input').onclick = () => toggleTask(task.id);
    li.querySelector('.edit').onclick = () => editTask(task.id);
    li.querySelector('.delete').onclick = () => deleteTask(task.id);
    
    taskList.appendChild(li);
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function addTask(text) {
  tasks.push({ id: Date.now(), text, completed: false });
  updateUI();
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  updateUI();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  const newText = prompt('Edit task:', task.text);
  if (newText && newText.trim()) {
    task.text = newText.trim();
    updateUI();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  updateUI();
}

clearAllBtn.onclick = () => {
  if (confirm('Delete all tasks?')) {
    tasks = [];
    updateUI();
  }
};

form.onsubmit = (e) => {
  e.preventDefault();
  if (taskInput.value.trim()) {
    addTask(taskInput.value.trim());
    taskInput.value = '';
  }
};

updateUI();
