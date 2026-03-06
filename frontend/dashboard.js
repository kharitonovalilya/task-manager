let teams = [];
let tasks = [];

// ======================= FETCH DATA ==========================
async function fetchTeams() {
  try {
    const res = await fetch("http://localhost:3000/teams");
    teams = await res.json();
    renderTeams();
  } catch (err) { console.error(err); }
}

async function fetchTasks() {
  try {
    const res = await fetch("http://localhost:3000/tasks");
    tasks = await res.json();
    renderCalendar();
  } catch (err) { console.error(err); }
}

// ======================= RENDER TEAMS ========================
function renderTeams() {
  const container = document.getElementById("teamsList");
  container.innerHTML = "";
  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "team-card";
    div.textContent = team.name;
    div.onclick = () => alert(`Переход к задачам команды ${team.name}`);
    container.appendChild(div);
  });
}

// ======================= RENDER CALENDAR ====================
function renderCalendar(year = 2026, month = 2) {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  weekdays.forEach(day => {
    const div = document.createElement("div");
    div.className = "calendar-weekday";
    div.textContent = day;
    grid.appendChild(div);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${(month+1).toString().padStart(2,"0")}-${day.toString().padStart(2,"0")}`;
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = day;

    tasks.filter(t => t.due === dateStr).forEach(task => {
      const dot = document.createElement("div");
      dot.className = "task-dot";
      dot.dataset.done = task.done;
      dot.title = task.title;
      dayDiv.appendChild(dot);
    });

    grid.appendChild(dayDiv);
  }
}

// ======================= SHOW TASKS BY DATE =================
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

// ======================= TOGGLE DONE =======================
async function toggleDone(id, checkbox) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.done = checkbox.checked;
  showTasksByDate();

  try {
    await fetch(`http://localhost:3000/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: task.done })
    });
  } catch (err) {
    console.error("Ошибка обновления задачи:", err);
  }
}

// ======================= INIT ===============================
fetchTeams();
fetchTasks();