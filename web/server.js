const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const Redis = require('ioredis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const moment = require('moment');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Crear cliente de Redis para la sesión
const redisClient = new Redis({
  host:'redis'
});
const redisPublisher = new Redis({
  host:'redis'
});

// Configurar la sesión de Express para usar el almacenamiento de Redis
const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: 'mySecret',
  saveUninitialized: false,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: false, // En producción, debería ser true si estás usando HTTPS
    maxAge: 86400000 // 24 horas
  }
});

app.use(sessionMiddleware);

// Middleware para servir la página principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Compartir la sesión entre Express y Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Configurar suscriptor de Redis
const redisSubscriber = new Redis({
  host:'redis'
});
redisSubscriber.subscribe('chat-channel');

// Escuchar mensajes globales de Redis y transmitir a los clientes de Socket.io
redisSubscriber.on('message', (channel, message) => {
  io.emit('chat message', message);
});

io.on('connection', (socket) => {
  // Recuperar la sesión del handshake
  const session = socket.request.session;

  // Emitir el estado de la sesión al cliente
  socket.emit('session status', { loggedIn: !!session.username});

  console.log(`Un usuario se ha conectado con la sesión ID: ${session.id}`);

  // Escuchar el evento 'add user'
  socket.on('add user', function(userData) {

    session.username = userData.username; // Almacenar el nombre de usuario en la sesión
    session.userType = userData.userType; // Almacenar el tipo de usuario en la sesión
    session.save();
    socket.emit('login', { username: userData.username, userType: userData.userType });

    // Recuperar las publicaciones
    redisClient.lrange('chat-messages', 0, -1, (err, messages) => {
      if (err) {
        console.error('Error al recuperar las publicaciones anteriores:', err);
        return;
      }
      // Envía las publicaciones anteriores al usuario recién conectado
      messages.reverse().forEach((message) => {
        socket.emit('chat message', message);
      });
    });
  });


  // Escuchar mensajes del cliente y publicarlos en Redis
  socket.on('chat message', (msg) => {
    const username = session.username || 'Anónimo';
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    const message = `(${now}) ${username}: ${msg}`;
    redisPublisher.publish('chat-channel', message);
    
    // Guardar el mensaje para que los nuevos usuarios lo reciban
    redisClient.lpush('chat-messages', message);
  });

  socket.on('disconnect', () => {
    console.log(`Un usuario con la sesión ID: ${session.id} se ha desconectado`);
    // No es necesario desuscribirse aquí porque hay un único suscriptor global
  });
});

server.listen(3000, () => {
  console.log('Servidor escuchando en *:3000');
});
