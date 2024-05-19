console.log('Friendlii')

const makeElementDraggable = (element, draggable) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    draggable.onmousedown = dragMouseDown;
    draggable.style.cursor = 'pointer'

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }

}

const createFriendliiArea = () => {
    const friendlii_area = document.createElement('div')
    friendlii_area.id = 'friendlii-area'    
    document.body.appendChild(friendlii_area)
    return friendlii_area
}

const createFriendliiInfo = () => {
    const information = document.createElement('div')
    information.className = 'friendlii-information'

    const connected_indicator = document.createElement('div')
    connected_indicator.className = 'friendlii-connected-indicator'
    connected_indicator.innerHTML = 'NOT connected'

    const user_selected = document.createElement('div')
    user_selected.className = 'friendlii-user-selected'
    user_selected.innerHTML = 'User NOT Selected'

    const users_amount = document.createElement('div')
    users_amount.className = 'friendlii-users-amount'
    users_amount.innerHTML = 'Users: 0'
    
    const ping_display = document.createElement('div')
    ping_display.className = 'friendlli-ping-display'
    ping_display.innerHTML = 'Ping: 0'

    information.appendChild(connected_indicator)
    information.appendChild(users_amount)
    information.appendChild(user_selected)
    information.appendChild(ping_display)

    document.body.appendChild(information)
    return information
}

const createFriendliiMenu = () => {
    const edit_menu = document.createElement('div')
    edit_menu.className = 'friendlii-edit-menu'

    const chatBtn = document.createElement('button')
    chatBtn.innerHTML = '🗣️'

    const angryBtn = document.createElement('button')
    angryBtn.innerHTML = '🔥'

    const happyBtn = document.createElement('button')
    happyBtn.innerHTML = '😄'

    const sadBtn = document.createElement('button')
    sadBtn.innerHTML = '😢'

    const sendEmote = (emote) => {
        console.log('Emote:', emote)
        try {
            if(ws === null) return
            if(ws.readyState !== 1) return

            ws.send(JSON.stringify({
                action: 'forceAnimation',
                data: emote
            }))

        } catch (error) {
            console.log('Error:', error)
        }
    
    }

    angryBtn.addEventListener('click', () => {
        sendEmote(3)
    })

    sadBtn.addEventListener('click', () => {
        sendEmote(4)  
    })

    edit_menu.appendChild(chatBtn)
    edit_menu.appendChild(angryBtn)
    edit_menu.appendChild(happyBtn)
    edit_menu.appendChild(sadBtn)

    document.body.appendChild(edit_menu)
    return edit_menu
}

const createFriendliiTimer = () => {
    const timer = document.createElement('div')
    timer.className = 'friendlii-timer'

    const timer_display = document.createElement('div')
    timer_display.className = 'friendlii-timer-display'
    timer_display.innerHTML = '0'

    timer.appendChild(timer_display)

    document.body.appendChild(timer)
    makeElementDraggable(timer, timer)
    return timer

}


let drawpaths = []
const renderDrawPath = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = 'black'
    // smooth
    ctx.beginPath()

    drawpaths.forEach((drawpath) => {
        

    for(let i = 0; i < drawpath.length; i++){
        if(i === 0){
            ctx.moveTo(drawpath[i].x, drawpath[i].y)
        } else {
            ctx.lineTo(drawpath[i].x, drawpath[i].y)
        }
    }
    ctx.stroke()

    })
}

