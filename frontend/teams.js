const teams = [
  { id: 1, name: "Команда А" },
  { id: 2, name: "Команда Б" }
];

function renderTeams() {
  const container = document.getElementById("teamsList");
  container.innerHTML = "";

  teams.forEach(team => {
    const div = document.createElement("div");
    div.className = "task-card"; // переиспользуем стили карточки
    div.innerHTML = `
      <h3>${team.name}</h3>
    `;
    div.onclick = () => {
      localStorage.setItem("selectedTeamId", team.id);
      window.location.href = "team-tasks.html";
    };
    container.appendChild(div);
  });
}

renderTeams();