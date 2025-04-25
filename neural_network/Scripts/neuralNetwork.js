import { Canvas } from './canvas.js';
import { ImageEditor } from './imageEditor.js';

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

    static serverURL = 'http://127.0.0.1:5000/';
    static recognizeURL = 'recognize_digit';
    static saveURL = 'save_model';

    static processResponse(data) {
        console.log('Predicted digit:', data.digit);
        let percentages = data.percentages;
        PredictionsLayoutCreator.displayMainPrediction(data.digit, percentages[data.digit]);
        PredictionsLayoutCreator.updateCertainty(percentages);
    }

    static sendPicture(resizedArray) {
        fetch(`${this.serverURL}${this.recognizeURL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            body: JSON.stringify({
                image: Array.from(resizedArray),
                digit: Math.round(this.retrainModelInput.value),
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                this.processResponse(data);
            })
            .catch((error) => console.error('Error:', error));
    }

    static saveModel() {
        fetch(`${this.serverURL}${this.saveURL}`, {
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
    static retrainModelInput = document.getElementById(
        'algorithm-neural-network-retrain-model-input'
    );
    static saveModelButton = document.getElementById('algorithm-neural-network-save-model-button');

    static canvas = new Canvas();

    static setUp() {
        let canvas = this.canvas.canvas;
        let canvasContext = this.canvas.canvasContext;
        this.retrainModelInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');

            if (this.value.length > 1) {
                this.value = this.value.slice(0, 1);
            }
        });
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
