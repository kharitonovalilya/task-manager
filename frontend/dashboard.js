const API = "http://localhost:8000/api/v1";

let teams = [];
let tasks = [];
let currentDate = new Date();

const monthNames = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];


// ======================= GLOBAL FUNCTIONS =======================

window.prevMonth = function () {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
};

window.nextMonth = function () {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
};

window.openCreateTeam = function () {
  const modal = document.getElementById("teamModal");
  if (modal) modal.style.display = "flex";
};

window.closeTeamModal = function () {
  const modal = document.getElementById("teamModal");
  if (modal) modal.style.display = "none";
};

window.createTeam = async function () {
  const token = localStorage.getItem("token");
  const nameInput = document.getElementById("teamNameInput");

  if (!nameInput) return;

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

    if (!res.ok) throw new Error();

    const newTeam = await res.json();

    teams.push(newTeam);
    renderTeams();

    nameInput.value = "";
    closeTeamModal();

  } catch (err) {
    console.error(err);
    alert("Ошибка создания команды");
  }
};


// ======================= CALENDAR =======================

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("monthTitle");

  if (!grid || !title) return;

  grid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  title.innerText = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weekdays = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

  // weekday headers
  weekdays.forEach(day => {
    const div = document.createElement("div");
    div.className = "calendar-weekday";
    div.innerText = day;
    grid.appendChild(div);
  });

  let startShift = firstDay === 0 ? 6 : firstDay - 1;

  // пустые клетки
  for (let i = 0; i < startShift; i++) {
    const div = document.createElement("div");
    div.className = "calendar-day empty";
    grid.appendChild(div);
  }

  // дни месяца
  for (let d = 1; d <= daysInMonth; d++) {
    const div = document.createElement("div");
    div.className = "calendar-day";

    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    div.innerHTML = `<b>${d}</b>`;

    const dayTasks = tasks.filter(t =>
      t.deadline && t.deadline.slice(0,10) === dateStr
    );

    dayTasks.forEach(task => {
      const dot = document.createElement("div");
      dot.className = "task-dot";
      dot.setAttribute("data-done", task.completed);

      dot.onclick = (e) => {
        e.stopPropagation();
        showTaskPopup(task);
      };

      div.appendChild(dot);
    });

    grid.appendChild(div);
  }
}


// ======================= API =======================

async function fetchTeams() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error();

    teams = await res.json();
    renderTeams();

  } catch (err) {
    console.error("Ошибка загрузки команд:", err);
  }
}

async function fetchTasks() {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error();

    tasks = await res.json();

    renderCalendar(); // 🔥 ключевой момент

  } catch (err) {
    console.error("Ошибка загрузки задач:", err);
  }
}


// ======================= TEAMS =======================

function renderTeams() {
  const container = document.getElementById("teamsList");
  if (!container) return;

  container.innerHTML = "";

  if (teams.length === 0) {
    container.innerHTML = "<div style='text-align:center;opacity:0.7'>Нет команд</div>";
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


// ======================= POPUP =======================

function showTaskPopup(task) {
  const popup = document.getElementById("taskPopup");
  if (!popup) return;

  document.getElementById("popupTitle").innerText = task.title;
  document.getElementById("popupDescription").innerText = task.description || "Нет описания";

  document.getElementById("popupInfo").innerText =
    `Дедлайн: ${task.deadline?.split('T')[0]} | User ID: ${task.user_id}`;

  popup.style.display = "flex";
}

window.closeTaskPopup = function () {
  const popup = document.getElementById("taskPopup");
  if (popup) popup.style.display = "none";
};


// ======================= INIT =======================

document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();
  fetchTeams();
  fetchTasks();
});



