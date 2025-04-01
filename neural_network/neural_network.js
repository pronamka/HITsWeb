let canvas = document.getElementById('algorithm-neural-network-drawing-canvas');
let canvasContext = canvas.getContext('2d');

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;
console.log(canvasOffsetX, canvasOffsetY);

canvas.height = window.innerHeight - canvasOffsetY - 300;
canvas.width = canvas.height;

let isPainting = false;
let lineWidth = 5;

let startX;
let startY;

canvasContext.lineWidth = lineWidth;
canvasContext.lineCap = 'round';
canvasContext.strokeStyle = 'red';

canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
    /*startX = e.clientX;
    startY = e.clientY*/
});

canvas.addEventListener('mouseup', (e) => {
    isPainting = false;
    canvasContext.stroke();
    canvasContext.beginPath();
});

canvas.addEventListener('mousemove', (e) => {
    if (!isPainting) {
        return;
    }
    console.log(e.clientX, e.clientY);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvasContext.lineTo(x, y);
    canvasContext.stroke();
});

let cleanCanvasButton = document.getElementById('algorithm-neural-network-clean-canvas-button');
cleanCanvasButton.addEventListener('click', () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
});
