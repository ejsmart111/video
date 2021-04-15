const express = require('express')
const app = express()
const server = require('http').Server(app)
const { v4: uuidV4 } = require('uuid')
const io = require('socket.io')(server)
const cors = require('cors')

app.set('view engine', 'ejs')
app.use(express.static('public'))

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/room', (req, res) => {
    res.redirect(`${uuidV4()}`)
})

app.get('/room/:room', (req, res) => {
    res.render('room', {roomId: req.params.room})
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.broadcast.to(roomId).emit('user-connected', userId)

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })

        socket.on('message', message => {
            io.to(roomId).emit('createMesage', {msg: message, user: userId})
        })
    })
})

server.listen(process.env.PORT || 3000)