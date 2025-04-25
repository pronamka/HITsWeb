import {Config} from "./config.js";
import {Node} from "./node.js"

//==============================
//          GLOBALS
//==============================
let size;
let isStopped;

const button = document.getElementById('generate');
button.addEventListener('click', generateMaze);

const button1 = document.getElementById('astar');
button1.addEventListener('click', () => solve());

const buttonStop = document.getElementById('stopAlg');
buttonStop.addEventListener('click', () => {
    isStopped = true;
    buttonStop.classList.add('pressed');
});

let array = []; // array of states
let startX;
let startY;
let finishX;
let finishY;

//==============================
//        EMPTY BOARD
//==============================

function drawEmptyBoard(eSize) {
    array = createArray(eSize * eSize, () => 0);
    const board = document.getElementById('board');
    board.innerHTML = '';

    const maxBoardSizePx = Math.min(window.innerWidth, window.innerHeight) * Config.MAX_BOARD_SIZE_PX_COEFFICIENT;
    const tileSizePx = Math.min(Math.floor(maxBoardSizePx / eSize), Config.MAX_TILE_SIZE);
    document.documentElement.style.setProperty('--tile-size', `${tileSizePx}px`);

    for (let y = 0; y < eSize; y++) {
        const row = document.createElement('div');
        row.className = 'maze-row';

        for (let x = 0; x < eSize; x++) {
            const tile = document.createElement('div');
            tile.className = 'tile-' + getTileClass(0);
            tile.id = `tile-${y}-${x}`;

//            const index = y * eSize + x;
            const tile_id = `tile-${y}-${x}`;
            tile.addEventListener('click', () => changeState(x, y, tile_id));

            row.appendChild(tile);
        }

        board.appendChild(row);
    }
}

//==============================
//        CREATE BOARD
//==============================

function generateMaze() {
    buttonStop.classList.remove('pressed');

    thinkTiles = [];
    size = document.getElementById('size').value;

    const maxBoardSizePx = Math.min(window.innerWidth, window.innerHeight) * Config.MAX_BOARD_SIZE_PX_COEFFICIENT;
    const tileSizePx = Math.min(Math.floor(maxBoardSizePx / size), Config.MAX_TILE_SIZE);
    document.documentElement.style.setProperty('--tile-size', `${tileSizePx}px`);

    const board = document.getElementById('board');
    board.innerHTML = '';

    array = createArray(size, () => 1);

    drawWalls(size);

    let sX = getRandomFrom(
        Array.from({ length: size }, (_, index) => index).filter((x) => isEven(x))
    );
    let sY = getRandomFrom(
        Array.from({ length: size }, (_, index) => index).filter((y) => isEven(y))
    );
    setTile(sX, sY, 0);

    let digger = { x: sX, y: sY };

    while (!isMaze(size)) {
        dig(digger, size);
    }

    startX = getRandomFrom(
        Array.from({ length: size }, (_, index) => index).filter((x) => isEven(x))
    );
    startY = getRandomFrom(
        Array.from({ length: size }, (_, index) => index).filter((y) => isEven(y))
    );
    setTile(startX, startY, 2);


    do {
        finishX = getRandomFrom(
            Array.from({ length: size }, (_, index) => index).filter((x) => isEven(x))
        );
        finishY = getRandomFrom(
            Array.from({ length: size }, (_, index) => index).filter((y) => isEven(y))
        );
    } while (finishX === startX && finishY === startY);

    setTile(finishX, finishY, 3);
}



function drawWalls(size) {
    for (let y = 0; y < size; y++) {
        const row = document.createElement('div');
        row.className = 'maze-row';

        for (let x = 0; x < size; x++) {
            const tile = document.createElement('div');
            tile.className = 'tile-' + getTileClass(1);
            tile.id = `tile-${y}-${x}`;

//            const index = y * size + x;
            const tile_id = `tile-${y}-${x}`;
            tile.addEventListener('click', () => changeState(x, y, tile_id));

            row.appendChild(tile);
        }

        board.appendChild(row);
    }
}

//==============================
//        DIG THE WALLS
//==============================

function dig(digger, size) {
    const directions = [];

    if (digger.x > 0) directions.push('left');
    if (digger.x < size - 2) directions.push('right');
    if (digger.y > 0) directions.push('up');
    if (digger.y < size - 2) directions.push('down');

    const direct = getRandomFrom(directions);

    switch (direct) {
        case 'left':
            if (getTile(digger.x - 2, digger.y) === 1) {
                setTile(digger.x - 1, digger.y, 0);
                setTile(digger.x - 2, digger.y, 0);
            }
            digger.x -= 2;
            break;

        case 'right':
            if (getTile(digger.x + 2, digger.y) === 1) {
                setTile(digger.x + 1, digger.y, 0);
                setTile(digger.x + 2, digger.y, 0);
            }
            digger.x += 2;
            break;

        case 'up':
            if (getTile(digger.x, digger.y - 2) === 1) {
                setTile(digger.x, digger.y - 1, 0);
                setTile(digger.x, digger.y - 2, 0);
            }
            digger.y -= 2;
            break;

        case 'down':
            if (getTile(digger.x, digger.y + 2) === 1) {
                setTile(digger.x, digger.y + 1, 0);
                setTile(digger.x, digger.y + 2, 0);
            }
            digger.y += 2;
            break;
    }
}

//==============================
//      HELPER FUNCTIONS
//==============================

const createArray = (size, initial) => Array.from({ length: size * size }, (_, i) => initial(i));

function getTileClass(value) {
    return Config.CLASS_MAP.get(value);
}

