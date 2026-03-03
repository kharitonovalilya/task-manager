const API = "http://localhost:8000";

// LOGIN
async function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const response = await fetch(API + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    console.log(data);

    localStorage.setItem("token", data.access_token);

    window.location.href = "tasks.html";
}

async function loadTasks() {

    const response = await fetch(API + "/tasks", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    const tasks = await response.json();

    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach(task => {
        const li = document.createElement("li");
        li.textContent = task.title;
        list.appendChild(li);
    });
}

function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;

  // Проверяем, что пароли совпадают
  if (password !== passwordConfirm) {
    alert("Пароли не совпадают!");
    return;
  }
  // Отправка на backend
  fetch("http://localhost:8000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }) 
  })
    .then(res => {
      if (!res.ok) throw new Error("Ошибка регистрации");
      return res.json();
    })
    .then(data => {
      alert("Регистрация успешна!");
      window.location.href = "login.html";
    })
    .catch(err => {
      alert(err.message);
    });
}

function goToLogin() {
  window.location.href = "login.html";
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

function goToRegister() {
    window.location.href = "register.html";
}