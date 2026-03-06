const params = new URLSearchParams(window.location.search);
const teamId = params.get("team");

let tasks = [];

async function loadAllTasks(){

  const response = await fetch(`/api/teams/${teamId}/tasks`);
  tasks = await response.json();

  renderTasks(tasks);
}

async function loadMyTasks(){

  const response = await fetch(`/api/teams/${teamId}/mytasks`);
  const myTasks = await response.json();

  renderTasks(myTasks);
}

function showMyTasks(){
  loadMyTasks();
}

function showAllTasks(){
  loadAllTasks();
}

function renderTasks(tasksList){

  const container = document.getElementById("tasksContainer");
  container.innerHTML = "";

  tasksList.forEach(renderTask);
}

function renderTask(task){

  const container = document.getElementById("tasksContainer");

  const div = document.createElement("div");
  div.className = "task-card";

  if(task.done){
    div.classList.add("done");
  }

  div.innerHTML = `
    <div>
      <b>${task.title}</b><br>
      Дедлайн: ${task.deadline}<br>
      Исполнитель: ${task.user}
    </div>

    <input type="checkbox"
      ${task.done ? "checked" : ""}
      onchange="toggleTask(${task.id}, this)">
  `;

  container.appendChild(div);
}

async function toggleTask(id, checkbox){

  const done = checkbox.checked;

  await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({done})
  });
}

async function createTask(){

  const title = document.getElementById("taskTitle").value;
  const deadline = document.getElementById("taskDeadline").value;
  const user = document.getElementById("taskUser").value;

  await fetch("/api/tasks",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({
      title,
      deadline,
      user,
      teamId
    })
  });

  closeModal();
  loadAllTasks();
}

function openModal(){
  document.getElementById("taskModal").style.display = "flex";
}

function closeModal(){
  document.getElementById("taskModal").style.display = "none";
}

function goBack() {
  window.location.href = "dashboard.html";
}

loadMyTasks();