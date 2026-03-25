const API = "http://localhost:8000/api/v1";

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(API + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Ошибка входа");
            return;
        }

        localStorage.setItem("token", data.access_token);
        window.location.href = "dashboard.html";

    } catch (err) {
        console.error(err);
        alert("Ошибка сети или сервера");
    }
}


function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const passwordConfirm = document.getElementById("passwordConfirm").value;
  if (password !== passwordConfirm) {
    alert("Пароли не совпадают!");
    return;
  }
  fetch(API + "/auth/register", {
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

tasks