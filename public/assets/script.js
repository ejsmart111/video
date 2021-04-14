const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host: 'peerjs-server.herokuapp.com',
    // host: '/',
    port: location.protocol === 'https:' ? 443 : 9000,
    // port: 9000,
    secure: true
})
const chatButton = document.getElementById('chat')
const muteButton = document.getElementById('mute')
const muteOffButton = document.getElementById('muteoff')
const videoButton = document.getElementById('video')
const videoOffButton = document.getElementById('videooff')
const hangupButton = document.getElementById('hangup')
const sideNav = document.getElementById('sidenav')
const chatBox = document.getElementById('message')
const messageArea = document.getElementById('messageArea')
let localstream = null;
const myVideo = document.createElement('video')
myVideo.muted = true
myVideo.controls = false
const peers = {}
let user = ''

chatButton.addEventListener('click', (e) => {
    e.stopPropagation()
    if (sideNav.style.display === 'block') {
        sideNav.style.display = 'none'
    } else {
        sideNav.style.display = 'block'
    }
})

document.getElementById('roomContainer').addEventListener('click', () => {
    sideNav.style.display = 'none'
})

document.getElementById('idurl').value = window.location.pathname.substring(6)

document.getElementById('copy').onclick = () => {
    document.getElementById('idurl').select()
    document.getElementById('idurl').setSelectionRange(0, 99999)
    document.execCommand('copy')
    alert('Meeting link has been copied: ' + document.getElementById('idurl').value)
}

hangupButton.onclick = () => {
    myVideo.remove()
    window.location.href = '/'
}

muteButton.onclick = () => {
    muteButton.style.display = 'none'
    muteOffButton.style.display = 'block'
    localstream.getAudioTracks()[0].enabled = true
}

muteOffButton.onclick = () => {
    muteOffButton.style.display = 'none'
    muteButton.style.display = 'block'
    localstream.getAudioTracks()[0].enabled = false
}

videoButton.addEventListener('click', () => {
    videoButton.style.display = 'none'
    videoOffButton.style.display = 'block'
    localstream.getVideoTracks()[0].enabled = false
})

videoOffButton.onclick = () => {
    videoOffButton.style.display = 'none'
    videoButton.style.display = 'block'
    localstream.getVideoTracks()[0].enabled = true
}


navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    addNewVideoStream(myVideo, stream)
    localstream = stream
    console.log(stream)

    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        video.controls = false
        call.on('stream', userVideoStream => {
            addNewVideoStream(video, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        setTimeout(() => {
            connectToNewUser(userId, stream)
        }, 1000);
    })

    socket.on('createMesage', (msg) => {
        const div = document.createElement('div')
        if (msg.user == user) {
            div.setAttribute('class', 'me chat')
        }
        else {
            div.setAttribute('class', 'notme chat')
        }
        div.append(msg.msg)
        messageArea.append(div)
        messageArea.scrollTop = messageArea.scrollHeight
    })
})

chatBox.onkeydown = (e) => {
    const code = e.keyCode? e.keyCode: e.which
    if (code === 13 && chatBox.value !== '') {
        socket.emit('message', chatBox.value)
        chatBox.value = ''
    }
}

socket.on('user-disconnected', userId => {
    if (peers[userId]) {
        setTimeout(() => {
            peers[userId].close()
        }, 1000);
    }
})

myPeer.on('open', id => {
    user = id
    socket.emit('join-room', room_id, id)
})

function connectToNewUser (userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    video.controls = false
    call.on('stream', userVideoStream => {
        addNewVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addNewVideoStream (video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.appendChild(video)
}