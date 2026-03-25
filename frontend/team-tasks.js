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

function clearTaskForm() {
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskDeadline").value = "";
  document.getElementById("taskUser").value = "";
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

    currentUserId = Number(me.id); // Принудительно в число
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
    // Скрываем кнопки управления полностью для обычного участника
    if (createTaskBtn) createTaskBtn.style.display = "none";
    if (addMemberBtn) addMemberBtn.style.display = "none";
    
    // Удаляем класс лидера, если он был
    container.classList.remove("is-leader");
  } else {
    // Показываем кнопки для лидера
    if (createTaskBtn) createTaskBtn.style.display = "inline-block";
    if (addMemberBtn) addMemberBtn.style.display = "inline-block";
    
    // Добавляем класс лидера для управления CSS (кнопки задач)
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
  
  // Фильтрация
  const filtered = tasks.filter(task => {
    if (currentFilter === "done") return task.completed;
    if (currentFilter === "not_done") return !task.completed;
    if (currentFilter === "my") return Number(task.user_id) === Number(currentUserId);
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = "<p style='text-align:center;opacity:0.6'>Задач пока нет</p>";
    return;
  }

  filtered.forEach(task => {
    const div = document.createElement("div");
    div.className = "task-card";
    
    // ПРОВЕРКА ПРАВ (принудительно к числам)
    const taskOwnerId = Number(task.user_id);
    const myId = Number(currentUserId);
    const isAssignee = taskOwnerId === myId;
    const canToggle = isLeader || isAssignee;

    if (task.completed) div.classList.add("done");
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
  // Нам больше не нужно отправлять body с completed, 
  // так как бэкенд сам переключает статус (toggle)
  
  try {
    const res = await fetch(`${API}/tasks/${id}/toggle-complete`, { // ДОБАВИЛИ /toggle-complete
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      loadTasks();
    } else if (res.status === 403) {
      alert("Ошибка доступа: вы не лидер и не исполнитель этой задачи");
    }
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
      clearTaskForm();
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
      delBtn.innerText = "X";
      delBtn.style.backgroundColor = "#f0efefaf";
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


