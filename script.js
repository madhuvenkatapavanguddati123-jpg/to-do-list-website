const form = document.getElementById('todo-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const emptyMsg = document.getElementById('empty-msg');

let tasks = [];

// Load tasks from localStorage on startup
function loadTasks() {
  const saved = localStorage.getItem('tasks');
  if (saved) {
    tasks = JSON.parse(saved);
  } else {
    tasks = [];
  }
  renderTasks();
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Render the task list
function renderTasks() {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  } else {
    emptyMsg.style.display = 'none';
  }

  tasks.forEach((task) => {
    const li = document.createElement('li');

    const left = document.createElement('div');
    left.className = 'task-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'task-text';
    if (task.completed) span.classList.add('completed');
    span.textContent = task.text;

    left.appendChild(checkbox);
    left.appendChild(span);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'btn edit';
    editBtn.addEventListener('click', () => editTask(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(left);
    li.appendChild(actions);

    taskList.appendChild(li);
  });
}

// Add a new task
function addTask(text) {
  const newTask = {
    id: Date.now(),
    text: text.trim(),
    completed: false
  };
  tasks.push(newTask);
  saveTasks();
  renderTasks();
}

// Toggle completion status
function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

// Edit an existing task
function editTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const newText = prompt('Edit task:', task.text);
  if (newText === null) return;
  if (newText.trim() === '') {
    alert('Task cannot be empty.');
    return;
  }

  task.text = newText.trim();
  saveTasks();
  renderTasks();
}

// Delete a task
function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

// Form submit handler
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value;
  if (text.trim() === '') {
    alert('Please enter a task.');
    return;
  }
  addTask(text);
  taskInput.value = '';
  taskInput.focus();
});

// Initial load
loadTasks();
