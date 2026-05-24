const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.get('/', (req, res) => {
  res.send('Servidor WebRTC activo');
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);
    socket.to(room).emit('peer-joined', socket.id);
    console.log(`${socket.id} se unió a sala: ${room}`);
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', {
      sdp: data.sdp,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', {
      sdp: data.sdp,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.room).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
