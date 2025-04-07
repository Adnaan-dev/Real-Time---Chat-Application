const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const users = {};

io.on("connection", (socket) => {
  console.log("🔌 New user connected");

  socket.on("new-user-joined", (username) => {
    users[socket.id] = username;
    console.log(`✅ ${username} joined`);
    io.emit("user-list", Object.values(users));
    io.emit("message", `🔔 ${username} joined the chat`);
  });

  socket.on("user-message", ({ username, message }) => {
    const fullMsg = `${username}: ${message}`;
    io.emit("message", fullMsg);
  });

  socket.on("typing", () => {
    const user = users[socket.id];
    if (user) {
      socket.broadcast.emit("typing", user);
    }
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      io.emit("message", `❌ ${user} left the chat`);
      delete users[socket.id];
      io.emit("user-list", Object.values(users));
      console.log(`❌ ${user} disconnected`);
    }
  });
});

server.listen(9000, () => {
  console.log("✅ Server running at http://localhost:9000");
});
