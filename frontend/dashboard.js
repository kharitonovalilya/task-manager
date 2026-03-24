const API = "http://localhost:8000/api/v1";

let teams = [];
let tasks = [];
let currentDate = new Date();

// ОЧЕНЬ ВАЖНО: привязываем к window, чтобы HTML их видел
window.prevMonth = function () {
  console.log("Клик: прошлый месяц");
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};

window.nextMonth = function () {
  console.log("Клик: следующий месяц");
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

const monthNames = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Сначала рисуем интерфейс, который не зависит от сервера
  renderCalendar();
  
  // 2. Затем загружаем данные
  fetchTeams();
  fetchTasks();
});

// ======================= CALENDAR LOGIC =======================
function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("monthTitle");

  if (!grid || !title) return;

  grid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Устанавливаем название месяца
  title.innerText = `${monthNames[month]} ${year}`;

  // Логика расчета дней
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  weekdays.forEach(day => {
    const div = document.createElement("div");
    div.className = "calendar-weekday";
    div.innerText = day;
    grid.appendChild(div);
  });

  // Смещение (Пн - первый день)
  let startShift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  for (let i = 0; i < startShift; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day empty";
    grid.appendChild(div);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    div.innerHTML = `<b>${d}</b>`;
    grid.appendChild(div);
  }
}

// Привязываем функции к window ПРЯМО СЕЙЧАС, чтобы они были доступны кнопкам


// ======================= API FETCHING =======================
async function fetchTeams() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn("Токен отсутствует, перенаправление...");
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API}/teams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Ошибка сервера");
    
    teams = await res.json();
    renderTeams();
  } catch (err) {
    console.error("Ошибка загрузки команд:", err);
  }
}

async function fetchTasks() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) tasks = await res.json();
  } catch (err) {
    console.error("Ошибка загрузки задач:", err);
  }
}

function renderTeams() {
  const container = document.getElementById("teamsList");
  if (!container || !Array.isArray(teams)) return;

  container.innerHTML = "";
  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "team-card";
    div.textContent = team.name;
    div.onclick = () => window.location.href = `team-tasks.html?teamId=${team.id}`;
    container.appendChild(div);
  });
}

window.openCreateTeam = function () {
  alert("Создание команды в разработке");
};

