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
    teams.push(newTeam);
    renderTeams();
    
    nameInput.value = "";
    closeTeamModal();
  } catch (err) {
    alert(err.message);
  }
};

// ======================= ЛОГИКА КАЛЕНДАРЯ =======================

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const monthTitle = document.getElementById("monthTitle");
  
  grid.innerHTML = "";
  
  // Устанавливаем заголовок (Месяц Год)
  monthTitle.innerText = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Находим данные о текущей реальной дате (сегодня)
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  // 1. Расчет отступов (пустые ячейки, если месяц начинается не с понедельника)
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  // В JS 0 - это воскресенье, превращаем в 0 - понедельник ... 6 - воскресенье
  const shift = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  for (let i = 0; i < shift; i++) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "calendar-day empty";
    grid.appendChild(emptyDiv);
  }

  // 2. Рисуем дни месяца
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.innerText = d;

    // ПРОВЕРКА НА "СЕГОДНЯ"
    if (d === todayDay && month === todayMonth && year === todayYear) {
      dayDiv.classList.add("today");
    }

    // 3. Отображение задач для этого дня
    // Формируем строку даты в формате YYYY-MM-DD для сравнения с дедлайном
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Ищем задачи, у которых deadline совпадает с этой датой
    const dayTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr));

    dayTasks.forEach(task => {
      const taskEl = document.createElement("div");
      taskEl.className = "calendar-task-item";
      if (task.completed) taskEl.classList.add("task-done");
      
      // Показываем кусочек названия задачи
      taskEl.innerText = task.title;
      
      // Клик по задаче открывает подробности
      taskEl.onclick = (e) => {
        e.stopPropagation(); // чтобы не сработал клик по ячейке
        showTaskDetails(task);
      };
      
      dayDiv.appendChild(taskEl);
    });

    grid.appendChild(dayDiv);
  }
}

// Вспомогательная функция для показа деталей задачи в поп-апе
function showTaskDetails(task) {
  document.getElementById("popupTitle").innerText = task.title;
  document.getElementById("popupDescription").innerText = task.description || "Нет описания";
  
  const status = task.completed ? "✅ Выполнено" : "⏳ В работе";
  document.getElementById("popupInfo").innerText = `Статус: ${status}`;
  
  document.getElementById("taskPopup").style.display = "flex";
}

function closeTaskPopup() {
  document.getElementById("taskPopup").style.display = "none";
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

  document.getElementById("popupTitle").innerText = task.title;
  document.getElementById("popupDescription").innerText = task.description || "Описание отсутствует";
  document.getElementById("popupInfo").innerText = 
    `Срок: ${task.deadline?.split('T')[0]} | Статус: ${task.completed ? 'Выполнено' : 'В работе'}`;

  popup.style.display = "flex";
}

// Глобальные обработчики для кнопок в HTML
window.prevMonth = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
window.nextMonth = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };
window.openCreateTeam = () => { document.getElementById("teamModal").style.display = "flex"; };
window.closeTeamModal = () => { document.getElementById("teamModal").style.display = "none"; };
window.closeTaskPopup = () => { document.getElementById("taskPopup").style.display = "none"; };



