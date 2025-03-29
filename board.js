let button = document.getElementById('add-tile-button');
let board = document.getElementById('board');
let matrix = [];

button.addEventListener('click', () => {
    let width = document.getElementById('board-width-input').value;
    let height = document.getElementById('board-height-input').value;

    board.style.gridTemplateColumns = `repeat(${width}, 1fr)`;

    matrix = createArray(width, height, () => 0);

    drawBoard();
});

const drawBoard = () => board.replaceChildren(...matrix.map(getTile));

const updateTile = (value, i) => board.replaceChild(getTile(value, i), board.children[i]);

const getTile = (value, i) => {
    let template = document.createElement('div');
    template.setAttribute('id', 'board-tile-' + i);
    template.className = 'board-tile ' + getTileClass(value);
    template.addEventListener('click', () => {
        matrix[i] = matrix[i] === 0 ? 1 : 0;
        updateTile(matrix[i], i);
    });

    return template;
};

const getTileClass = (value) => ClassMap.get(value);
const ClassMap = new Map([
    [0, 'tile-empty'],
    [1, 'tile-filled'],
    [2, 'tile-start'],
    [3, 'tile-finish'],
    [4, 'tile-path'],
    [5, 'tile-attempt'],
]);

const createArray = (width, heigth, initial) =>
    Array.from({ length: width * heigth }, (_, i) => initial(i));
