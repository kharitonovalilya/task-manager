const API = "http://localhost:8000/api/v1";

let teams = [];
let tasks = [];
let currentDate = new Date();

const monthNames = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

// ======================= ГЛОБАЛЬНЫЕ ФУНКЦИИ =======================
// Объявляем функции ДО того, как они будут использованы в HTML
window.prevMonth = function() {
  console.log("Клик: прошлый месяц");
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};

window.nextMonth = function() {
  console.log("Клик: следующий месяц");
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

window.openCreateTeam = function() {
  const modal = document.getElementById("teamModal");
  if (modal) {
    modal.style.display = "flex";
  } else {
    console.error("Modal element not found");
  }
};

window.closeTeamModal = function() {
  const modal = document.getElementById("teamModal");
  if (modal) {
    modal.style.display = "none";
  }
};

window.createTeam = async function() {
  const token = localStorage.getItem('token');
  const nameInput = document.getElementById("teamNameInput");
  
  if (!nameInput) {
    console.error("Team name input not found");
    return;
  }
  
  const name = nameInput.value.trim();

  if (!name) {
    alert("Введите название команды");
    return;
  }

  try {
    const res = await fetch(`${API}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error("Ошибка создания команды");

    const newTeam = await res.json();
    teams.push(newTeam);
    renderTeams();

    nameInput.value = "";
    window.closeTeamModal();

  } catch (err) {
    console.error(err);
    alert("Не удалось создать команду");
  }
};

// ======================= КАЛЕНДАРЬ =======================
function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("monthTitle");

  if (!grid) {
    console.error("Calendar grid element not found");
    return;
  }
  
  if (!title) {
    console.error("Month title element not found");
    return;
  }

  grid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Устанавливаем название месяца
  title.innerText = `${monthNames[month]} ${year}`;

  // Дни недели
  const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  weekdays.forEach(day => {
    const div = document.createElement("div");
    div.className = "calendar-weekday";
    div.innerText = day;
    grid.appendChild(div);
  });

  // Расчет дней в месяце
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Смещение для понедельника как первого дня
  let startShift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Пустые ячейки перед первым днем
  for (let i = 0; i < startShift; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day empty";
    grid.appendChild(div);
  }

  // Дни месяца
  for (let d = 1; d <= daysInMonth; d++) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    div.innerHTML = `<b>${d}</b>`;
    grid.appendChild(div);
  }
}

// ======================= API ЗАПРОСЫ =======================
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
  if (!container) {
    console.error("Teams list container not found");
    return;
  }
  
  if (!Array.isArray(teams)) return;

  container.innerHTML = "";
  
  if (teams.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "Нет созданных команд";
    emptyMessage.style.textAlign = "center";
    emptyMessage.style.padding = "20px";
    emptyMessage.style.opacity = "0.7";
    container.appendChild(emptyMessage);
  } else {
    teams.forEach(team => {
      const div = document.createElement("div");
      div.className = "team-card";
      div.textContent = team.name;
      div.onclick = () => window.location.href = `team-tasks.html?teamId=${team.id}`;
      container.appendChild(div);
    });
  }
}

// ======================= ИНИЦИАЛИЗАЦИЯ =======================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM загружен, инициализация...");
  
  // Проверяем наличие элементов
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("monthTitle");
  const teamsList = document.getElementById("teamsList");
  const teamModal = document.getElementById("teamModal");
  
  console.log("Calendar grid found:", !!grid);
  console.log("Month title found:", !!title);
  console.log("Teams list found:", !!teamsList);
  console.log("Team modal found:", !!teamModal);
  
  // Рендерим календарь
  renderCalendar();
  
  // Загружаем данные
  fetchTeams();
  fetchTasks();
});

// Дополнительная проверка, что все функции доступны глобально
console.log("Global functions check:");
console.log("prevMonth defined:", typeof window.prevMonth === "function");
console.log("nextMonth defined:", typeof window.nextMonth === "function");
console.log("openCreateTeam defined:", typeof window.openCreateTeam === "function");
console.log("closeTeamModal defined:", typeof window.closeTeamModal === "function");
console.log("createTeam defined:", typeof window.createTeam === "function");



