const sendToContent = async (message) => {
    await chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message)
    })
}

const addSite = async (site) => {
    const site_element = document.createElement('div')
    site_element.classList.add('blockeSite')
}

const main = async () => {
    const redirectH = document.getElementById('redirectH')
    redirectH.addEventListener('click', () => {
        window.location.href = '../../popup.html'
    })

    const input = document.querySelector('input')
    const add = document.querySelector('button')

    add.addEventListener('click', () => {

    })
}
main()