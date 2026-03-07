const API = "http://localhost:8000/api/v1";

let teams = [];
let tasks = [];

// ======================= FETCH DATA ==========================
async function fetchTeams() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API}/teams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Ошибка загрузки команд: ${res.status}`);
    teams = await res.json();
    renderTeams();
  } catch (err) {
    console.error('fetchTeams error:', err);
    alert('Не удалось загрузить список команд');
  }
}

async function fetchTasks() {
  const token = localStorage.getItem('token');
  if (!token) return; // без токена задачи не загружаем

  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Ошибка загрузки задач: ${res.status}`);
    tasks = await res.json();
    renderCalendar();
  } catch (err) {
    console.error('fetchTasks error:', err);
  }
}

// ======================= RENDER TEAMS ========================
function renderTeams() {
  const container = document.getElementById("teamsList");
  if (!container) return;
  container.innerHTML = "";

  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "team-card";
    div.textContent = team.name;
    div.onclick = () => {
      // Переход на страницу задач команды с параметром teamId
      window.location.href = `team-tasks.html?teamId=${team.id}`;
    };
    container.appendChild(div);
  });
}

// ======================= RENDER CALENDAR ====================
function renderCalendar(year = 2026, month = 2) {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  weekdays.forEach(day => {
    const div = document.createElement("div");
    div.className = "calendar-weekday";
    div.textContent = day;
    grid.appendChild(div);
  });

  const firstDay = new Date(year, month, 1).getDay(); // 0 = воскресенье
  // Корректировка: понедельник = 0, воскресенье = 6
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < adjustedFirstDay; i++) {
    grid.appendChild(document.createElement("div"));
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = day;

    // Ищем задачи, у которых deadline совпадает с этой датой
    tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr)).forEach(task => {
      const dot = document.createElement("div");
      dot.className = "task-dot";
      dot.dataset.done = task.completed; // используем completed с бэкенда
      dot.title = task.title;
      dayDiv.appendChild(dot);
    });

    grid.appendChild(dayDiv);
  }
}

// ======================= SHOW TASKS BY DATE =================
function showTasksByDate() {
  const dateInput = document.getElementById("calendar");
  if (!dateInput) return;

  const date = dateInput.value;
  const container = document.getElementById("tasksByDate");
  if (!container) return;

  container.innerHTML = "";

  const filteredTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(date));
  if (filteredTasks.length === 0) {
    container.textContent = "Нет задач на эту дату";
    return;
  }

  filteredTasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";
    if (task.completed) div.classList.add("done");

    div.innerHTML = `
      <span>${task.title}</span>
      <input type="checkbox" ${task.completed ? "checked" : ""} onchange="toggleDone(${task.id}, this)">
    `;
    container.appendChild(div);
  });
}

// ======================= TOGGLE DONE =======================
async function toggleDone(id, checkbox) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const newStatus = checkbox.checked;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    const res = await fetch(`${API}/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ completed: newStatus }) // бэкенд ожидает completed
    });

    if (!res.ok) throw new Error(`Ошибка обновления: ${res.status}`);

    // Обновляем локальное состояние
    task.completed = newStatus;
    showTasksByDate(); // обновляем отображение, если окно открыто
  } catch (err) {
    console.error("Ошибка обновления задачи:", err);
    // Возвращаем чекбокс в исходное состояние
    checkbox.checked = !newStatus;
    alert("Не удалось обновить задачу");
  }
}

// ======================= INIT ===============================
fetchTeams();
fetchTasks();