const createWhiteboard = () => {
    const whiteboard = document.createElement('div')
    whiteboard.className = 'friendlii-whiteboard'

    const toptab = document.createElement('div')
    toptab.className = 'friendlii-whiteboard-toptab'
    whiteboard.appendChild(toptab)

    const canvas = document.createElement('canvas')
    canvas.style.cursor = 'crosshair'
    canvas.width = 500
    canvas.height = 300
    whiteboard.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    
    let pen = false
    let eraser = false
    let laser = false
    
    let isDrawing = false
    let x = 0
    let y = 0
    // draw on the whiteboard

    const mouseDown = (x, y) => {
        isDrawing = true
        drawpaths.push([])
        drawpaths[drawpaths.length-1].push({x, y})
    }

    const mouseMove = (x, y) => {
        // draw preview of pen
        renderDrawPath(ctx)
        if (pen) {
            ctx.beginPath()
            ctx.strokeStyle = 'black'
            ctx.arc(x, y, 3, 0, 2 * Math.PI)
            ctx.stroke()
        } else if (eraser) {
            ctx.beginPath()
            ctx.strokeStyle = 'black'
            ctx.arc(x, y, 10, 0, 2 * Math.PI)
            ctx.stroke()
        } else if (laser) {
            ctx.beginPath()
            ctx.strokeStyle = 'red'
            ctx.arc(x, y, 3, 0, 2 * Math.PI)
            ctx.stroke()

            ws.send(JSON.stringify({
                action: 'laser',
                data: {x, y}
            }))
        }
        
        if (!isDrawing) return
        if (pen) {
            drawpaths[drawpaths.length-1].push({x, y})
            renderDrawPath(ctx)
        } else if (eraser) {
            // find the points that are within the radius of the eraser in the drawpath
            const eraserRadius = 10
            const eraserX = x
            const eraserY = y
            
            drawpaths.forEach((drawpath) => {
                for(let i = 0; i < drawpath.length; i++){
                    const point = drawpath[i]
                    const distance = Math.sqrt((eraserX - point.x)**2 + (eraserY - point.y)**2)
                    if(distance < eraserRadius){
                        drawpath.splice(i, 1)
                    }
                }
            })

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            renderDrawPath(ctx)

        } 
    }

    const mouseUp = (e) => {
        isDrawing = false
        ws.send(JSON.stringify({
            action: 'drawPath',
            data: drawpaths,
        }))
    }

    canvas.addEventListener('mousedown', (e) => {mouseDown(e.offsetX, e.offsetY)})
    canvas.addEventListener('mousemove', (e) => {mouseMove(e.offsetX, e.offsetY)})
    canvas.addEventListener('mouseup', (e) => {mouseUp(e.offsetX, e.offsetY)})

    canvas.addEventListener('touchstart', (e) => {
        const canvasRect = canvas.getBoundingClientRect()
        mouseDown(e.touches[0].clientX - canvasRect.left, e.touches[0].clientY - canvasRect.top)})
    canvas.addEventListener('touchmove', (e) => {
        const canvasRect = canvas.getBoundingClientRect()
        mouseMove(e.touches[0].clientX - canvasRect.left, e.touches[0].clientY - canvasRect.top)})
    canvas.addEventListener('touchend', (e) => {
        const canvasRect = canvas.getBoundingClientRect()
        mouseUp(e.touches[0].clientX - canvasRect.left, e.touches[0].clientY - canvasRect.top)})
    

    const tools = document.createElement('div')
    tools.className = 'friendlii-whiteboard-tools'

    const penBtn = document.createElement('button')
    penBtn.className = 'friendlii-whiteboard-tool'
    const penImg = document.createElement('img')
    penImg.src = chrome.runtime.getURL('images/pen.png')
    penBtn.appendChild(penImg)

    const eraserBtn = document.createElement('button')
    eraserBtn.className = 'friendlii-whiteboard-tool'
    const eraserImg = document.createElement('img')
    eraserImg.src = chrome.runtime.getURL('images/eraser.png')
    eraserBtn.appendChild(eraserImg)

    const laserBtn = document.createElement('button')
    laserBtn.className = 'friendlii-whiteboard-tool'
    const laserImg = document.createElement('img')
    laserImg.src = chrome.runtime.getURL('images/laser.png')
    laserBtn.appendChild(laserImg)

    tools.appendChild(penBtn)
    tools.appendChild(eraserBtn)
    tools.appendChild(laserBtn)

    penBtn.addEventListener('click', () => {
        eraser = false
        laser = false
        eraserBtn.classList.remove('active')
        laserBtn.classList.remove('active')

        penBtn.classList.toggle('active')
        pen = !pen
    })

    eraserBtn.addEventListener('click', () => {
        pen = false
        laser = false
        penBtn.classList.remove('active')
        laserBtn.classList.remove('active')
        
        eraserBtn.classList.toggle('active')
        eraser = !eraser
    })

    laserBtn.addEventListener('click', () => {
        pen = false
        eraser = false
        penBtn.classList.remove('active')
        eraserBtn.classList.remove('active')
        
        laserBtn.classList.toggle('active')
        laser = !laser
    })

    whiteboard.appendChild(tools)

    document.body.appendChild(whiteboard)
    makeElementDraggable(whiteboard, toptab)

    return whiteboard
}

