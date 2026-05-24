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

// Guardamos quién está en cada sala
const rooms = {};

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push(socket.id);

    console.log(`${socket.id} se unió a sala: ${room} (${rooms[room].length} en sala)`);

    // Si hay 2 en la sala, notifica al que llegó primero
    if (rooms[room].length >= 2) {
      const firstPeer = rooms[room][0];
      io.to(firstPeer).emit('peer-joined', socket.id);
    }
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
    for (const room in rooms) {
      rooms[room] = rooms[room].filter(id => id !== socket.id);
      if (rooms[room].length === 0) delete rooms[room];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
