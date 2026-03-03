const API = "http://localhost:8000";

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

async function loadTasks() {
  const response = await fetch(`${API}/tasks/`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  const tasks = await response.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  const container = document.getElementById("tasksList");
  container.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "task";

    div.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description || ""}</p>
      <button onclick="deleteTask(${task.id})">Delete</button>
    `;

    container.appendChild(div);
  });
}

async function createTask() {
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  const response = await fetch(`${API}/tasks/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, description })
  });

  if (response.ok) {
    loadTasks();
  } else {
    alert("Error creating task");
  }
}

async function deleteTask(id) {
  await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  loadTasks();
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

loadTasks();