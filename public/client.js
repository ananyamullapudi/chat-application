const socket = io();
const joinForm = document.getElementById("joinForm");
const chat = document.getElementById("chat");
const roomName = document.getElementById("roomName");
const usersEl = document.getElementById("users");
const messages = document.getElementById("messages");
const typingEl = document.getElementById("typing");
const msgForm = document.getElementById("msgForm");
const msgInput = document.getElementById("msgInput");

let myName = "";
let myRoom = "general";
let typingTimeout;

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  myName = document.getElementById("username").value.trim() || "Guest";
  myRoom = document.getElementById("room").value.trim() || "general";
  roomName.textContent = myRoom;
  socket.emit("join", { username: myName, room: myRoom });
  joinForm.classList.add("hidden");
  chat.classList.remove("hidden");
});

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit("chat:message", text);
  appendMessage({ username: myName, text, ts: Date.now() }, true);
  msgInput.value = "";
});

msgInput.addEventListener("input", () => {
  socket.emit("typing", true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit("typing", false), 1000);
});

socket.on("chat:message", (m) => appendMessage(m, m.username === myName));
socket.on("system", (text) => appendSystem(text));
socket.on("presence", (names) => usersEl.textContent = names.join(", "));
socket.on("typing", ({ username, isTyping }) => {
  typingEl.textContent = isTyping ? `${username} is typing…` : "";
});

function appendMessage({ username, text, ts }, self = false) {
  const li = document.createElement("li");
  li.className = self ? "self" : "";
  const time = new Date(ts).toLocaleTimeString();
  li.innerHTML = `<strong>${username}:</strong> ${sanitize(text)} <span class="time">${time}</span>`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

function appendSystem(text) {
  const li = document.createElement("li");
  li.style.color = "#777";
  li.textContent = `• ${text}`;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

// Simple XSS guard
function sanitize(str) {
  return str.replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s]));
}
