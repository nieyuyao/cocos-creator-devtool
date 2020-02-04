/**
 * 内容脚本
 * 通过chrome.runtime与background脚本进行通信
 * inspector脚本通过此脚本与background脚本进行通信
 */

// 监听来自injected脚本的消息
window.addEventListener('message', event => {
    let hasCocosGameCanvas = !!document.querySelector('#GameCanvas');
    if (!hasCocosGameCanvas) {
        const nodes = [].slice.call(document.querySelectorAll('canvas'));
        if (nodes.length > 0) {
            hasCocosGameCanvas = nodes.find(function (node) {
                return node.id && node.id.indexOf('cc-game') > -1;
            })
        }
    }
    const { source, data } = event;
    if (source === window && hasCocosGameCanvas) {
        chrome.runtime.sendMessage(data);
    }
});

// 监听来自background脚本的消息
chrome.runtime.onMessage.addListener(message => {
    //
});