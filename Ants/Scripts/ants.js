import {Ant} from "./ant.js";
import {Location} from "./location.js";
import {Config} from "./config.js";

const startButton = document.getElementById('startBtn');
const antsInputField = document.getElementById('ants');

let ants_ = [];
let matrix = [];
let optimization;
let isRunning = false;
let ants = 0;
let paintState = Config.PAINT_STATE.FOOD;
let draw = false;
let stopSimulation = false;
let speed = Config.DEFAULT_SPEED;
let startX = Config.DEFAULT_START_X;
let startY = Config.DEFAULT_START_Y;

const grid = document.getElementById('grid');

document.getElementById('wallBtn').addEventListener('click', () => {
    paintState = Config.PAINT_STATE.WALL;
});
document.getElementById('clearBtn').addEventListener('click', () => {
    paintState = Config.PAINT_STATE.CLEAR;
});
document.getElementById('foodBtn').addEventListener('click', () => {
    paintState = Config.PAINT_STATE.FOOD;
});
document.getElementById('nestBtn').addEventListener('click', () => {
    paintState = Config.PAINT_STATE.NEST;
    console.log(paintState)
});

document.getElementById('startBtn').addEventListener("click",startSimulation);
document.getElementById('removeAllBtn').addEventListener("click",removeAll);

function drawTrue() {
    draw = true;
}

function drawFalse() {
    draw = false;
}


class Optimization {
    constructor(ants) {
        this.ants = ants;
    }

    #createAnts() {
        for (let i = 0; i < this.ants; i++) {
            ants_.push(new Ant(matrix[startY][startX]));
        }
    }

    async MainAlg(updateCallback) {
        this.#createAnts();
        let visitedGlobal = [];

        while (true) {
            if (stopSimulation) {
                stopSimulation = false;
                visitedGlobal = null;
                ants_ = null;
                return;
            }

            for (let ant of ants_) {
                ant.makeChoice(matrix);
            }

            for (let ant of ants_) {
                if (ant.curLoc.IsChanged === false) {
                    visitedGlobal.push(ant.curLoc);
                    ant.curLoc.lastChanged = true;
                }
            }

            for (let loc of visitedGlobal) {
                loc.toFoodPheromones *= 1 - Config.EVAPORATION_FOOD;
                loc.toHomePheromones *= 1 - Config.EVAPORATION_HOME;
            }

            if (updateCallback) {
                await updateCallback(visitedGlobal);
            }
        }
    }
}

function initDesk() {
    matrix = Array.from({ length: Config.HEIGHT }, (_, i) =>
        Array.from({ length: Config.WIDTH }, (_, j) => new Location(j, i, 1))
    );

    grid.innerHTML = '';
    document.body.addEventListener('mousedown', drawTrue);
    document.body.addEventListener('mouseup', drawFalse);

    for (let i = 0; i < Config.HEIGHT; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let j = 0; j < Config.WIDTH; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${i}-${j}`;

            const handleCellEvent = () => {
                if (draw) {
                    let curCell = document.getElementById(`cell-${i}-${j}`)
                    if (paintState === Config.PAINT_STATE.CLEAR) {
                        matrix[i][j].wall = false;
                        matrix[i][j].food = 0;
                        curCell.style.backgroundColor = '';
                        curCell.classList.remove('wall');
                        curCell.classList.remove('food');
                    } else if (paintState === Config.PAINT_STATE.FOOD) {
                        matrix[i][j].food = 5;
                        matrix[i][j].wall = false;
                        curCell.classList.add('food');
                        curCell.classList.remove('wall');
                    }
                }
            };
            cell.addEventListener('mouseenter', handleCellEvent);

            cell.addEventListener('click', () => {
                if (isRunning === false) {
                    if (paintState === Config.PAINT_STATE.NEST) {
                        document
                            .getElementById(`cell-${startY}-${startX}`)
                            .classList.remove('start');
                        startX = j;
                        startY = i;
                        cell.classList.add('start');
                    }
                }
            });
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }

    for (let i = 0; i < Config.HEIGHT; i++) {
        for (let j = 0; j < Config.WIDTH; j++) {
            let cell = document.getElementById(`cell-${i}-${j}`);
            cell.addEventListener('mouseenter', () => {
                if (draw) {
                    if (paintState === Config.PAINT_STATE.WALL) {
                        for (let y = -1; y < 2; y++) {
                            for (let x = -1; x < 2; x++) {
                                if (i + y > 0 && i + y < Config.HEIGHT - 1 && j + x > 0 && j + x < Config.WIDTH - 1) {
                                    matrix[i + y][j + x].wall = true;
                                    matrix[i + y][j + x].food = 0;
                                    let curCell = document.getElementById(`cell-${i + y}-${j + x}`);
                                    curCell.style.backgroundColor = '';
                                    curCell.classList.add('wall');
                                }
                            }
                        }
                        cell.classList.remove('food');
                    }
                }
            });
        }
    }

    document.getElementById(`cell-${startY}-${startX}`).classList.add("start")
}

function updateCells(changedCells = null) {
    if (!changedCells) {
        changedCells = [];
        for (let i = 0; i < Config.HEIGHT; i++) {
            for (let j = 0; j < Config.WIDTH; j++) {
                changedCells.push({ y: i, x: j });
            }
        }
    }

    for (const loc of changedCells.slice(-ants * 2)) {
        const cell = document.getElementById(`cell-${loc.Y}-${loc.X}`);
        if (!cell) continue;

        cell.className = 'cell';
        cell.style.backgroundColor = '';

        const antsHere = loc.antsHere;

        if (loc.food > 0) {
            cell.classList.add('food');
        } else if (loc.Y === startY && loc.X === startX) {
            cell.classList.add('start');
        } else if (antsHere === 1) {
            cell.classList.add('ant');
        } else if (antsHere === 2) {
            cell.classList.add('two-ants');
        } else if (antsHere > 2) {
            cell.classList.add('more-than-two-ants');
        }
    }
}

async function startSimulation() {
    if (isRunning) {
        return;
    }
    ants_ = [];
    ants = antsInputField.value;
    if (isRunning) {
        return;
    }
    isRunning = true;
    stopSimulation = false;
    startButton.classList.remove(Config.START_BUTTON_FIRST_STATE);
    startButton.classList.add(Config.START_BUTTON_SECOND_STATE);

    optimization = new Optimization(ants);

    const updateCallback = async (antPositions) => {
        updateCells(antPositions);
        await new Promise((resolve) => setTimeout(resolve, 100 - speed));
    };

    await optimization.MainAlg(updateCallback);
    isRunning = false;
}

function removeAll() {
    startButton.classList.remove(Config.START_BUTTON_SECOND_STATE);
    startButton.classList.add(Config.START_BUTTON_FIRST_STATE);
    stopSimulation = true;
    isRunning = false;
    matrix = [];
    initDesk();
}

initDesk();
