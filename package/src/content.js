/**
 * 内容脚本
 * 通过chrome.runtime与background脚本进行通信
 * inspector脚本通过此脚本与background脚本进行通信
 */

window.addEventListener('message', (event) => {
    let hasCocosGameCanvas = !!document.querySelector('#GameCanvas');
    if (!hasCocosGameCanvas) {
        const nodes = [].slice.call(document.querySelectorAll('canvas'));
        if (nodes.length > 0) {
            hasCocosGameCanvas = nodes.find(function (node) {
                return node.id && node.id.indexOf('cc-game') > -1;
            })
        }
    }
    if (event.source === window && hasCocosGameCanvas) {
        chrome.runtime.sendMessage(event.data);
    } else {
        window.postMessage({
            name: event.name
        });
    }
})