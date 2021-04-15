const express = require('express')
const app = express()
const server = require('http').Server(app)
const { v4: uuidV4 } = require('uuid')
const io = require('socket.io')(server)

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
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