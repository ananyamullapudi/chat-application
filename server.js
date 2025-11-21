import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.static("public"));

/** In-memory presence (OK for demo) */
const users = new Map(); // socket.id -> { username, room }

function roomUsers(room) {
  return [...users.values()].filter(u => u.room === room).map(u => u.username);
}

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }) => {
    if (!username) username = "Guest-" + socket.id.slice(0, 4);
    if (!room) room = "general";
    users.set(socket.id, { username, room });
    socket.join(room);

    // notify others + send user list
    socket.to(room).emit("system", `${username} joined ${room}`);
    io.to(room).emit("presence", roomUsers(room));
  });

  socket.on("chat:message", (text) => {
    const u = users.get(socket.id);
    if (!u) return;
    io.to(u.room).emit("chat:message", {
      username: u.username,
      text,
      ts: Date.now()
    });
  });

  socket.on("typing", (isTyping) => {
    const u = users.get(socket.id);
    if (!u) return;
    socket.to(u.room).emit("typing", { username: u.username, isTyping });
  });

  socket.on("disconnect", () => {
    const u = users.get(socket.id);
    if (!u) return;
    users.delete(socket.id);
    socket.to(u.room).emit("system", `${u.username} left ${u.room}`);
    io.to(u.room).emit("presence", roomUsers(u.room));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
