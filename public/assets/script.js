const socket = io('/')
const videoGrid = document.getElementById('video-grid')

const myPeer = new Peer(undefined, {
    // host: 'peerjs-server.herokuapp.com',
    host: '/',
    // port: location.protocol === 'https:' ? 443 : 9000,
    port: 9000,
    // secure: true,
    config: {
        'iceServers': [
            { url: 'stun:stun01.sipphone.com' },
            { url: 'stun:stun.ekiga.net' },
            { url: 'stun:stun.fwdnet.net' },
            { url: 'stun:stun.ideasip.com' },
            { url: 'stun:stun.iptel.org' },
            { url: 'stun:stun.rixtelecom.se' },
            { url: 'stun:stun.schlund.de' },
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'stun:stun1.l.google.com:19302' },
            { url: 'stun:stun2.l.google.com:19302' },
            { url: 'stun:stun3.l.google.com:19302' },
            { url: 'stun:stun4.l.google.com:19302' },
            { url: 'stun:stunserver.org' },
            { url: 'stun:stun.softjoys.com' },
            { url: 'stun:stun.voiparound.com' },
            { url: 'stun:stun.voipbuster.com' },
            { url: 'stun:stun.voipstunt.com' },
            { url: 'stun:stun.voxgratia.org' },
            { url: 'stun:stun.xten.com' },
            {
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                url: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            }
        ]
    }
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
const shareButton = document.getElementById('share')
let localstream = null;
const myVideo = document.createElement('video')
myVideo.muted = true
myVideo.controls = false
const peers = {}
let user = ''
let currentPeer = null

chatButton.addEventListener('click', (e) => {
    e.stopPropagation()
    if (sideNav.style.display === 'block') {
        sideNav.style.display = 'none'
    } else {
        sideNav.style.display = 'block'
    }
    chatBox.focus()
})

document.getElementById('roomContainer').addEventListener('click', () => {
    sideNav.style.display = 'none'
})

document.getElementById('idurl').value = window.location.href
// document.getElementById('idurl').value = window.location.pathname.substring(6)

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

shareButton.addEventListener('click', () => {
    navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: 'always'
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true
        }
    }).then((stream) => {
        const sharedScreen = document.getElementById('screen-share')
        videoGrid.style.display = 'none'
        sharedScreen.style.display = 'block'
        const video = document.createElement('video')
        video.srcObject = stream
        video.onloadedmetadata = () => {
            video.play()
        }
        let sender = currentPeer.getSenders().find(x => x.track.kind == stream.getVideoTracks()[0].kind)
        sender.replaceTrack(stream.getVideoTracks()[0])
        shareButton.disabled = true
        sharedScreen.append(video)
        stream.getVideoTracks()[0].onended = () => {
            stopScreenShare()
        }
    })
})

function updateShareButton(){ 
    let totalUsers = document.getElementsByTagName('video').length
    if (totalUsers > 1) {
       shareButton.disabled = false
    } else {
        shareButton.disabled = true
    }
}

function stopScreenShare() {
    const sharedScreen = document.getElementById('screen-share')
    let sender = currentPeer.getSenders().find(x => x.track.kind == localstream.getVideoTracks()[0].kind)
    sender.replaceTrack(localstream.getVideoTracks()[0])
    videoGrid.style.display = 'grid'
    sharedScreen.style.display = 'none'
    userGridsDivision()
}


navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    addNewVideoStream(myVideo, stream)
    localstream = stream

    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        video.controls = false
        call.on('stream', userVideoStream => {
            addNewVideoStream(video, userVideoStream)
            currentPeer = call.peerConnection
        })
    })

    socket.on('user-connected', userId => {
        setTimeout(() => {
            connectToNewUser(userId, stream)
        }, 1000);
    })

    socket.on('createMesage', (msg) => {
        const div = document.createElement('div')
        const name = document.createElement('p')
        if (msg.user == user) {
            div.setAttribute('class', 'me chat')
            name.style.width = '100%'
            name.style.textAlign = 'right'
            name.innerHTML = user.substr(0, 6) + '(You)'
        }
        else {
            div.setAttribute('class', 'notme chat')
            name.style.textAlign = 'left'
            name.style.marginRight = 'auto'
            name.innerHTML = msg.user.substr(0, 6)
        }
        div.append(msg.msg)
        messageArea.append(name)
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
            userGridsDivision()
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
        currentPeer = call.peerConnection
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
    let totalUsers = document.getElementsByTagName('video').length
    if (totalUsers < 5) {
        videoGrid.appendChild(video)
        userGridsDivision()
    } 
    else {
        video.style.display = 'none'
        stream.getAudioTracks()[0].enabled = true
        stream.getVideoTracks()[0].enabled = false
    }
}

function userGridsDivision ()  {
    let totalUsers = document.getElementsByTagName('video').length

    if (totalUsers == 2) {
        videoGrid.style.gridTemplateColumns = 'repeat(auto-fill,' + 100 / totalUsers + '%)'
        videoGrid.style.gridAutoRows = 100 / totalUsers + '%'
    } else if (totalUsers == 3) {
        videoGrid.style.gridTemplateColumns = 'repeat(auto-fill,' + 100 / 2 + '%)'
        videoGrid.style.gridAutoRows = 100 / 2 + '%'
    } else if (totalUsers == 1) {
        videoGrid.style.gridTemplateColumns = 'repeat(auto-fill,' + 100 + '%)'
        videoGrid.style.gridAutoRows = 100 + '%'
    }

    updateShareButton()
}