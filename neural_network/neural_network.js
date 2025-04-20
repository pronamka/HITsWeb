let predictionValue = document.getElementById('algorithm-neural-network-digit-prediction');
let retrainModelInput = document.getElementById('algorithm-neural-network-retrain-model-input');

let canvas = document.getElementById('algorithm-neural-network-drawing-canvas');
let canvasContext = canvas.getContext('2d');

const canvasOffsetX = canvas.offsetLeft;
const canvasOffsetY = canvas.offsetTop;

canvas.height = Math.floor((window.innerHeight - canvasOffsetY - 300) / 28) * 28;
canvas.width = canvas.height;

let isPainting = false;
let lineWidth = 30;

canvasContext.lineWidth = lineWidth;
canvasContext.lineCap = 'round';
canvasContext.strokeStyle = 'black';

canvas.addEventListener('mousedown', (e) => {
    isPainting = true;
});

canvas.addEventListener('mouseup', (e) => {
    isPainting = false;
    canvasContext.stroke();
    canvasContext.beginPath();
});

canvas.addEventListener('mouseleave', (e) => {
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

class ImageEditor {
    constructor() {
        this.originalCanvas = canvas;
        this.originalContext = canvasContext;
        this.originalWidth = canvas.width;
        this.originalHeight = canvas.height;
    }

    extractAlphaChannel(imageData) {
        let alphaChannel = [];
        for (let i = 0; i < imageData.length; i += 4) {
            alphaChannel.push(imageData[i + 3]);
        }
        return alphaChannel;
    }

    arrayToMatrix(array, width, height) {
        let matrix = [];
        for (let y = 0; y < height; y++) {
            matrix.push(array.slice(y * width, (y + 1) * width));
        }
        return matrix;
    }

    getBorderCoordinates(imageMatrix) {
        let minX = this.originalWidth,
            minY = this.originalHeight,
            maxX = 0,
            maxY = 0;
        for (let y = 0; y < this.originalHeight; y++) {
            for (let x = 0; x < this.originalWidth; x++) {
                if (imageMatrix[y][x] > 10) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        return [minX, minY, maxX, maxY];
    }

    centerImage(imageBorders) {
        let imageWidth = imageBorders[2] - imageBorders[0];
        let imageHeight = imageBorders[3] - imageBorders[1];

        let biggerDimension = Math.max(imageWidth, imageHeight);
        let smallerDimension = Math.min(imageWidth, imageHeight);
        let sideLength = Math.floor(biggerDimension + biggerDimension / 4);

        let tempCanvas = document.createElement('canvas');
        let tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = tempCanvas.height = sideLength;

        if (imageHeight > imageWidth) {
            tempContext.putImageData(
                this.originalContext.getImageData(
                    imageBorders[0],
                    imageBorders[1],
                    imageWidth,
                    imageHeight
                ),
                (sideLength - smallerDimension) / 2,
                (sideLength - biggerDimension) / 2
            );
        } else {
            tempContext.putImageData(
                this.originalContext.getImageData(
                    imageBorders[0],
                    imageBorders[1],
                    imageWidth,
                    imageHeight
                ),
                (sideLength - biggerDimension) / 2,
                (sideLength - smallerDimension) / 2
            );
        }
        return [
            this.extractAlphaChannel(tempContext.getImageData(0, 0, sideLength, sideLength).data),
            sideLength,
        ];
    }

    resizeImage(image, sideLength) {
        let imageData = new Float32Array(28 * 28);
        let scaleX = Math.floor(sideLength / 28);
        let scaleY = Math.floor(sideLength / 28);
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                let sum = 0;
                let count = 0;
                for (let yy = Math.floor(y * scaleY); yy < Math.ceil((y + 1) * scaleY); yy++) {
                    for (let xx = Math.floor(x * scaleX); xx < Math.ceil((x + 1) * scaleX); xx++) {
                        sum += image[yy * sideLength + xx];
                        count++;
                    }
                }
                let avg = sum / count;
                if (avg > 240) {
                    avg -= 10;
                }
                imageData[y * 28 + x] = avg;
            }
        }
        return imageData;
    }

    getImage() {
        let originalImage = this.extractAlphaChannel(
            canvasContext.getImageData(0, 0, canvas.width, canvas.height).data
        );

        let matrixRepresentation = this.arrayToMatrix(
            originalImage,
            this.originalWidth,
            this.originalHeight
        );
        let imageBorders = this.getBorderCoordinates(matrixRepresentation);

        if (imageBorders[0] >= imageBorders[2] || imageBorders[1] >= imageBorders[3]) {
            alert('Please, draw a digit on the canvas first.');
            return;
        }

        let centeredImage = this.centerImage(imageBorders);
        return this.resizeImage(...centeredImage);
    }
}

function sendPicture(resizedArray) {
    fetch('http://127.0.0.1:5000/recognize_digit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
            image: Array.from(resizedArray),
            digit: retrainModelInput.value,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Predicted digit:', data.digit);
            predictionValue.textContent = `Prediction: ${data.digit}`;
        })
        .catch((error) => console.error('Error:', error));
}

let cleanCanvasButton = document.getElementById('algorithm-neural-network-clean-canvas-button');
cleanCanvasButton.addEventListener('click', () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
});

let sendPictureButton = document.getElementById('algorithm-neural-network-send-picture-button');
sendPictureButton.addEventListener('click', () => {
    let imageEditor = new ImageEditor();
    sendPicture(imageEditor.getImage());
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
});

let retrainModelButton = document.getElementById('algorithm-neural-network-retrain-model-button');
retrainModelButton.addEventListener('click', () => {
    let imageEditor = new ImageEditor();
    sendPicture(imageEditor.getImage());
    retrainModelInput.value = '';
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
});

let saveModelButton = document.getElementById('algorithm-neural-network-save-model-button');
saveModelButton.addEventListener('click', () => {
    fetch('http://127.0.0.1:5000/save_model', {
        method: 'GET',
        mode: 'cors',
    });
});