function changeState(x, y, tile_id) {
    const index = y * size + x;

    if (array[index] === 0) {
        array[index] = 1;
    } else if (array[index] === 1) {
        array[index] = 2;
    } else if (array[index] === 2) {
        array[index] = 3;
    } else {
        array[index] = 0;
    }

    const element = document.getElementById(tile_id);
    element.className = 'tile-' + getTileClass(array[index]);
}

function isEven(n) {
    return n % 2 === 0;
}

function getRandomFrom(array) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

// Assign tile state as value
function setTile(x, y, value) {
    if (x < 0 || x >= size || y < 0 || y >= size) {
        return null;
    }

    const index = y * size + x;
    array[index] = value;
    const tile_id = `tile-${y}-${x}`;

    const element = document.getElementById(tile_id);
    element.className = 'tile-' + getTileClass(array[index]);
}

// Get tile state value by coordinates
function getTile(x, y) {
    if (x < 0 || x >= size || y < 0 || y >= size) {
        return null;
    }

    const index = y * size + x;
    return array[index];
}

function isMaze(size) {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            if (isEven(x) && isEven(y) && getTile(x, y) === 1) {
                return false;
            }
        }
    }
    return true;
}

//==============================
//         ASTAR ALG
//==============================

let waitingTime;
if (size > 27) {
    waitingTime = 2;
} else {
    waitingTime = 10;
}



class aStar {
    constructor(grid, start, end) {
        this.grid = grid;
        this.start = start;
        this.end = end;
        this.openList = [];
        this.closedList = [];
    }

    isOpen(x, y) {
        return this.grid[y] && this.grid[y][x] !== 1;
    }

    getNeighbours(node) {
        const neighbours = [];
        const directions = [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 },
        ];

        for (let dir of directions) {
            const nx = node.x + dir.x;
            const ny = node.y + dir.y;

            if (
                nx >= 0 &&
                nx < this.grid[0].length &&
                ny >= 0 &&
                ny < this.grid.length &&
                this.isOpen(nx, ny)
            ) {
                neighbours.push(new Node(nx, ny));
            }
        }

        return neighbours;
    }

    isNodeInList(list, x, y) {
        return list.some((node) => node.x === x && node.y === y);
    }

    getNodeFromList(list, x, y) {
        return list.find((node) => node.x === x && node.y === y);
    }

    async findPath() {
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        let startNode = new Node(this.start.x, this.start.y);
        let endNode = new Node(this.end.x, this.end.y);
        startNode.setHeuristic(endNode);

        this.openList.push(startNode);

        while (this.openList.length > 0) {
            if (isStopped) return [];
            for (let node of this.openList) {
                if (isStopped) return [];
                setTile(node.x, node.y, 4);
                thinkTiles.push({ x: node.x, y: node.y });
                await sleep(waitingTime);
            }

            this.openList.sort((a, b) => a.f - b.f);
            let curr = this.openList.shift();

            if (curr.x === endNode.x && curr.y === endNode.y) {
                let path = [];
                let temp = curr;
                while (temp) {
                    if (isStopped) return [];
                    path.push({ x: temp.x, y: temp.y });
                    setTile(temp.x, temp.y, 6);
                    await sleep(waitingTime);
                    temp = temp.parent;
                }

                return path.reverse();
            }

            this.closedList.push(curr);
            exploredTiles.push({ x: curr.x, y: curr.y });
            setTile(curr.x, curr.y, 5);
            await sleep(20);

            let neighbours = this.getNeighbours(curr);

            for (let neighbour of neighbours) {
                if (isStopped) return [];
                // skip if already in closed list
                if (this.isNodeInList(this.closedList, neighbour.x, neighbour.y)) {
                    continue;
                }

                let testG = curr.g + 1;

                // check if neighbor is already in open list
                let inOpenList = this.isNodeInList(this.openList, neighbour.x, neighbour.y);

                if (!inOpenList) {
                    // if not in open list add it
                    neighbour.g = testG;
                    neighbour.setHeuristic(endNode);
                    neighbour.parent = curr;
                    this.openList.push(neighbour);
                } else {
                    // Already in open list, check if this path is better
                    let existingNode = this.getNodeFromList(
                        this.openList,
                        neighbour.x,
                        neighbour.y
                    );

                    if (testG < existingNode.g) {
                        // This path is better
                        existingNode.g = testG;
                        existingNode.f = existingNode.g + existingNode.h;
                        existingNode.parent = curr;
                    }
                }
            }
        }

        return []; // No path found
    }
}

let grid = [];
let thinkTiles = [];
let exploredTiles = [];
async function solve() {
    //disable buttons
    button1.classList.add('pressed');
    buttonStop.classList.remove('pressed');

    isStopped = false;
    button.disabled = true;
    button1.disabled = true;

    try {
        //rewrite array into grid for astar
        const len = array.length;
        const side = Math.sqrt(len);
        for (let row = 0; row < side; row++) {
            grid.push(array.slice(side * row, side * (row + 1)));
        }

        for (let y = 0; y < side; y++) {
            for (let x = 0; x < side; x++) {
                if (grid[y][x] === 2) {
                    startX = x;
                    startY = y;
                } else if (grid[y][x] === 3) {
                    finishX = x;
                    finishY = y;
                }
            }
        }

        for (let i = 0; i < thinkTiles.length; i++) {
            setTile(thinkTiles[i].x, thinkTiles[i].y, 0);
        }
        setTile(startX, startY, 2);
        setTile(finishX, finishY, 3);

        const start = { x: startX, y: startY };
        const end = { x: finishX, y: finishY };

        const astar = new aStar(grid, start, end);
        await astar.findPath();
    } finally {
        button1.classList.remove('pressed');
        button.disabled = false;
        button1.disabled = false;
        isStopped = false;

        grid = [];
    }
}

drawEmptyBoard(Config.START_FIELD_SIZE);
