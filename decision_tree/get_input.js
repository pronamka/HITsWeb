let train_data_input = document.getElementById('algorithm-decision-tree-file-upload');
let train_tree_button = document.getElementById('algorithm-decision-tree-train-button');

function handleInput() {
    let files = train_data_input.files;
    if (files.length == 0) {
        alert('No file chosen!');
        return;
    }
    let file = files[0];
    let file_reader = new FileReader();
    file_reader.onload = function (file) {
        let text = file_reader.result;
        let data = parseFile(text);
        console.log(data);
    };
    file_reader.readAsText(file);
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

train_tree_button.addEventListener('click', handleInput);
