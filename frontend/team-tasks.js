const API = "http://localhost:8000/api/v1";

const params = new URLSearchParams(window.location.search);
const teamId = params.get("teamId");

let tasks = [];
let teamMembers = []; // Храним список участников команды
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
  await loadMembers(); // Сначала загружаем участников
  await loadTasks();   // Затем задачи (чтобы сопоставить ID и Email)
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
    if (addMemberBtn) addMemberBtn.style.display = "inline-block";
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
  container.innerHTML = "";

  let filtered = tasks;

  if (currentFilter === "done") {
    filtered = tasks.filter(t => t.completed);
  } else if (currentFilter === "not_done") {
    filtered = tasks.filter(t => !t.completed);
  } else if (currentFilter === "my") {
    filtered = tasks.filter(t => t.user_id === currentUserId);
  }

  if (filtered.length === 0) {
    container.innerHTML = "<p style='text-align:center;opacity:0.6'>Нет задач</p>";
    return;
  }

  filtered.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";
    if (task.completed) div.classList.add("done");

    // Ищем почту исполнителя по ID
    const member = teamMembers.find(m => m.id === task.user_id);
    const userEmail = member ? member.email : `Неизвестный (ID: ${task.user_id})`;

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
        Исполнитель: ${userEmail}
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

window.toggleTask = async function(id, button) {
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
};

// ================= CREATE =================

window.createTask = async function() {
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

  try {
    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      closeModal();
      loadTasks();
    } else {
      const errorData = await res.json();
      alert("Ошибка создания задачи: " + (errorData.detail || ""));
    }
  } catch (e) {
    alert("Ошибка соединения с сервером");
  }
};

// ================= DELETE =================

window.handleDelete = function(id) {
  if (!isLeader) {
    alert("Только лидер может удалять задачи");
    return;
  }
  if (confirm("Удалить задачу?")) {
    deleteTask(id);
  }
};

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

window.handleEdit = function(id) {
  if (!isLeader) {
    alert("Только лидер может редактировать задачи");
    return;
  }
  openEditModal(id);
};

window.openEditModal = function(id) {
  const task = tasks.find(t => t.id === id);
  editingTaskId = id;

  fillMembersSelects(); // Заполняем список участников

  document.getElementById("editTaskTitle").value = task.title;
  document.getElementById("editTaskDescription").value = task.description || "";
  document.getElementById("editTaskDeadline").value = task.deadline?.split("T")[0] || "";
  document.getElementById("editTaskUser").value = task.user_id || "";

  document.getElementById("editTaskModal").style.display = "flex";
};

window.saveTaskEdit = async function() {
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

  try {
    const res = await fetch(`${API}/tasks/${editingTaskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      closeEditModal();
      loadTasks();
    } else {
      const errorData = await res.json();
      alert("Ошибка редактирования: " + (errorData.detail || ""));
    }
  } catch (e) {
    alert("Ошибка соединения с сервером");
  }
};

window.closeEditModal = function() {
  document.getElementById("editTaskModal").style.display = "none";
};

// ================= MODALS =================

window.openModal = function() {
  fillMembersSelects(); // Заполняем список участников
  document.getElementById("taskModal").style.display = "flex";
};

window.closeModal = function() {
  document.getElementById("taskModal").style.display = "none";
};

// ================= NAV =================

window.goBack = function() {
  window.location.href = "dashboard.html";
};

// ================= MEMBER ACTIONS =================

window.openMemberModal = function() {
  document.getElementById("memberModal").style.display = "flex";
};

window.closeMemberModal = function() {
  document.getElementById("memberModal").style.display = "none";
  document.getElementById("memberEmail").value = "";
};

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
      await loadMembers(); // Подгружаем нового участника
      renderTasks();       // Обновляем интерфейс
    } else {
      alert("Ошибка: " + (result.detail || "Не удалось добавить пользователя"));
      if (res.status === 404) emailInput.value = "";
    }
  } catch (e) {
    console.error(e);
    alert("Критическая ошибка: проверьте соединение с сервером");
  }
};

// ================= MEMBER LIST LOGIC =================

window.openMembersListModal = function() {
  renderMembersList();
  document.getElementById("membersListModal").style.display = "flex";
};

window.closeMembersListModal = function() {
  document.getElementById("membersListModal").style.display = "none";
};

function renderMembersList() {
  const container = document.getElementById("membersListContainer");
  container.innerHTML = "";

  if (teamMembers.length === 0) {
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

    // Почта участника
    const emailSpan = document.createElement("span");
    emailSpan.innerText = member.email;
    row.appendChild(emailSpan);

    // Кнопка удаления (только для лидера и не для самого себя)
    if (isLeader && Number(member.id) !== Number(currentUserId)) {
      const delBtn = document.createElement("button");
      delBtn.innerText = "🗑";
      delBtn.style.backgroundColor = "#ff4d4d";
      delBtn.style.border = "none";
      delBtn.style.color = "white";
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
      await loadMembers(); // Перезагружаем список из БД
      renderMembersList(); // Обновляем список в модалке
      loadTasks();         // Перезагружаем задачи (так как исполнители могли смениться)
    } else {
      const err = await res.json();
      alert("Ошибка удаления: " + (err.detail || "Не удалось"));
    }
  } catch (e) {
    console.error(e);
    alert("Ошибка соединения с сервером");
  }
}


