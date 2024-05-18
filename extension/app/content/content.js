console.log('Friendlii')

const createFriendliiArea = () => {
    const friendlii_area = document.createElement('div')
    friendlii_area.id = 'friendlii-area'
    document.body.appendChild(friendlii_area)
    return friendlii_area
}

const createFriendliiUser = (area_element) => {
    const friendlii_user = document.createElement('div')
    friendlii_user.className = 'friendlii-entity'
    area_element.appendChild(friendlii_user)
    return friendlii_user

}

let serverAddress = 'wss://haochibao-websocket.glitch.me/';
serverAddress = 'ws://localhost:3000/';
serverAddress = 'wss://friendlii-470eb93cf55e.herokuapp.com/';
let ws = null;


const area_element = createFriendliiArea()
const user_element = createFriendliiUser(area_element)

const initiate_WS = async () => {
    // close the existing connection
    if (ws !== null) ws.close()

    ws = new WebSocket(serverAddress);
    console.log('Connecting to the server...')
    ws.onopen = () => {
        console.log('Connected to the server');
        // ws.send('Hello from the client!');
        const test = {
            test: 'Hello from the cool!',
            type: 'test'
        }

        ws.send(JSON.stringify(test));
    };
    ws.onclose = () => {
        console.log('Connection closed')
    }
    ws.onmessage = (e) => {
        try {
            const message = JSON.parse(e.data)
            const action = message.action
            const data = message.data
            const timeStamp = message.timeStamp

            switch (action) {
                case 'Welcome':
                    console.log('Welcome:', data)
                    break
                case 'ping':
                    console.log('ping:', Date.now() - timeStamp)
                    break
                case 'update':
                    // console.log('update:', data)
                    console.log('ping:', Date.now() - timeStamp)
                    user_element.style.left = `${data.x}px`
                    user_element.style.bottom = `${data.y}px`
                    break
                default:
                    console.log('Message:', message)
                    break
            }

        } catch (error) {
            console.error('Error:', error)
        }
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
    window.addEventListener('keydown', (e) => {
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
        if(ws === null) return 
        ws.send(JSON.stringify({
            action: 'keyControls',
            data: keyControls
        }))
    });
    
    window.addEventListener('keyup', (e) => {
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

        if(ws === null) return 
        ws.send(JSON.stringify({
            action: 'keyControls',
            data: keyControls
        }))
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