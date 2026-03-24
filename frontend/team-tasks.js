const API = "http://localhost:8000/api/v1";

const params = new URLSearchParams(window.location.search);
const teamId = params.get("teamId");

let tasks = [];
let isLeader = false;
let currentFilter = "all"; // all | done | not_done | my
let currentUserId = null;

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

    currentUserId = me.id;
    isLeader = Number(team.lead_id) === Number(me.id);

    updateLeaderUI();

  } catch (e) {
    console.error(e);
  }
}

function updateLeaderUI() {
  const btn = document.getElementById("createTaskBtn");
  const addMemberBtn = document.getElementById("addMemberBtn");

  if (!isLeader) {
    btn.disabled = true;
    btn.classList.add("disabled-btn");
    if (addMemberBtn) addMemberBtn.style.display = "none";
  } else {
    // Если лидер — показываем кнопку приглашения
    if (addMemberBtn) addMemberBtn.style.display = "inline-block";
  }
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
  container.innerHTML = "";

  let filtered = tasks;

  if (currentFilter === "done") {
    filtered = tasks.filter(t => t.completed);
  }

  if (currentFilter === "not_done") {
    filtered = tasks.filter(t => !t.completed);
  }

  if (currentFilter === "my") {
    filtered = tasks.filter(t => t.user_id === currentUserId);
  }

  if (filtered.length === 0) {
    container.innerHTML = "<p style='text-align:center;opacity:0.6'></p>";
    return;
  }

  filtered.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";
    if (task.completed) div.classList.add("done");

    div.innerHTML = `
      <div class="task-left">
        <button onclick="toggleTask(${task.id}, this)" 
          class="done-btn ${task.completed ? "completed" : ""}">
          ✔
        </button>
      </div>

      <div class="task-content">
        <b>${task.title}</b><br>
        ${task.description || ""}<br>
        Дедлайн: ${task.deadline ? task.deadline.split("T")[0] : "-"}<br>
        Исполнитель: ${task.user_id}
      </div>

      <div class="task-right">
        <button onclick="handleEdit(${task.id})">✏️</button>
        <button onclick="handleDelete(${task.id})">🗑</button>
      </div>
    `;

    container.appendChild(div);
  });
}

// ================= FILTERS =================

window.showAllTasks = function () {
  currentFilter = "all";
  renderTasks();
};

window.showDoneTasks = function () {
  currentFilter = "done";
  renderTasks();
};

window.showNotDoneTasks = function () {
  currentFilter = "not_done";
  renderTasks();
};

window.showMyTasks = function () {
  currentFilter = "my";
  renderTasks();
};

// ================= TASK ACTIONS =================

async function toggleTask(id, button) {
  const token = localStorage.getItem("token");

  const completed = !button.classList.contains("completed");

  try {
    await fetch(`${API}/tasks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ completed })
    });

    loadTasks();

  } catch (e) {
    alert("Ошибка обновления");
  }
}

// ================= CREATE =================

async function createTask() {
  const token = localStorage.getItem("token");

  const data = {
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDescription").value,
    deadline: document.getElementById("taskDeadline").value,
    user_id: parseInt(document.getElementById("taskUser").value),
    team_id: Number(teamId)
  };

  try {
    await fetch(`${API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    closeModal();
    loadTasks();

  } catch (e) {
    alert("Ошибка создания задачи");
  }
}

// ================= DELETE =================

function handleDelete(id) {
  if (!isLeader) {
    alert("Только лидер может удалять задачи");
    return;
  }
  deleteTask(id);
}

async function deleteTask(id) {
  const token = localStorage.getItem("token");

  if (!confirm("Удалить задачу?")) return;

  try {
    await fetch(`${API}/tasks/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
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

async function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  editingTaskId = id;

  await fillMembersSelects(); // Ждем загрузки списка участников

  document.getElementById("editTaskTitle").value = task.title;
  document.getElementById("editTaskDescription").value = task.description || "";
  document.getElementById("editTaskDeadline").value = task.deadline?.split("T")[0] || "";
  
  // Устанавливаем выбранного участника
  document.getElementById("editTaskUser").value = task.user_id || "";

  document.getElementById("editTaskModal").style.display = "flex";
}

async function saveTaskEdit() {
  const token = localStorage.getItem("token");

  const data = {
    title: document.getElementById("editTaskTitle").value,
    description: document.getElementById("editTaskDescription").value,
    deadline: document.getElementById("editTaskDeadline").value,
    user_id: parseInt(document.getElementById("editTaskUser").value)
  };

  try {
    await fetch(`${API}/tasks/${editingTaskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    closeEditModal();
    loadTasks();

  } catch (e) {
    alert("Ошибка редактирования");
  }
}

function closeEditModal() {
  document.getElementById("editTaskModal").style.display = "none";
}

// ================= MODALS =================

function openModal() {
  fillMembersSelects(); // Загружаем список участников
  document.getElementById("taskModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("taskModal").style.display = "none";
}

// ================= NAV =================

function goBack() {
  window.location.href = "dashboard.html";
}

// ================= MEMBER ACTIONS =================

window.openMemberModal = function() {
  document.getElementById("memberModal").style.display = "flex";
}

window.closeMemberModal = function() {
  document.getElementById("memberModal").style.display = "none";
  document.getElementById("memberEmail").value = "";
}

window.addMemberByEmail = async function() {
  const token = localStorage.getItem("token");
  const emailInput = document.getElementById("memberEmail");
  const email = emailInput.value.trim();

  if (!email) {
    alert("Введите email");
    return;
  }

  try {
    const res = await fetch(`${API}/teams/${teamId}/members/add-by-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ email: email })
    });

    const result = await res.json();

    if (res.ok) {
      alert("Пользователь успешно добавлен в команду!");
      closeMemberModal();
      // Опционально: обновить список участников на странице, если он есть
    } else {
      // Если бэкенд вернул 404 (не найден) или 403, выводим конкретный detail
      alert("Ошибка: " + (result.detail || "Не удалось добавить пользователя"));
      // Если почта не найдена, можно сразу очистить поле для удобства
      if (res.status === 404) emailInput.value = "";
    }
  } catch (e) {
    console.error(e);
    alert("Критическая ошибка: проверьте соединение с сервером");
  }
};

// Функция для загрузки участников команды в выпадающие списки
async function fillMembersSelects() {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API}/teams/${teamId}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const members = await res.json();

    const taskSelect = document.getElementById("taskUser");
    const editSelect = document.getElementById("editTaskUser");

    // Очищаем и добавляем дефолтный вариант
    const optionsHtml = '<option value="">Выберите исполнителя</option>' + 
      members.map(m => `<option value="${m.id}">${m.email}</option>`).join("");

    taskSelect.innerHTML = optionsHtml;
    editSelect.innerHTML = optionsHtml;
  } catch (e) {
    console.error("Ошибка при загрузке участников для списка:", e);
  }
}



