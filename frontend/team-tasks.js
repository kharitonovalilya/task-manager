const API = "http://localhost:8000/api/v1";

// Получаем ID команды из URL
const params = new URLSearchParams(window.location.search);
const teamId = params.get("teamId");
let isLeader = false;

if (!teamId) {
    alert("Ошибка: не указана команда");
    window.location.href = "dashboard.html";
}

let tasks = [];
let currentFilter = 'all'; // 'all' или 'my'

async function loadTeamInfo(){

    const token = localStorage.getItem('token');

    try{

        const teamResponse = await fetch(`${API}/teams/${teamId}`,{
            headers:{
                "Authorization":`Bearer ${token}`
            }
        });

        if(!teamResponse.ok) throw new Error();

        const team = await teamResponse.json();

        document.getElementById("teamTitle").innerText = team.name;

        // получаем текущего пользователя
        const meResponse = await fetch(`${API}/auth/me`,{
            headers:{
                "Authorization":`Bearer ${token}`
            }
        });

        const me = await meResponse.json();

        // проверяем лидер ли он
        isLeader = team.lead_id === me.id;

        updateLeaderUI();

    }catch(e){
        console.error("Ошибка загрузки команды");
    }
}

function updateLeaderUI(){

    const createBtn = document.getElementById("createTaskBtn");

    if(!isLeader){
        createBtn.disabled = true;
        createBtn.classList.add("disabled-btn");
    }

}

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

<div class="task-left">
  <button 
    class="done-btn ${task.completed ? "completed" : ""}"
    onclick="toggleTask(${task.id}, this)">
    ✔
  </button>
</div>

<div class="task-content">
  <b>${task.title}</b><br>
  ${task.description ? task.description + '<br>' : ''}
  Дедлайн: ${deadline}<br>
  Исполнитель: ${assignee}
</div>

<div class="task-right">

  <button 
${!isLeader ? "disabled" : ""}
onclick="openEditModal(${task.id})">
    ✏️
  </button>

  <button 
${!isLeader ? "disabled" : ""}
onclick="deleteTask(${task.id})">
    🗑
  </button>

</div>
`;

    container.appendChild(div);
}

// ======================= TOGGLE TASK ========================
async function toggleTask(id, button) {

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const completed = !button.classList.contains("completed");

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

        button.classList.toggle("completed");

        if (currentFilter === 'all') loadAllTasks();
        else loadMyTasks();

    } catch (error) {
        console.error(error);
        alert("Не удалось обновить задачу");
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

let editingTaskId = null;

function openEditModal(taskId){

    const task = tasks.find(t => t.id === taskId);

    editingTaskId = taskId;

    document.getElementById("editTaskTitle").value = task.title;
    document.getElementById("editTaskDescription").value = task.description || "";
    document.getElementById("editTaskDeadline").value = task.deadline.split('T')[0];
    document.getElementById("editTaskUser").value = task.user_id || "";

    document.getElementById("editTaskModal").style.display = "flex";
}

async function saveTaskEdit(){

    const token = localStorage.getItem('token');

    const title = document.getElementById("editTaskTitle").value;
    const description = document.getElementById("editTaskDescription").value;
    const deadline = document.getElementById("editTaskDeadline").value;
    const user_id = parseInt(document.getElementById("editTaskUser").value);

    const data = {
        title,
        description,
        deadline,
        user_id
    };

    try{

        const response = await fetch(`${API}/tasks/${editingTaskId}`,{
            method:"PATCH",
            headers:{
                "Content-Type":"application/json",
                "Authorization":`Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if(!response.ok) throw new Error();

        closeEditModal();

        if(currentFilter === 'all'){
            loadAllTasks();
        } else {
            loadMyTasks();
        }

    }catch(e){
        alert("Ошибка редактирования задачи");
    }
}

async function deleteTask(id){

    const token = localStorage.getItem('token');

    if(!confirm("Удалить задачу?")) return;

    try{

        const response = await fetch(`${API}/tasks/${id}`,{
            method:"DELETE",
            headers:{
                "Authorization":`Bearer ${token}`
            }
        });

        if(!response.ok) throw new Error();

        if(currentFilter === 'all') loadAllTasks();
        else loadMyTasks();

    }catch(e){
        alert("Не удалось удалить задачу");
    }
}



// ======================= INIT ===============================
if (!teamId) {
    alert("Ошибка: не указана команда");
    window.location.href = "dashboard.html";
} else {
    loadTeamInfo();
    loadAllTasks();
}


