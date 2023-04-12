const {Server: SocketIOServer} = require('socket.io')
const http = require('http')

const HTTP_SERVER_PORT = 8000

// Create HTTP Server
const httpServer = http.createServer((req, res) => {
  res.end('OK')
})
httpServer.listen(HTTP_SERVER_PORT)

// Create socket io server
const io = new SocketIOServer(httpServer, {
  cors: {origin: '*'}
})

// Create clients storage
const clients = new Map()

// Handle socket.io connections
io.on('connection', (socket) => {

  console.log(`Client ${socket.id} connected`)

  // Handle client registering
  socket.on('REGISTER', (squareData) => {

    /*
    * squareData = {
    *   squareSize,
    *   squareColor,
    *   x,
    *   y
    * }
    * */

    // Save client to storage
    clients.set(socket.id, {
      id: socket.id,
      ...squareData
    })

    // Broadcast new client
    io.sockets.emit('NEW_CLIENT', clients.get(socket.id))
  })

  // Send all clients to the socket
  for(const key of clients.keys()) {
    const clientData = clients.get(key)
    socket.emit('NEW_CLIENT', clientData)
  }

  // On position changed
  socket.on('CLIENT_POSITION_CHANGED', ({x, y}) => {

    const clientData = clients.get(socket.id)
    const newClientData = {
      ...clientData,
      x,
      y
    }

    clients.set(socket.id, newClientData)

    io.sockets.emit('CLIENT_POSITION_CHANGED', newClientData)
  })

  // Handle disconnection
  socket.on('disconnect', () => {

    // Remove client from storage
    clients.delete(socket.id)

    // Broadcast client leaving
    io.sockets.emit('CLIENT_LEAVED', socket.id)

    console.log(`Client ${socket.id} disconnected`)
  })
})
