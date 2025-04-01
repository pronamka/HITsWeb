let train_data_input = document.getElementById('algorithm-decision-tree-file-upload');
let train_tree_button = document.getElementById('algorithm-decision-tree-train-button');

function handleInput() {
    let files = train_data_input.files;
    if (files.length == 0) {
        alert('No file chosen!');
        return;
    }
    let file = files[0];
}

function parseFile(file) {
    let file_reader = new FileReader();
    file_reader.onload = function () {
        let text = file_reader.result;
    };
    file_reader.readAsText(file);
}

train_tree_button.addEventListener('click', handleInput);
