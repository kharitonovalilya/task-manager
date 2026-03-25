const API = "http://localhost:8000/api/v1";

let teams = [];
let tasks = [];
let currentUser = null;
let currentDate = new Date();

const monthNames = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

// ======================= ИНИЦИАЛИЗАЦИЯ =======================

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("Токен отсутствует, перенаправление на вход...");
    window.location.href = "login.html";
    return;
  }

  // Загружаем данные последовательно
  await fetchMe();    // 1. Узнаем кто мы
  await fetchTeams(); // 2. Загружаем наши команды
  await fetchTasks(); // 3. Загружаем наши задачи

  // Рисуем календарь после получения всех данных
  renderCalendar();
});

// ======================= API ЗАПРОСЫ =======================

// Получаем профиль текущего пользователя
async function fetchMe() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      currentUser = await res.json();
      console.log("Вы вошли как:", currentUser.email);
    } else {
      throw new Error("Сессия истекла");
    }
  } catch (err) {
    console.error("Ошибка профиля:", err);
    window.location.href = "login.html";
  }
}

// Получаем команды, в которых состоит пользователь
async function fetchTeams() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/teams`, { 
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    teams = await res.json();
    renderTeams();
  } catch (err) {
    console.error("Ошибка загрузки команд:", err);
  }
}

// Получаем задачи пользователя
async function fetchTasks() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/tasks`, { 
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    tasks = await res.json();
    // Календарь перерисуется сам после вызова этой функции в init
  } catch (err) {
    console.error("Ошибка загрузки задач:", err);
  }
}

// Создание новой команды
window.createTeam = async function () {
  const token = localStorage.getItem("token");
  const nameInput = document.getElementById("teamNameInput");
  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) return alert("Введите название команды");

  try {
    const res = await fetch(`${API}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error("Ошибка при создании");

    const newTeam = await res.json();
    teams.push(newTeam); // Добавляем в локальный массив
    renderTeams();       // Перерисовываем список слева
    
    nameInput.value = "";
    closeTeamModal();
  } catch (err) {
    alert("Не удалось создать команду: " + err.message);
  }
};

// ======================= ЛОГИКА КАЛЕНДАРЯ =======================

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("monthTitle");
  if (!grid || !title) return;

  // ОЧИСТКА: самое важное, чтобы сетка не росла бесконечно
  grid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  title.innerText = `${monthNames[month]} ${year}`;

  // 1. Добавляем заголовки дней недели
  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  weekDays.forEach(day => {
    const div = document.createElement("div");
    div.className = "calendar-weekday";
    div.innerText = day;
    grid.appendChild(div);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Смещение (JS: 0 - Вс, 1 - Пн... 6 - Сб)
  let startShift = firstDay === 0 ? 6 : firstDay - 1;

  for (let i = 0; i < startShift; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day empty";
    grid.appendChild(div);
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

 for (let d = 1; d <= daysInMonth; d++) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    if (dateStr === todayStr) div.classList.add("today");

    div.innerHTML = `<b>${d}</b>`;

    // ОБНОВЛЕННЫЙ ФИЛЬТР: проверяем дату И принадлежность пользователю
    const dayTasks = tasks.filter(t => {
      const isSameDate = t.deadline && t.deadline.startsWith(dateStr);
      // Сравниваем ID создателя задачи с ID текущего пользователя
      const isMyTask = Number(t.user_id) === Number(currentUser?.id); 
      
      return isSameDate && isMyTask;
    });

    const dotsContainer = document.createElement("div");
    dotsContainer.className = "task-dots-container";


    dayTasks.forEach(task => {
      const dot = document.createElement("div");
      dot.className = "task-dot";
      // Используем аттрибут для CSS (красный/зеленый)
      dot.setAttribute("data-done", task.completed);
      
      dot.onclick = (e) => {
        e.stopPropagation();
        showTaskPopup(task);
      };
      dotsContainer.appendChild(dot);
    });

    div.appendChild(dotsContainer);
    grid.appendChild(div);
  }
}
// ======================= UI ФУНКЦИИ =======================

function renderTeams() {
  const container = document.getElementById("teamsList");
  if (!container) return;

  container.innerHTML = "";
  if (teams.length === 0) {
    container.innerHTML = "<div style='text-align:center;opacity:0.7;margin-top:20px'>У вас пока нет команд</div>";
    return;
  }

  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "team-card";
    div.textContent = team.name;
    div.onclick = () => {
      window.location.href = `team-tasks.html?teamId=${team.id}`;
    };
    container.appendChild(div);
  });
}
function showTaskPopup(task) {
  const popup = document.getElementById("taskPopup");
  if (!popup) return;

  // Ищем название команды по team_id из нашего массива команд
  const team = teams.find(t => Number(t.id) === Number(task.team_id));
  const teamName = team ? team.name : "Личная задача";

  document.getElementById("popupTitle").innerText = task.title;
  document.getElementById("popupDescription").innerText = task.description || "Описание отсутствует";
  
  const deadline = task.deadline ? task.deadline.split('T')[0] : "Нет";
  const status = task.completed ? "✅ Сделано" : "⏳ В работе";

  document.getElementById("popupInfo").innerHTML = `
    <b>Команда:</b> ${teamName}<br>
    <b>Дедлайн:</b> ${deadline}<br>
    <b>Статус:</b> ${status}
  `;

  popup.style.display = "flex";
}

// Глобальные обработчики для кнопок в HTML
window.prevMonth = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
window.nextMonth = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };
window.openCreateTeam = () => { document.getElementById("teamModal").style.display = "flex"; };
window.closeTeamModal = () => { document.getElementById("teamModal").style.display = "none"; };
window.closeTaskPopup = () => { document.getElementById("taskPopup").style.display = "none"; };




