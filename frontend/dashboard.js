

// Отображаем команды
function renderTeams() {
  const container = document.getElementById("teamsList");
  container.innerHTML = "";
  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "team-card";
    div.textContent = team.name;
    div.onclick = () => {
      alert(`Переход к задачам команды ${team.name} (потом можно перейти на team-tasks.html)`);
    };
    container.appendChild(div);
  });
}

// Показ задач по выбранной дате в календаре
function showTasksByDate() {
  const date = document.getElementById("calendar").value;
  const container = document.getElementById("tasksByDate");
  container.innerHTML = "";

  const filteredTasks = tasks.filter(t => t.due === date);
  if (filteredTasks.length === 0) {
    container.textContent = "Нет задач на эту дату";
    return;
  }

  filteredTasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";
    if (task.done) div.classList.add("done");

    div.innerHTML = `
      <span>${task.title}</span>
      <input type="checkbox" ${task.done ? "checked" : ""} onchange="toggleDone(${task.id}, this)">
    `;
    container.appendChild(div);
  });
}

// Переключение выполнено/не выполнено
function toggleDone(id, checkbox) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = checkbox.checked;
  showTasksByDate(); // обновляем отображение
}



const teams = [
  { id: 1, name: "Команда А" },
  { id: 2, name: "Команда Б" }
];

const tasks = [
  { id: 1, teamId: 1, title: "Сделать домашку", done: false, due: "2026-03-05" },
  { id: 2, teamId: 1, title: "Прочитать книгу", done: true, due: "2026-03-06" },
  { id: 3, teamId: 2, title: "Купить продукты", done: false, due: "2026-03-05" },
];

// Отображение команд
function renderTeams() {
  const container = document.getElementById("teamsList");
  container.innerHTML = "";
  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "team-card";
    div.textContent = team.name;
    div.onclick = () => {
      alert(`Переход к задачам команды ${team.name}`);
    };
    container.appendChild(div);
  });
}

// Рендер календаря текущего месяца
function renderCalendar(year = 2026, month = 2) {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  // дни недели
  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  weekdays.forEach(day => {
    const div = document.createElement("div");
    div.className = "calendar-weekday";
    div.textContent = day;
    grid.appendChild(div);
  });

  const firstDay = new Date(year, month, 1).getDay(); // день недели первого числа
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // добавляем пустые дни перед первым числом
  for (let i = 0; i < firstDay; i++) {
    const emptyDiv = document.createElement("div");
    grid.appendChild(emptyDiv);
  }

  // создаем дни месяца
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-0${month+1}-${day < 10 ? '0'+day : day}`;
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = day;

    const dayTasks = tasks.filter(t => t.due === dateStr);
    dayTasks.forEach(task => {
      const dot = document.createElement("div");
      dot.className = "task-dot";
      dot.dataset.done = task.done;
      dot.title = task.title;
      dayDiv.appendChild(dot);
    });

    grid.appendChild(dayDiv);
  }
}

renderTeams();
renderCalendar();