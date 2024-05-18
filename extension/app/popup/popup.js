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

const main = async () => {

    const connect = document.querySelector('#connect')
    connect.addEventListener('click', async () => {
        const message = {action: 'connect'}
        sendToContent(message)
    })
    
    const disconnect = document.querySelector('#disconnect')
    disconnect.addEventListener('click', async () => {
        const message = {action: 'disconnect'}
        sendToContent(message)
    })
    // testing ______________________________
    const test = document.querySelector('#test')
    test.addEventListener('click', async () => {
        const message = {action: 'test'}
        sendToContent(message)
    })
}

main()