const createFriendliiUser = (area_element, id) => {
    const friendlii_user = document.createElement('div')
    friendlii_user.className = 'friendlii-entity'
    friendlii_user.id = id

    const img = document.createElement('img')
    img.src = ''
    friendlii_user.appendChild(img)

    area_element.appendChild(friendlii_user)
    return friendlii_user
}


let pings = [/* average of 10 pings */]
let max_pings = 10
const setPing = (ping) => {
    pings.push(ping)
    if(pings.length > max_pings) {
        const sum = pings.reduce((a, b) => a + b, 0)
        const average = sum / pings.length

        const ping_display = document.querySelector('.friendlli-ping-display')
        ping_display.innerHTML = `Ping: ${average.toFixed(2)}`

        pings = []
    }
}

const setUsersAmount = (amount) => {
    const users_amount = document.querySelector('.friendlii-users-amount')
    users_amount.innerHTML = `Users: ${amount}`
}

const setConnectedStatus = (status) => {
    const connected_indicator = document.querySelector('.friendlii-connected-indicator')
    connected_indicator.innerHTML = status
}


const setAnimationFrame = async (element, animationFrame = 0, skin = 0, facingLeft = true) => {
    const img = element.querySelector('img')
    let path = 'default'
    // console.log(facingLeft)
    if (!facingLeft) element.style.transform = 'scaleX(-1)'
    else element.style.transform = 'scaleX(1)'

    switch(skin){
        case 0:

            break;
        case 1:
            path = 'hawk'
            break;
        case 2:
            break;
        }
    // check if the src is the same
    if(img.src === await chrome.runtime.getURL(`images/animations/${path}/${path}${animationFrame}.gif`)) {
        // do nothing
    }
    else {
        img.src = await chrome.runtime.getURL(`images/animations/${path}/${path}${animationFrame}.gif`)
    }
}


// websocket connection

let serverAddress = 'wss://friendlii-470eb93cf55e.herokuapp.com/';
serverAddress = 'ws://localhost:3000/';
let ws = null;

// elements
const info_element = createFriendliiInfo()
const area_element = createFriendliiArea()
const user_element = createFriendliiUser(area_element)
user_element.zIndex = 251279
const menu_element = createFriendliiMenu()
const timer_element = createFriendliiTimer()
const whiteboard_element = createWhiteboard()
const whiteboard_context = whiteboard_element.querySelector('canvas').getContext('2d')
/* 
    0 - default
    1 - hawkhacks
    2 - duck
*/
let skin = 1
let id = '' // this will change when the user connects to the server

const openEditMenu = (x, y) => {
    menu_element.style.display = 'block'
    if(x) menu_element.style.left = `${x}px`
    if(y) menu_element.style.top = `${y}px`
}

const closeEditMenu = () => {
    menu_element.style.display = 'none'
}

const hideUser_elements = () => {area_element.style.display = 'none'}
const showUser_elements = () => {area_element.style.display = 'block'}
hideUser_elements()


const initiate_WS = async () => {
    // close the existing connection
    if (ws !== null) await ws.close()

    ws = new WebSocket(serverAddress);
    console.log('Connecting to the server...')
    setConnectedStatus('CONNECTING...')

    ws.onopen = () => {
        console.log('Connected to the server');
        // ws.send('Hello from the client!');
        const userDetails = {
            action: 'connect',
            data: {
                skin
            }
        }

        showUser_elements()
        setConnectedStatus('CONNECTED')

        ws.send(JSON.stringify(userDetails));
    };

    ws.onclose = () => {
        console.log('Connection closed')
        hideUser_elements()
        setConnectedStatus('NOT connected')
    }

    ws.onmessage = async (e) => {
        try {
            const message = JSON.parse(e.data)
            const action = message.action
            const data = message.data

            const timeStamp = message.timeStamp
            const ping = Math.abs(Date.now() - timeStamp)
            // console.log(message)
            setPing(ping)

            switch (action) {
                case 'Welcome':
                    console.log('Welcome:', data)
                    id = data
                    user_element.id = id
                    break
                case 'user_disconnect':
                    const disconnected_user_id = data
                    const disconnected_user_element = document.getElementById(disconnected_user_id)
                    if(disconnected_user_element !== null) disconnected_user_element.remove()
                    break
                case 'update':
                    // console.log('update:', data)
                    // console.log('ping:', Date.now() - timeStamp)

                    data.forEach((user) => {
                        const user_id = user.id
                        const user_pos = user.position
                        const user_skin = user.skin
                        const user_animationFrame = user.animationFrame
                        const user_facingLeft = user.facingLeft

                        let curr_user_element = document.getElementById(user_id)
                        if(curr_user_element === null) {
                            curr_user_element = createFriendliiUser(area_element, user_id)
                        }
                        curr_user_element.style.left = `${user_pos.x}px`
                        curr_user_element.style.bottom = `${user_pos.y}px`

                        setAnimationFrame(curr_user_element, user_animationFrame, user_skin, user_facingLeft)
                    });
                    setUsersAmount(data.length)
                    setPing(ping)

                    // user_element.style.left = `${data.x}px`
                    // user_element.style.bottom = `${data.y}px`
                    break

                case 'updateTimer':
                    // console.log('updateTimer:', data)
                    const timer_display = document.querySelector('.friendlii-timer-display')
                    timer_display.innerHTML = data.time_elapsed

                case 'drawPath':
                    drawpaths = data
                    renderDrawPath(whiteboard_context)
                    break
                case 'laser':
                    // console.log('Laser:', data)
                    renderDrawPath(whiteboard_context)
                    whiteboard_context.beginPath()
                    whiteboard_context.strokeStyle = 'red'
                    whiteboard_context.arc(data.x, data.y, 3, 0, 2 * Math.PI)
                    whiteboard_context.stroke()
                    break
                default:
                    console.log('Message:', message)
                    break
            }

        } catch (error) {
            console.error('Error:', error)
        }
    }

    ws.onerror = (e) => {
        console.error('Error:', e)
        setConnectedStatus('ERROR')
    }
}

