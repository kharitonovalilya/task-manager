const API = "http://localhost:8000/api/v1";

// Получаем ID команды из URL
const params = new URLSearchParams(window.location.search);
const teamId = params.get("teamId");

if (!teamId) {
    alert("Ошибка: не указана команда");
    window.location.href = "dashboard.html";
}

let tasks = [];
let currentFilter = 'all'; // 'all' или 'my'

// ======================= FETCH DATA ==========================
async function loadAllTasks() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Используем правильный эндпоинт: /teams/{teamId}/tasks
        const response = await fetch(`${API}/teams/${teamId}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Ошибка загрузки задач: ${response.status}`);
        tasks = await response.json();
        renderTasks(tasks);
        currentFilter = 'all';
    } catch (error) {
        console.error(error);
        alert("Не удалось загрузить задачи");
    }
}

async function loadMyTasks() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // Получаем информацию о текущем пользователе
        const meResponse = await fetch(`${API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!meResponse.ok) throw new Error("Ошибка получения данных пользователя");
        const me = await meResponse.json();
        const userId = me.id;

        // Фильтруем задачи по user_id и team_id через query-параметры
        const response = await fetch(`${API}/tasks?user_id=${userId}&team_id=${teamId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Ошибка загрузки задач: ${response.status}`);
        const myTasks = await response.json();
        renderTasks(myTasks);
        currentFilter = 'my';
    } catch (error) {
        console.error(error);
        alert("Не удалось загрузить мои задачи");
    }
}

function showMyTasks() {
    loadMyTasks();
}

function showAllTasks() {
    loadAllTasks();
}

// ======================= RENDER TASKS ========================
function renderTasks(tasksList) {
    const container = document.getElementById("tasksContainer");
    if (!container) return;
    container.innerHTML = "";
    tasksList.forEach(task => renderTask(task));
}

function renderTask(task) {
    const container = document.getElementById("tasksContainer");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "task-card";
    if (task.completed) div.classList.add("done");

    const deadline = task.deadline ? task.deadline.split('T')[0] : "Не указан";
    const assignee = task.user_id ? `ID: ${task.user_id}` : "Не назначен";

    div.innerHTML = `
        <div>
            <b>${task.title}</b><br>
            ${task.description ? task.description + '<br>' : ''}
            Дедлайн: ${deadline}<br>
            Исполнитель: ${assignee}
        </div>
        <input type="checkbox"
            ${task.completed ? "checked" : ""}
            onchange="toggleTask(${task.id}, this)">
    `;

    container.appendChild(div);
}

// ======================= TOGGLE TASK ========================
async function toggleTask(id, checkbox) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const completed = checkbox.checked;

    try {
        const response = await fetch(`${API}/tasks/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ completed })
        });
        if (!response.ok) throw new Error("Ошибка обновления задачи");
        if (currentFilter === 'all') {
            loadAllTasks();
        } else {
            loadMyTasks();
        }
    } catch (error) {
        console.error(error);
        alert("Не удалось обновить задачу");
        checkbox.checked = !completed;
    }
}

// ======================= CREATE TASK ========================
async function createTask() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const deadline = document.getElementById("taskDeadline").value;
    const userInput = document.getElementById("taskUser").value.trim();

    if (!title || !deadline || !userInput) {
        alert("Заполните название, дедлайн и ID исполнителя");
        return;
    }

    const userId = parseInt(userInput);
    if (isNaN(userId)) {
        alert("ID исполнителя должно быть числом");
        return;
    }

    const taskData = {
        title: title,
        description: description || "",
        deadline: deadline,
        user_id: userId,
        team_id: parseInt(teamId),
        completed: false
    };

    try {
        const response = await fetch(`${API}/tasks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Ошибка создания задачи");
        }
        closeModal();
        if (currentFilter === 'all') {
            loadAllTasks();
        } else {
            loadMyTasks();
        }
    } catch (error) {
        console.error(error);
        alert("Не удалось создать задачу: " + error.message);
    }
}

// ======================= MODAL FUNCTIONS ========================
function openModal() {
    const modal = document.getElementById("taskModal");
    if (modal) modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("taskModal");
    if (modal) modal.style.display = "none";
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDescription").value = "";
    document.getElementById("taskDeadline").value = "";
    document.getElementById("taskUser").value = "";
}

function goBack() {
    window.location.href = "dashboard.html";
}

// ======================= INIT ===============================
if (!teamId) {
    alert("Ошибка: не указана команда");
    window.location.href = "dashboard.html";
} else {
    loadAllTasks();
}