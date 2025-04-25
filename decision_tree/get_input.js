import { DecisionTree } from './decision_tree.js';
import { DecisionTreeVisualizer } from './visualizer.js';

let trainDataInput = document.getElementById('algorithm-decision-tree-file-upload');
let testDataInput = document.getElementById('algorithm-decision-tree-test-data-input');
let targetAttributeInput = document.getElementById(
    'algorithm-decision-tree-target-attribute-input'
);

let label = document.getElementById('algorithm-decision-tree-file-upload-file-upload-label');

let maxDepthInput = document.getElementById('algorithm-decision-tree-max-depth-input');
let minGrouSizeInput = document.getElementById('algorithm-decision-tree-min-group-input');
let maxGiniScoreInput = document.getElementById('algorithm-decision-tree-max-gini-input');

let buildTreeButton = document.getElementById('algorithm-decision-tree-train-button');
let useTreeButton = document.getElementById('algorithm-decision-tree-use-tree-button');

let predictionField = document.getElementById('algorithm-decision-tree-prediction');

let tree;
let treeVisualization;
let dataAttributes;
let targetAttribute;
let maxDepth = 5;
let minGroupSize = 5;
let maxGiniScore = 0.4;
let trainingData;

class TextEditor {
    static readFile() {
        let files = trainDataInput.files;
        if (files.length == 0) {
            alert('No file chosen!');
            return;
        }
        let file = files[0];
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = function () {
                let text = reader.result;
                TextEditor.parseFile(text);
                resolve();
            };
            reader.onerror = function () {
                reject(new Error('Error reading file'));
            };
            reader.readAsText(file);
        });
    }

    static parseFile(input) {
        const lines = input.trim().split('\n');
        const headers = lines[0].split(',');
        let data = Array();
        for (let i = 1; i < lines.length; i++) {
            data.push(TextEditor.parseLine(lines[i], headers));
        }
        dataAttributes = headers;
        trainingData = data;
    }

    static parseLine(line, headers) {
        let values = line.split(',');
        let oneSet = {};
        for (let j = 0; j < values.length; j++) {
            let value = Number(values[j]);
            if (isNaN(value)) {
                value = values[j].trim();
            }
            oneSet[headers[j].trim()] = value;
        }
        return oneSet;
    }
}

function changeLabel() {
    let files = trainDataInput.files;
    if (files.length == 0) {
        alert('No file chosen!');
        return;
    }
    let file = files[0];

    label.innerText = file.name;
}

function buildTree() {
    TextEditor.readFile().then(() => {
        targetAttribute = targetAttributeInput.value;
        maxDepth = Math.max(3, Math.min(7, Number(maxDepthInput.value)));
        minGroupSize = Math.max(1, Math.min(20, Number(minGrouSizeInput.value)));
        maxGiniScore = Math.max(0.1, Math.min(0.5, Number(maxGiniScoreInput.value)));

        if (!trainingData || !targetAttribute) {
            alert('Fill in all the fields.');
            return;
        }

        let label = document.getElementById(
            'algorithm-decision-tree-file-upload-file-upload-label'
        );
        label.innerText = 'Upload Dataset';

        tree = new DecisionTree(
            trainingData,
            targetAttribute,
            maxDepth,
            minGroupSize,
            maxGiniScore
        );
        treeVisualization = new DecisionTreeVisualizer(tree.root, 'algorith-decision-tree-graph');

        console.log(tree);
    });
}

async function getPrediction() {
    let data = testDataInput.value;

    if (!data) {
        alert('Input test data');
        return;
    }

    if (!tree) {
        alert('Build a tree first');
        return;
    }
    let headers = [...dataAttributes];
    headers.splice(headers.indexOf(targetAttribute), 1);
    if (headers.length !== data[0].length) {
        alert("The amount of input parameters doesn't match.");
    }
    data = TextEditor.parseLine(data, headers);
    let prediciton = await tree.getPrediction(data);
    predictionField.innerText = `Prediction: ${prediciton}`;
}

buildTreeButton.addEventListener('click', buildTree);
useTreeButton.addEventListener('click', getPrediction);
trainDataInput.addEventListener('change', changeLabel);
