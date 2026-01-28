/* ================= CONFIG ================= */
const SESSION_TIME = 60 * 60 * 1000; // 1 soat
const BASE_URL = "http://127.0.0.1:3000";

/* ================= SESSION HELPERS ================= */
function isSessionValid() {
  const t = localStorage.getItem("adminLoginTime");
  if (!t) return false;
  return Date.now() - Number(t) < SESSION_TIME;
}

function showLogin() {
  document.getElementById("loginBox").style.display = "flex";
  document.getElementById("adminLayout").style.display = "none";
}

function showAdmin() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("adminLayout").style.display = "flex";
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  if (isSessionValid()) {
    showAdmin();
    loadActive();
    loadSigned();
    loadArchived();
  } else {
    localStorage.removeItem("adminLoginTime");
    showLogin();
  }
});

/* ================= LOGIN ================= */
async function loginAdmin() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const error = document.getElementById("loginError");

  error.textContent = "";

  if (!username || !password) {
    error.textContent = "Login va parol majburiy";
    return;
  }

  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!data.success) {
    error.textContent = "Login yoki parol noto‘g‘ri";
    return;
  }

  localStorage.setItem("adminLoginTime", Date.now().toString());

  showAdmin();
  loadActive();
  loadSigned();
  loadArchived();
}

/* ================= SECTION SWITCH ================= */
function showSection(id) {
  document.querySelectorAll(".section").forEach(s =>
    s.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");
}

/* ================= UPLOAD ================= */
async function upload() {
  if (!isSessionValid()) {
    alert("Session tugadi. Qayta login qiling.");
    localStorage.removeItem("adminLoginTime");
    showLogin();
    return;
  }

  const fileInput = document.getElementById("file");
  if (!fileInput.files.length) {
    alert("Fayl tanlang");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  const res = await fetch(`${BASE_URL}/documents`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    alert("Yuklashda xatolik");
    return;
  }

  alert("✅ Yuklandi");
  loadActive();
}

/* ================= ACTIVE ================= */
async function loadActive() {
  const res = await fetch(`${BASE_URL}/documents`);
  const data = await res.json();

  document.getElementById("docs").innerHTML = data.map(d => `
    <tr>
      <td>${d.id}</td>
      <td>
        <a href="${BASE_URL}/files/${d.filename}" target="_blank">
          ${d.filename}
        </a>
      </td>
      <td>${d.status}</td>
      <td>${new Date(d.created_at).toLocaleString()}</td>
      <td>
        <button type="button" onclick="signDocument('${d.id}')">Imzolash</button>
        <button type="button" onclick="archive('${d.id}')">Arxiv</button>
      </td>
    </tr>
  `).join("");
}

/* ================= SIGN ================= */
async function signDocument(id) {
  if (!confirm("Hujjat imzolansinmi?")) return;

  const res = await fetch(`${BASE_URL}/documents/${id}/sign`, {
    method: "PUT"
  });

  if (!res.ok) {
    alert("Imzolashda xatolik");
    return;
  }

  alert("✅ Imzolandi");
  loadActive();
  loadSigned();
}

/* ================= ARCHIVE ================= */
async function archive(id) {
  await fetch(`${BASE_URL}/documents/${id}/archive`, { method: "PUT" });
  loadActive();
  loadArchived();
}

/* ================= ARCHIVED ================= */
async function loadArchived() {
  const res = await fetch(`${BASE_URL}/documents/archived`);
  const data = await res.json();

  document.getElementById("archivedTable").innerHTML = data.map(d => `
    <tr>
      <td>${d.id}</td>
      <td>${d.filename}</td>
      <td>${d.status}</td>
      <td>${new Date(d.created_at).toLocaleString()}</td>
    </tr>
  `).join("");
}

/* ================= SIGNED (MUHIM JOY) ================= */
async function loadSigned() {
  const res = await fetch(`${BASE_URL}/documents/signed`);
  const data = await res.json();

  document.getElementById("signedTable").innerHTML = data.map(d => `
    <tr>
      <td>${d.id}</td>
      <td>
        <a
          href="${BASE_URL}/verify/${d.id}?token=${d.qr_token}"
          target="_blank"
        >
          🔐 ${d.filename}
        </a>
      </td>
      <td>${d.signed_by}</td>
      <td>${new Date(d.signed_at).toLocaleString()}</td>
    </tr>
  `).join("");
}
