let predictionValue = document.getElementById('algorithm-neural-network-digit-prediction');

let canvas = document.getElementById('algorithm-neural-network-drawing-canvas');
let canvasContext = canvas.getContext('2d');

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

canvas.height = Math.floor((window.innerHeight - canvasOffsetY - 300) / 28) * 28;
canvas.width = canvas.height;

let isPainting = false;
let lineWidth = 65;

canvasContext.lineWidth = lineWidth;
canvasContext.fillStyle = 'white';
canvasContext.fillRect(0, 0, canvas.width, canvas.height);
canvasContext.lineCap = 'round';
canvasContext.strokeStyle = 'black';
canvasContext.fillStyle = 'black';

canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
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

let sendPictureButton = document.getElementById('algorithm-neural-network-send-picture-button');
sendPictureButton.addEventListener('click', () => {
    let image = canvasContext.getImageData(0, 0, canvas.width, canvas.height).data;
    let fourthChannel = new Uint8Array(image.length / 4);
    for (let i = 0; i < image.length; i += 4) {
        fourthChannel[i / 4] = image[i + 3];
    }

    let resizedArray = new Float32Array(28 * 28);
    let scaleX = canvas.width / 28;
    let scaleY = canvas.height / 28;

    for (let y = 0; y < 28; y++) {
        for (let x = 0; x < 28; x++) {
            let sum = 0;
            let count = 0;
            for (let yy = Math.floor(y * scaleY); yy < Math.ceil((y + 1) * scaleY); yy++) {
                for (let xx = Math.floor(x * scaleX); xx < Math.ceil((x + 1) * scaleX); xx++) {
                    sum += fourthChannel[yy * canvas.width + xx];
                    count++;
                }
            }
            resizedArray[y * 28 + x] = sum / count;
        }
    }
    sendPicture(resizedArray);
});

function sendPicture(resizedArray) {
    fetch('http://127.0.0.1:5000/recognize_digit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({ image: Array.from(resizedArray) }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Predicted digit:', data.digit);
            predictionValue.textContent = `Digit: ${data.digit}`;
        })
        .catch((error) => console.error('Error:', error));
}
