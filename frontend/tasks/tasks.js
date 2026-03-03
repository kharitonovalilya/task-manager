// tasks.js — фронт без бэкенда, все задачи хранятся в массиве
const tasks = [
  { id: 1, title: "Сделать домашку", description: "Математика, страница 42" },
  { id: 2, title: "Купить продукты", description: "Хлеб, молоко, яйца" },
  { id: 3, title: "Почитать книгу", description: "Глава 3, 4" }
];

// Отображение задач
function renderTasks() {
  const container = document.getElementById("tasksList");
  container.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";

    div.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description || ""}</p>
      <button class="delete-btn" onclick="deleteTask(${task.id})">Удалить</button>
    `;

    container.appendChild(div);
  });
}

// Удаление задачи
function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) tasks.splice(index, 1);
  renderTasks();
}

// Создание новой задачи
function createTask() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  if (!title) {
    alert("Введите название задачи");
    return;
  }

  const newTask = {
    id: Date.now(),
    title,
    description
  };

  tasks.push(newTask);
  renderTasks();

  // Очистка полей
  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
}

// Кнопка "Выйти"
function logout() {
  alert("Выход (пока без бекенда)");
}

// Первоначальный рендер задач
renderTasks();