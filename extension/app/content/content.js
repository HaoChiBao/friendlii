console.log('Friendlii')

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

    edit_menu.appendChild(chatBtn)
    edit_menu.appendChild(angryBtn)
    edit_menu.appendChild(happyBtn)
    edit_menu.appendChild(sadBtn)

    document.body.appendChild(edit_menu)
    return edit_menu
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


// change animation frame
const setAnimationFrame = async (element, animationFrame = 0, skin = 0, facingLeft = true) => {
    const img = element.querySelector('img')
    let path = 'default'
    // console.log(facingLeft)
    if (!facingLeft) element.style.transform = 'scaleX(-1)'
    else element.style.transform = 'scaleX(1)'

    switch(skin){
        case 0:
            // check if the src is the same
            if(img.src === await chrome.runtime.getURL(`images/animations/${path}/${path}${animationFrame}.gif`)) return
            else img.src = await chrome.runtime.getURL(`images/animations/${path}/${path}${animationFrame}.gif`)

            break;
        case 1:
            path = 'hawkhacks'
            break;
        case 2:
            break;
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
const menu_element = createFriendliiMenu()

/* 
    0 - default
    1 - hawkhacks
    2 - duck
*/
let skin = 0 
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

    ws.onmessage = (e) => {
        try {
            const message = JSON.parse(e.data)
            const action = message.action
            const data = message.data

            const timeStamp = message.timeStamp
            const ping = Date.now() - timeStamp
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
            case 'test':
                console.log('spawn')
                // const entity = new UserEntity(area_element)
                // Entity.addKeyControls(entity)
                // entity.spawn()
                
                // Physics.makeEntityDraggable(entity)
                // Physics.startLoop()

                // const entity = new UserEntity()
                // Physics.startLoop()
                break

                break
            default:
                break
        }
    })
}
main()