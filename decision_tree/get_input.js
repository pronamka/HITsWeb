import { DecisionTree } from './decision_tree.js';
import { DecisionTreeVisualizer } from './visualizer.js';

let trainDataInput = document.getElementById('algorithm-decision-tree-file-upload');
let testDataInput = document.getElementById('algorithm-decision-tree-test-data-input');
let targetAttributeInput = document.getElementById(
    'algorithm-decision-tree-target-attribute-input'
);
let buildTreeButton = document.getElementById('algorithm-decision-tree-train-button');
let useTreeButton = document.getElementById('algorithm-decision-tree-use-tree-button');

let predictionField = document.getElementById('algorithm-decision-tree-prediction');

let tree;
let treeVisualization;
let dataAttributes;
let targetAttribute;
let trainingData;

function buildTree() {
    readFile().then(() => {
        targetAttribute = targetAttributeInput.value;
        console.log(trainingData, dataAttributes, targetAttribute);

        if (!trainingData || !targetAttribute) {
            alert('Fill in all the fields.');
            return;
        }
        let label = document.getElementById(
            'algorithm-decision-tree-file-upload-file-upload-label'
        );
        label.innerText = 'Upload Dataset';

        tree = new DecisionTree(trainingData, targetAttribute);
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
    console.log(headers);
    data = parseLine(data, headers);
    let prediciton = await tree.getPrediction(data);
    predictionField.innerText = `Prediction: ${prediciton}`;
    console.log(prediciton);
}

function readFile() {
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
            parseFile(text);
            resolve();
        };
        reader.onerror = function () {
            reject(new Error('Error reading file'));
        };
        reader.readAsText(file);
    });
}

function parseFile(input) {
    const lines = input.trim().split('\n');
    const headers = lines[0].split(',');
    let data = Array();
    for (let i = 1; i < lines.length; i++) {
        data.push(parseLine(lines[i], headers));
    }
    dataAttributes = headers;
    trainingData = data;
}

function parseLine(line, headers) {
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

function changeLabel() {
    let files = trainDataInput.files;
    if (files.length == 0) {
        alert('No file chosen!');
        return;
    }
    let file = files[0];
    let label = document.getElementById('algorithm-decision-tree-file-upload-file-upload-label');
    label.innerText = file.name;
}

buildTreeButton.addEventListener('click', buildTree);
useTreeButton.addEventListener('click', getPrediction);
trainDataInput.addEventListener('change', changeLabel);
