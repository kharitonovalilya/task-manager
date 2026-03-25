const API = "http://localhost:8000/api/v1";

const params = new URLSearchParams(window.location.search);
const teamId = params.get("teamId");

let tasks = [];
let teamMembers = [];
let isLeader = false;
let currentUserId = null;

// Два независимых фильтра
let executorFilter = "all";   // "all" или "my"
let statusFilter = "all";     // "all", "done", "not_done"

// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => {
  if (!teamId) {
    alert("Ошибка: не указана команда");
    window.location.href = "dashboard.html";
    return;
  }
  init();
});

async function init() {
  await loadTeamInfo();
  await loadMembers();
  await loadTasks();
}

// ================= TEAM INFO =================

async function loadTeamInfo() {
  const token = localStorage.getItem("token");
  try {
    const teamRes = await fetch(`${API}/teams/${teamId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const team = await teamRes.json();
    document.getElementById("teamTitle").innerText = team.name;

    const meRes = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const me = await meRes.json();

    currentUserId = Number(me.id);
    isLeader = Number(team.lead_id) === currentUserId;

    updateLeaderUI();
  } catch (e) {
    console.error(e);
  }
}

function updateLeaderUI() {
  const createTaskBtn = document.getElementById("createTaskBtn");
  const addMemberBtn = document.getElementById("addMemberBtn");
  const container = document.querySelector(".team-page");

  if (!isLeader) {
    if (createTaskBtn) createTaskBtn.style.display = "none";
    if (addMemberBtn) addMemberBtn.style.display = "none";
    container.classList.remove("is-leader");
  } else {
    if (createTaskBtn) createTaskBtn.style.display = "inline-block";
    if (addMemberBtn) addMemberBtn.style.display = "inline-block";
    container.classList.add("is-leader");
  }
}

// ================= MEMBERS =================

async function loadMembers() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/teams/${teamId}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    teamMembers = await res.json();
  } catch (e) {
    console.error("Ошибка загрузки участников:", e);
  }
}

function fillMembersSelects() {
  const taskSelect = document.getElementById("taskUser");
  const editSelect = document.getElementById("editTaskUser");

  const optionsHtml = '<option value="">Выберите исполнителя</option>' +
    teamMembers.map(m => `<option value="${m.id}">${m.email}</option>`).join("");

  if (taskSelect) taskSelect.innerHTML = optionsHtml;
  if (editSelect) editSelect.innerHTML = optionsHtml;
}

// ================= LOAD TASKS =================

async function loadTasks() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/teams/${teamId}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    tasks = await res.json();
    renderTasks();
  } catch (e) {
    console.error(e);
  }
}

// ================= RENDER =================
function renderTasks() {
  const container = document.getElementById("tasksContainer");
  if (!container) return;

  container.innerHTML = "";

  // 1. Фильтр по исполнителю
  let filtered = tasks;
  if (executorFilter === "my") {
    filtered = filtered.filter(task => Number(task.user_id) === Number(currentUserId));
  }

  // 2. Фильтр по статусу
  if (statusFilter === "done") {
    filtered = filtered.filter(task => task.completed);
  } else if (statusFilter === "not_done") {
    filtered = filtered.filter(task => !task.completed);
  }

  if (filtered.length === 0) {
    container.innerHTML = "<p style='text-align:center;opacity:0.6'>Задач пока нет</p>";
    return;
  }

  filtered.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";
    if (task.completed) div.classList.add("done");

    const taskOwnerId = Number(task.user_id);
    const myId = Number(currentUserId);
    const isAssignee = taskOwnerId === myId;
    const canToggle = isLeader || isAssignee;

    if (isAssignee) div.classList.add("my-task");

    const member = teamMembers.find(m => Number(m.id) === taskOwnerId);
    const userEmail = member ? member.email : `ID: ${task.user_id}`;

    div.innerHTML = `
      <div class="task-left">
        <button
          class="done-btn ${task.completed ? "completed" : ""}"
          ${canToggle ? `onclick="toggleTask(${task.id}, this)"` : "disabled"}
          style="${canToggle ? 'cursor: pointer; opacity: 1;' : 'cursor: not-allowed; opacity: 0.3;'}"
        >
          ✔
        </button>
      </div>

      <div class="task-content">
        <b>${task.title}</b><br>
        <span style="font-size: 0.9em; opacity: 0.8;">${task.description || ""}</span><br>
        <small>Дедлайн: ${task.deadline ? task.deadline.split("T")[0] : "-"}</small><br>
        <small>Исполнитель: ${userEmail} ${isAssignee ? "<b style='color: #ff7a18;'>(Вы)</b>" : ""}</small>
      </div>

      ${isLeader ? `
      <div class="task-right" style="display: flex !important;">
        <button onclick="handleEdit(${task.id})">✏️</button>
        <button onclick="handleDelete(${task.id})">🗑</button>
      </div>
      ` : ''}
    `;

    container.appendChild(div);
  });
}

// ================= FILTERS =================

// Верхние кнопки (исполнитель)
function showMyTasks() {
  executorFilter = "my";
  renderTasks();
}

function showAllTasks() {
  executorFilter = "all";
  renderTasks();
}

// Нижние кнопки (статус)
function setStatusFilter(filter) {
  statusFilter = filter;
  renderTasks();
}

// ================= TASK ACTIONS =================

async function toggleTask(id, button) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${API}/tasks/${id}/toggle-complete`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      loadTasks();
    } else if (res.status === 403) {
      alert("Ошибка доступа: вы не лидер и не исполнитель этой задачи");
    }
  } catch (e) {
    alert("Ошибка обновления");
  }
}

