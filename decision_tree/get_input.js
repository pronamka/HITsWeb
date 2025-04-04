import { DecisionTree } from './decision_tree.js';

let trainDataInput = document.getElementById('algorithm-decision-tree-file-upload');
let targetAttributeInput = document.getElementById(
    'algorithm-decision-tree-target-attribute-input'
);
let trainTreeButton = document.getElementById('algorithm-decision-tree-train-button');

function handleInput() {
    readFile().then((data) => {
        let targetAttribute = targetAttributeInput.value;
        console.log(data, targetAttribute);

        if (!data || !targetAttribute) {
            alert('Fill in all the fields.');
            return;
        }

        let tree = new DecisionTree(data, targetAttribute);
        console.log(tree);
    });
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
            let data = parseFile(text);
            resolve(data);
        };
        reader.onerror = function () {
            reject(new Error('Error reading file'));
        };
        reader.readAsText(file);
    });
    /*
    let reader = new FileReader();
    reader.onload = function (file) {
        let text = reader.result;
        let data = parseFile(text);
        return data;
    };
    return reader.readAsText(file);*/
}

function parseFile(input) {
    const lines = input.trim().split('\n');
    const headers = lines[0].split(',');
    let data = Array();
    for (let i = 1; i < lines.length; i++) {
        let values = lines[i].split(',');
        let oneSet = {};
        for (let j = 0; j < values.length; j++) {
            let value = Number(values[j]);
            if (isNaN(value)) {
                value = values[j].trim();
            }
            oneSet[headers[j].trim()] = value;
        }
        data.push(oneSet);
    }
    return data;
}

trainTreeButton.addEventListener('click', handleInput);
