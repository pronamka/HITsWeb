class Canvas {
    static canvasId = 'algorithm-neural-network-drawing-canvas';

    constructor() {
        this.canvas = document.getElementById(Canvas.canvasId);
        this.canvasContext = this.canvas.getContext('2d');

        this.canvasOffsetX = this.canvas.offsetLeft;
        this.canvasOffsetY = this.canvas.offsetTop;

        this.canvas.height = Math.floor((window.innerHeight - this.canvasOffsetY - 300) / 28) * 28;
        this.canvas.width = this.canvas.height;

        this.isPainting = false;
        this.lineWidth = 30;

        this.canvasContext.lineWidth = this.lineWidth;
        this.canvasContext.lineCap = 'round';
        this.canvasContext.strokeStyle = 'black';

        this.addListeners();
    }

    addListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isPainting = true;
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.isPainting = false;
            this.canvasContext.stroke();
            this.canvasContext.beginPath();
        });

        this.canvas.addEventListener('mouseleave', (e) => {
            this.isPainting = false;
            this.canvasContext.stroke();
            this.canvasContext.beginPath();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isPainting) {
                return;
            }
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.canvasContext.lineTo(x, y);
            this.canvasContext.stroke();
        });
    }
}

class ImageEditor {
    constructor(canvas, canvasContext) {
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
            this.originalContext.getImageData(
                0,
                0,
                this.originalCanvas.width,
                this.originalCanvas.height
            ).data
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

class PredictionsLayoutCreator {
    static predictedDigitClass = 'algorithm-neural-network-predicted-digit';
    static predictionBlockClass = 'algorithm-neural-network-certainty-container';
    static certaintyBarClass = 'algorithm-neural-network-certainty-bar';
    static predictionWrapperClass = 'algorithm-neural-network-prediction-block-wrapper';

    static mainPredictionId = 'algorithm-neural-network-digit-prediction';
    static predictionValue = document.getElementById(this.mainPredictionId);
    static mainPredictionContainer = document.getElementById(
        'algorithm-neural-network-digit-prediction-container'
    );

    static allPredictionsContainer = document.getElementById(
        'algorithm-neural-network-digit-all-predictions-container'
    );

    static createPredictionLabel(prediction) {
        let predictedDigit = document.createElement('div');
        predictedDigit.innerHTML = prediction;
        predictedDigit.className = this.predictedDigitClass;
        return predictedDigit;
    }

    static createCertaintyBar(certainty) {
        let predictionsBlock = document.createElement('div');
        predictionsBlock.className = this.predictionBlockClass;

        let certaintyBar = document.createElement('div');
        certaintyBar.className = this.certaintyBarClass;
        certaintyBar.style.width = certainty + '%';
        certaintyBar.textContent = certainty + '%';

        predictionsBlock.appendChild(certaintyBar);
        return predictionsBlock;
    }

    static createPredictionWithPercentage(prediction, certainty) {
        let certaintyBlock = this.createCertaintyBar(certainty);
        let predictionBlock = this.createPredictionLabel(prediction);

        let wrapper = document.createElement('div');
        wrapper.className = this.predictionWrapperClass;
        wrapper.appendChild(predictionBlock);
        wrapper.appendChild(certaintyBlock);

        this.allPredictionsContainer.appendChild(wrapper);
    }

    static updateCertainty(percentages) {
        this.allPredictionsContainer.innerHTML = '';
        for (let i = 0; i < percentages.length; i++) {
            this.createPredictionWithPercentage(i, percentages[i]);
        }
    }

    static displayMainPrediction(prediction, certainty) {
        if (this.mainPredictionContainer.lastChild.id !== this.mainPredictionId) {
            this.mainPredictionContainer.removeChild(this.mainPredictionContainer.lastChild);
        }

        this.predictionValue.textContent = `${prediction}`;
        let predictionsBlock = this.createCertaintyBar(certainty);

        this.mainPredictionContainer.appendChild(predictionsBlock);
    }
}

class ClientServerInterractor {
    static retrainModelInput = document.getElementById(
        'algorithm-neural-network-retrain-model-input'
    );

    static processResponse(data) {
        console.log('Predicted digit:', data.digit);
        let percentages = data.percentages;
        PredictionsLayoutCreator.displayMainPrediction(data.digit, percentages[data.digit]);
        PredictionsLayoutCreator.updateCertainty(percentages);
    }

    static sendPicture(resizedArray) {
        fetch('http://127.0.0.1:5000/recognize_digit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({
                image: Array.from(resizedArray),
                digit: this.retrainModelInput.value,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                this.processResponse(data);
            })
            .catch((error) => console.error('Error:', error));
    }

    static saveModel() {
        fetch('http://127.0.0.1:5000/save_model', {
            method: 'GET',
            mode: 'cors',
        }).then(alert('Model saved successfully!'));
    }
}

class NeuralNetworkAlgorithm {
    static cleanCanvasButton = document.getElementById(
        'algorithm-neural-network-clean-canvas-button'
    );
    static sendPictureButton = document.getElementById(
        'algorithm-neural-network-send-picture-button'
    );
    static retrainModelButton = document.getElementById(
        'algorithm-neural-network-retrain-model-button'
    );
    static saveModelButton = document.getElementById('algorithm-neural-network-save-model-button');

    static canvas = new Canvas();

    static setUp() {
        let canvas = this.canvas.canvas;
        let canvasContext = this.canvas.canvasContext;
        this.cleanCanvasButton.addEventListener('click', () => {
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        });

        this.sendPictureButton.addEventListener('click', () => {
            let imageEditor = new ImageEditor(canvas, canvasContext);
            ClientServerInterractor.sendPicture(imageEditor.getImage());
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        });

        this.retrainModelButton.addEventListener('click', () => {
            let imageEditor = new ImageEditor(canvas, canvasContext);
            ClientServerInterractor.sendPicture(imageEditor.getImage());
            retrainModelInput.value = '';
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        });

        this.saveModelButton.addEventListener('click', ClientServerInterractor.saveModel);
    }
}

NeuralNetworkAlgorithm.setUp();