// ================= CREATE =================

function clearTaskForm() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskDeadline").value = "";
  document.getElementById("taskUser").value = "";
}

function createTask() {
  const token = localStorage.getItem("token");
  const userIdValue = document.getElementById("taskUser").value;
  if (!userIdValue) {
    alert("Пожалуйста, выберите исполнителя");
    return;
  }

  const data = {
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDescription").value,
    deadline: document.getElementById("taskDeadline").value || null,
    user_id: parseInt(userIdValue),
    team_id: Number(teamId)
  };

  fetch(`${API}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
    .then(res => {
      if (res.ok) {
        closeModal();
        loadTasks();
        clearTaskForm();
      } else {
        return res.json().then(err => { throw new Error(err.detail || "Ошибка создания задачи"); });
      }
    })
    .catch(e => alert("Ошибка создания задачи: " + e.message));
}

// ================= DELETE =================

function handleDelete(id) {
  if (!isLeader) {
    alert("Только лидер может удалять задачи");
    return;
  }
  if (confirm("Удалить задачу?")) {
    deleteTask(id);
  }
}

async function deleteTask(id) {
  const token = localStorage.getItem("token");
  try {
    await fetch(`${API}/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    loadTasks();
  } catch (e) {
    alert("Ошибка удаления");
  }
}

// ================= EDIT =================

let editingTaskId = null;

function handleEdit(id) {
  if (!isLeader) {
    alert("Только лидер может редактировать задачи");
    return;
  }
  openEditModal(id);
}

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  editingTaskId = id;

  fillMembersSelects();

  document.getElementById("editTaskTitle").value = task.title;
  document.getElementById("editTaskDescription").value = task.description || "";
  document.getElementById("editTaskDeadline").value = task.deadline?.split("T")[0] || "";
  document.getElementById("editTaskUser").value = task.user_id || "";

  document.getElementById("editTaskModal").style.display = "flex";
}

function saveTaskEdit() {
  const token = localStorage.getItem("token");
  const userIdValue = document.getElementById("editTaskUser").value;
  if (!userIdValue) {
    alert("Пожалуйста, выберите исполнителя");
    return;
  }

  const data = {
    title: document.getElementById("editTaskTitle").value,
    description: document.getElementById("editTaskDescription").value,
    deadline: document.getElementById("editTaskDeadline").value || null,
    user_id: parseInt(userIdValue)
  };

  fetch(`${API}/tasks/${editingTaskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
    .then(res => {
      if (res.ok) {
        closeEditModal();
        loadTasks();
      } else {
        return res.json().then(err => { throw new Error(err.detail || "Ошибка редактирования"); });
      }
    })
    .catch(e => alert("Ошибка редактирования: " + e.message));
}

function closeEditModal() {
  document.getElementById("editTaskModal").style.display = "none";
}

// ================= MODALS =================

function openModal() {
  fillMembersSelects();
  document.getElementById("taskModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("taskModal").style.display = "none";
}

function goBack() {
  window.location.href = "dashboard.html";
}

// ================= MEMBER ACTIONS =================

function openMemberModal() {
  document.getElementById("memberModal").style.display = "flex";
}

function closeMemberModal() {
  document.getElementById("memberModal").style.display = "none";
  document.getElementById("memberEmail").value = "";
}

function addMemberByEmail() {
  const token = localStorage.getItem("token");
  const email = document.getElementById("memberEmail").value.trim();

  if (!email) {
    alert("Введите email");
    return;
  }

  fetch(`${API}/teams/${teamId}/members/add-by-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ email })
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        alert("Пользователь успешно добавлен в команду!");
        closeMemberModal();
        loadMembers();
        loadTasks();
      } else {
        alert("Ошибка: " + (data.detail || "Не удалось добавить пользователя"));
        if (data.status === 404) document.getElementById("memberEmail").value = "";
      }
    })
    .catch(e => alert("Критическая ошибка: " + e.message));
}

// ================= MEMBER LIST =================

function openMembersListModal() {
  renderMembersList();
  document.getElementById("membersListModal").style.display = "flex";
}

function closeMembersListModal() {
  document.getElementById("membersListModal").style.display = "none";
}

function renderMembersList() {
  const container = document.getElementById("membersListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (!teamMembers || teamMembers.length === 0) {
    container.innerHTML = "<p>Участников пока нет</p>";
    return;
  }

  teamMembers.forEach(member => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.padding = "10px 0";
    row.style.borderBottom = "1px solid rgba(0,0,0,0.1)";

    const emailSpan = document.createElement("span");
    emailSpan.innerText = member.email;
    row.appendChild(emailSpan);

    if (isLeader && Number(member.id) !== Number(currentUserId)) {
      const delBtn = document.createElement("button");
      delBtn.innerText = "X";
      delBtn.style.backgroundColor = "#dddddd";
      delBtn.style.border = "none";
      delBtn.style.color = "#333";
      delBtn.style.padding = "5px 10px";
      delBtn.style.borderRadius = "5px";
      delBtn.style.cursor = "pointer";
      delBtn.onclick = () => removeMember(member.id);
      row.appendChild(delBtn);
    }

    container.appendChild(row);
  });
}

async function removeMember(userId) {
  if (!confirm("Вы уверены, что хотите исключить этого участника из команды?")) return;

  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      alert("Участник удален");
      await loadMembers();
      renderMembersList();
      loadTasks();
    } else {
      const err = await res.json();
      alert("Ошибка удаления: " + (err.detail || "Не удалось"));
    }
  } catch (e) {
    alert("Ошибка соединения с сервером");
  }
}