// received message from server worker
const main = async () => {

    const keyControls = {
        'up': 0,
        'down': 0,
        'left': 0,
        'right': 0,
        'jump': 0,
    }

    let userActive = false
    user_element.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()

        console.log('User Clicked')
        if(!userActive){ //first click
            const user_selected = document.querySelector('.friendlii-user-selected')
            user_selected.innerHTML = `User Selected`
        } else { //second click
            openEditMenu(user_element.offsetLeft - 30, user_element.offsetTop - 30)
        }
        userActive = true
    })
    
    window.addEventListener('click', () => {
        userActive = false
        const user_selected = document.querySelector('.friendlii-user-selected')
        user_selected.innerHTML = `User NOT Selected`
        closeEditMenu()
    })

    window.addEventListener('keydown', (e) => {
        closeEditMenu()
        if (!userActive) return
        e.preventDefault()
        const key = e.key.toLowerCase();
        switch(key){
            case('ArrowRight', 'd'):
                keyControls.right = 1;
                break;
    
            case('ArrowLeft', 'a'):
                keyControls.left = 1;
                break;
    
            case('ArrowUp', 'w'):
                keyControls.up = 1;
                break;
            
            case('ArrowDown', 's'):
                keyControls.down = 1;
                break;
    
            case(' '):
                keyControls.jump = 1;
                break;
        }

        try{
            if(ws === null) return
            if(ws.readyState !== 1) return
            ws.send(JSON.stringify({
                action: 'keyControls',
                data: keyControls
            }))
        } catch(e) {
            console.log('Error:')
            console.log(e)
        }
    });
    
    window.addEventListener('keyup', (e) => {
        e.preventDefault()
        const key = e.key;
        switch(key){
            case('ArrowRight', 'd'):
                keyControls.right = 2;
                break;
    
            case('ArrowLeft', 'a'):
                keyControls.left = 2;
                break;
    
            case('ArrowUp', 'w'):
                keyControls.up = 2;
                break;
            
            case('ArrowDown', 's'):
                keyControls.down = 2;
                break;
    
            case(' '):
                keyControls.jump = 2;
                break;
        }

        try{
            if(ws === null) return 
            if(ws.readyState !== 1) return
            ws.send(JSON.stringify({
                action: 'keyControls',
                data: keyControls
            }))
        }catch(e){
            console.log('Error:')
            console.log(e)
        }
    })

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('Message:', message)

        const action = message.action
        const data = message.data
        if (action === null) return

        switch (action) {
            case 'connect':
                initiate_WS()
                break

            case 'disconnect':
                if (ws !== null) ws.close()
                break

            case 'spawn':
                break
            case 'startTimer':
                console.log(data)
                ws.send(JSON.stringify({
                    action: 'startTimer',
                    data: {
                        time: data
                    }
                }))
                break

                break
            default:
                break
        }
    })
}
main()