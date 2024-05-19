// const serverAddress = 'wss://haochibao-websocket.glitch.me/';
// const serverAddress = 'ws://localhost:3000/';

// const ws = new WebSocket(serverAddress);

// ws.onopen = () => {
//     console.log('Connected to the server');
//     // ws.send('Hello from the client!');
//     const test = {
//         test: 'Hello from the client!',
//         type: 'test'
//     }

//     ws.send(JSON.stringify(test));
// };


// send message to content script
// const port = chrome.runtime.connect({ name: 'friendlii' });
// port.postMessage({ message: 'Hello from the popup!' });


const sendToContent = async (message) => {
    await chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message)
    })
}

let skin = 0
const main = async () => {
    const choice1 = document.getElementById('choice1')
    const choice2 = document.getElementById('choice2')
    const choice3 = document.getElementById('choice3')
    const choice4 = document.getElementById('choice4')

    choice1.addEventListener('click', () => { 
        skin = 0 
        choice1.classList.add('selected')
        choice2.classList.remove('selected')
        choice3.classList.remove('selected')
        choice4.classList.remove('selected')
    })

    choice2.addEventListener('click', () => {
        skin = 0
        choice2.classList.add('selected')
        choice1.classList.remove('selected')
        choice3.classList.remove('selected')
        choice4.classList.remove('selected')
    })

    choice3.addEventListener('click', () => {
        skin = 1
        choice3.classList.add('selected')
        choice1.classList.remove('selected')
        choice2.classList.remove('selected')
        choice4.classList.remove('selected')
    })

    choice4.addEventListener('click', () => {
        skin = 0
        choice4.classList.add('selected')
        choice1.classList.remove('selected')
        choice2.classList.remove('selected')
        choice3.classList.remove('selected')
    })

    const connect = document.querySelector('#connect')
    connect.addEventListener('click', async () => {
        const message = {
            action: 'connect',
            data: {
                skin
            }
        }
        sendToContent(message)
    })
    
    const disconnect = document.querySelector('#disconnect')
    disconnect.addEventListener('click', async () => {
        const message = {action: 'disconnect'}
        sendToContent(message)
    })

    const startTimer = (time) => {
        const message = {
            action: 'startTimer',
            data: time
        }
        sendToContent(message)
    }
    const timer1 = document.querySelector('#timer1')
    timer1.addEventListener('click', async () => {startTimer(15)})

    const timer2 = document.querySelector('#timer2')
    timer2.addEventListener('click', async () => {startTimer(30)})

    const timer3 = document.querySelector('#timer3')
    timer3.addEventListener('click', async () => {startTimer(180)})

    const timer4 = document.querySelector('#timer4')
    timer4.addEventListener('click', async () => {startTimer(60 * 15)})

    const pauseTimer = document.querySelector('#pauseTimer')
    pauseTimer.addEventListener('click', async () => {
        const message = {action: 'pauseTimer'}
        sendToContent(message)
    })

    const redirectBS = document.querySelector('#redirectBS')
    redirectBS.addEventListener('click', async () => {
        window.location.href = './pages/blockSites/blockSites.html'
    })
}

main()