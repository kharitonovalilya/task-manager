const API = "http://localhost:8000/api/v1";

let teams = [];
let tasks = [];
let currentUser = null;
let currentDate = new Date();

const monthNames = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  await fetchMe();
  await fetchTeams();
  populateTeamSelect();
  await fetchTasksForTeam();
});

async function fetchMe() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      currentUser = await res.json();
    } else {
      throw new Error("Сессия истекла");
    }
  } catch (err) {
    console.error(err);
    window.location.href = "login.html";
  }
}

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

async function fetchTasksForTeam(teamId = null) {
  const token = localStorage.getItem("token");
  let url = `${API}/tasks/`;
  if (teamId) {
    url += `?team_id=${teamId}`;
  }
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Ошибка загрузки задач");
    const allTasks = await res.json();
    tasks = allTasks.filter(t => Number(t.user_id) === Number(currentUser?.id));
    renderCalendar();
  } catch (err) {
    console.error("Ошибка загрузки задач:", err);
  }
}

async function deleteTeam(teamId) {
  const token = localStorage.getItem("token");
  if (!token) return;

  const confirmed = confirm("Вы уверены, что хотите удалить команду? Все задачи и участники будут удалены.");
  if (!confirmed) return;

  try {
    const res = await fetch(`${API}/teams/${teamId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      teams = teams.filter(t => t.id !== teamId);
      renderTeams();         
      populateTeamSelect();   
    } else {
      const err = await res.json();
      alert("Ошибка удаления: " + (err.detail || "Недостаточно прав"));
    }
  } catch (err) {
    alert("Ошибка соединения с сервером");
  }
}

function populateTeamSelect() {
  const select = document.getElementById("teamSelect");
  if (!select) return;
  select.innerHTML = '<option value="">Все команды</option>';
  teams.forEach(team => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.name;
    select.appendChild(option);
  });
  select.onchange = function() {
    const teamId = this.value;
    fetchTasksForTeam(teamId ? parseInt(teamId) : null);
  };
}

window.applyTeamFilter = function() {
  const select = document.getElementById("teamSelect");
  const teamId = select.value;
  fetchTasksForTeam(teamId ? parseInt(teamId) : null);
};

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
    populateTeamSelect();

    nameInput.value = "";
    closeTeamModal();
  } catch (err) {
    alert("Не удалось создать команду: " + err.message);
  }
};

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("monthTitle");
  if (!grid || !title) return;

  grid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  title.innerText = `${monthNames[month]} ${year}`;

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  weekDays.forEach(day => {
    const div = document.createElement("div");
    div.className = "calendar-weekday";
    div.innerText = day;
    grid.appendChild(div);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
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

    const dayTasks = tasks.filter(t => t.deadline && t.deadline.startsWith(dateStr));

    const dotsContainer = document.createElement("div");
    dotsContainer.className = "task-dots-container";

    dayTasks.forEach(task => {
      const dot = document.createElement("div");
      dot.className = "task-dot";
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

function renderTeams() {
  const container = document.getElementById("teamsList");
  if (!container) return;

  container.innerHTML = "";
  if (teams.length === 0) {
    container.innerHTML = "<div style='text-align:center;opacity:0.7;margin-top:20px'>У вас пока нет команд</div>";
    return;
  }

  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "team-card";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = team.name;
    nameSpan.style.cursor = "pointer";
    nameSpan.onclick = () => window.location.href = `team-tasks.html?teamId=${team.id}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";  
    deleteBtn.className = "delete-team-btn";
    deleteBtn.title = "Удалить команду";
    deleteBtn.onclick = (e) => {
    e.stopPropagation();
    deleteTeam(team.id);
};
    if (currentUser && team.lead_id === currentUser.id) {
      card.appendChild(nameSpan);
      card.appendChild(deleteBtn);
    } else {
      card.appendChild(nameSpan);
    }

    container.appendChild(card);
  });
}

function showTaskPopup(task) {
  const popup = document.getElementById("taskPopup");
  if (!popup) return;

  const team = teams.find(t => Number(t.id) === Number(task.team_id));
  const teamName = team ? team.name : "Личная задача";

  document.getElementById("popupTitle").innerText = task.title;
  document.getElementById("popupDescription").innerText = task.description || "Описание отсутствует";

  const deadline = task.deadline ? task.deadline.split('T')[0] : "Нет";
  const status = task.completed ? "Сделано" : "В работе";

  document.getElementById("popupInfo").innerHTML = `
    <b>Команда:</b> ${teamName}<br>
    <b>Дедлайн:</b> ${deadline}<br>
    <b>Статус:</b> ${status}
  `;

  popup.style.display = "flex";
}

window.prevMonth = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
window.nextMonth = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };
window.openCreateTeam = () => { document.getElementById("teamModal").style.display = "flex"; };
window.closeTeamModal = () => { document.getElementById("teamModal").style.display = "none"; };
window.closeTaskPopup = () => { document.getElementById("taskPopup").style.display = "none"; };