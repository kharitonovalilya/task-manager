const allTasks = [
  { id: 1, teamId: 1, title: "Сделать домашку", done: false },
  { id: 2, teamId: 1, title: "Прочитать книгу", done: true },
  { id: 3, teamId: 2, title: "Купить продукты", done: false },
];

const teamId = parseInt(localStorage.getItem("selectedTeamId"));
const teamNameEl = document.getElementById("teamName");
teamNameEl.textContent = `Задачи команды ${teamId}`;

// Фильтруем задачи выбранной команды
let tasks = allTasks.filter(t => t.teamId === teamId);

function renderTasks() {
  const container = document.getElementById("tasksList");
  container.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";
    div.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleDone(${task.id}, this)">
      <span>${task.title}</span>
      <button class="delete-btn" onclick="deleteTask(${task.id})">Удалить</button>
    `;
    container.appendChild(div);
  });
}

function toggleDone(id, checkbox) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = checkbox.checked;
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

function createTask() {
  const title = document.getElementById("title").value;
  if (!title) return alert("Введите название задачи");

  const newTask = { id: Date.now(), teamId, title, done: false };
  tasks.push(newTask);
  renderTasks();
  document.getElementById("title").value = "";
}

function goBack() {
  window.location.href = "teams.html";
}

renderTasks();