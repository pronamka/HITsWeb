const WIDTH = 100;
const HEIGHT = 100;
const EVAPORATION_FOOD = 0.000006;
const EVAPORATION_HOME = 0.000006;
const TO_FOOD_REFUSE_COEF = 0.99;
const MAX_DISTANCE = 500;
const CHANCE_TO_GO_HOME = 0.01;
const RANGE = 15;
const INCREASE_COEF = 3;

let ants_ = [];
let matrix = [];
let optimization;
let isRunning = false;
let ants = 0;
let paintState = 2;
let draw = false;
let stopSimulation = false;
let startButton = document.getElementById("startBtn");
let antsInputField = document.getElementById("ants");
let speed = 83.3;
let startX = 50;
let startY = 50;


const grid = document.getElementById('grid');


document.getElementById("wallBtn").addEventListener("click", () => {
    paintState = 1;
});
document.getElementById("clearBtn").addEventListener("click", () => {
    paintState = 0;
});
document.getElementById("foodBtn").addEventListener("click", () => {
    paintState = 2;
});
document.getElementById("nestBtn").addEventListener("click", () => {
    paintState = 3;
    console.log(paintState)
});

function drawTrue() {
    draw = true;
}

function drawFalse() {
    draw = false;
}

class Location {
    constructor(x, y, pheromones = 0, food = 0) {
        this.X = x;
        this.Y = y;
        this.wall = false;
        this.food = food;
        this.IsChanged = false;
        this.antsHere = 0;
        this.toHomePheromones = 0;
        this.toFoodPheromones = 0;
    }
}

class Ant {
    constructor(start = new Location(0, 0)) {
        this.start = start;
        this.curLoc = start;
        this.dst = 0;
        this.foodFind = 0;
        this.improveValue = 0;
    }

    getNeighborLocs() {
        const locs = [];
        const dst = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
        const curY = this.curLoc.Y;
        const curX = this.curLoc.X;

        for (let d of dst) {
            const newY = curY + d[0];
            const newX = curX + d[1];

            if (newY >= 0 && newY < HEIGHT && newX >= 0 && newX < WIDTH) {
                const neighbor = matrix[newY][newX];
                if (!neighbor.wall) {
                    locs.push(neighbor);
                }
            }
        }
        return locs;
    }

    getWishForToFood(nextLoc) {
        const vec = [nextLoc.Y - this.curLoc.Y, nextLoc.X - this.curLoc.X];
        let wish = 0;
        let endsCnt = 0;
        let wallCnt = 0;
        const curY = this.curLoc.Y;
        const curX = this.curLoc.X;

        for (let i = 1; i < RANGE; i++) {

            const halfWidth = Math.floor(i / 2);

            for (let offset = -halfWidth; offset <= halfWidth; offset++) {
                const checkYOffset = curY + vec[0] * i + vec[1] * offset;
                const checkXOffset = curX + vec[1] * i - vec[0] * offset;

                if (checkYOffset >= 0 && checkYOffset < HEIGHT && checkXOffset >= 0 && checkXOffset < WIDTH) {
                    const cell = matrix[checkYOffset][checkXOffset];
                    if (!cell.wall) {
                        if (cell.food > 0) {
                            wish += 1000000;
                        } else {
                            wish += cell.toFoodPheromones;
                        }
                        wallCnt = 0;
                    } else {
                        if (wallCnt < 3) {
                            wallCnt++;
                        } else {
                            return [wish, endsCnt * 30];
                        }
                    }
                } else {
                    endsCnt++;
                }
            }
        }
        return [wish, endsCnt];
    }

    getWishForToHome(nextLoc) {
        const vec = [nextLoc.Y - this.curLoc.Y, nextLoc.X - this.curLoc.X];
        let wish = 0;
        let wallCnt = 0;
        const curY = this.curLoc.Y;
        const curX = this.curLoc.X;

        for (let i = 0; i < RANGE; i++) {

            const halfWidth = Math.floor(i / 2);

            for (let offset = -halfWidth; offset <= halfWidth; offset++) {
                const checkYOffset = curY + vec[0] * i + vec[1] * offset;
                const checkXOffset = curX + vec[1] * i - vec[0] * offset;

                if (checkYOffset >= 0 && checkYOffset < HEIGHT && checkXOffset >= 0 && checkXOffset < WIDTH) {
                    const cell = matrix[checkYOffset][checkXOffset];
                    if (!cell.wall) {
                        const isHome = checkYOffset === this.start.Y && checkXOffset === this.start.X;
                        if (isHome) {
                            wish += 1000000;
                        } else {
                            wish += cell.toHomePheromones;
                        }
                        wallCnt = 0;
                    } else {
                        if (wallCnt < 3) {
                            wallCnt++;
                        } else {
                            return wish
                        }
                    }
                }
            }
        }
        return wish;
    }

    makeChoice() {
        const neighborFields = this.getNeighborLocs();

        let wish = [];
        let sumWish = 0;
        let choosingProbability = [];
        let probability = [];

        if (this.dst > MAX_DISTANCE) {
            if (Math.random() < CHANCE_TO_GO_HOME) {
                this.foodFind = 1;
                this.improveValue = 0;
            }
        }

        if (this.foodFind === 0) {
            for (let f of neighborFields) {
                if (f.food > 0) {
                    this.foodFind = 1;
                    this.improveValue = (10000000 / (Math.pow(this.dst, INCREASE_COEF))) * f.food
                    break
                }
            }
            for (let f of neighborFields) {
                const [curFoodWish, antiWish] = this.getWishForToFood(f)
                const wishToFood = curFoodWish + 1
                const wishToHome = this.getWishForToHome(f) + 1
                const singleWish = Math.pow(wishToFood, 2.5) / wishToHome / (antiWish + 1)
                wish.push(singleWish)
                sumWish += singleWish
            }
            this.dst++;
            this.curLoc.toHomePheromones += 10000000 / (Math.pow(this.dst, INCREASE_COEF));

        } else {
            for (let f of neighborFields) {
                if (f.X === this.start.X && f.Y === this.start.Y) {
                    this.foodFind = 0
                    this.dst = 0
                    return;
                }
            }
            for (let f of neighborFields) {
                const [curFoodWish, antiWish] = this.getWishForToFood(f)
                const wishToFood = curFoodWish + 1
                const wishToHome = this.getWishForToHome(f) + 1
                const singleWish = Math.pow(wishToHome, 2.5) / wishToFood / (antiWish + 1);
                wish.push(singleWish);
                sumWish += singleWish;
            }
            this.curLoc.toFoodPheromones += this.improveValue;
            this.improveValue *= TO_FOOD_REFUSE_COEF;
        }


        if (wish.length === 0 || sumWish === 0) {
            return;
        }

        for (let neighbor = 0; neighbor < neighborFields.length; neighbor++) {
            probability.push(wish[neighbor] / sumWish);
            if (neighbor === 0) {
                choosingProbability.push(probability[neighbor]);
            } else {
                choosingProbability.push(choosingProbability[neighbor - 1] + probability[neighbor]);
            }
        }

        let nextStep = this.curLoc;
        const choose = Math.random();
        for (let n = 0; n < neighborFields.length; n++) {
            if (choose <= choosingProbability[n]) {
                nextStep = neighborFields[n];
                break;
            }
        }
        this.curLoc.antsHere--;
        this.curLoc = nextStep;
        this.curLoc.antsHere++;
    }
}

class Optimization {
    constructor(startLoc, ants) {
        this.ants = ants;
        this.start = startLoc;
    }

    CreateAnts() {
        for (let i = 0; i < this.ants; i++) {
            ants_.push(new Ant(matrix[startY][startX]));
        }
    }

    async MainAlg(updateCallback) {
        this.CreateAnts();
        let visitedGlobal = [];

        while (true) {
            if (stopSimulation) {
                stopSimulation = false;
                visitedGlobal = null;
                ants_ = null;
                return;
            }

            for (let ant of ants_) {
                ant.makeChoice();
            }

            for (let ant of ants_) {
                if (ant.curLoc.IsChanged === false) {
                    visitedGlobal.push(ant.curLoc);
                    ant.curLoc.lastChanged = true;
                }
            }

            for (let loc of visitedGlobal) {
                loc.toFoodPheromones *= 1 - EVAPORATION_FOOD;
                loc.toHomePheromones *= 1 - EVAPORATION_HOME;
            }

            if (updateCallback) {
                await updateCallback(visitedGlobal);
            }
        }
    }
}

function initDesk() {

    matrix = Array.from({length: HEIGHT}, (_, i) =>
        Array.from({length: WIDTH}, (_, j) => new Location(j, i, 1))
    );

    grid.innerHTML = '';
    document.body.addEventListener("mousedown", drawTrue);
    document.body.addEventListener("mouseup", drawFalse);

    for (let i = 0; i < HEIGHT; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let j = 0; j < WIDTH; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${i}-${j}`;

            const handleCellEvent = () => {
                if (draw) {
                    let curCell = document.getElementById(`cell-${i}-${j}`)
                    if (paintState === 0) {
                        matrix[i][j].wall = false;
                        matrix[i][j].food = 0;
                        curCell.style.backgroundColor = "";
                        curCell.classList.remove('wall');
                        curCell.classList.remove('food');
                    } else if (paintState === 2) {
                        matrix[i][j].food = 5;
                        matrix[i][j].wall = false;
                        curCell.classList.add('food');
                        curCell.classList.remove('wall');
                    }
                }
            }
            cell.addEventListener("mouseenter", handleCellEvent)

            cell.addEventListener("click", () => {
                console.log(cell)
                if (isRunning === false) {
                    if (paintState === 3) {
                        document.getElementById(`cell-${startY}-${startX}`).classList.remove("start");
                        startX = j;
                        startY = i;
                        cell.classList.add("start");
                    }
                }
            });
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }

    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            let cell = document.getElementById(`cell-${i}-${j}`);
            cell.addEventListener("mouseenter", () => {
                if (draw) {
                    if (paintState === 1) {
                        for (let y = -1; y < 2; y++) {
                            for (let x = -1; x < 2; x++) {
                                if (i + y > 0 && i + y < HEIGHT - 1 && j + x > 0 && j + x < WIDTH - 1) {
                                    matrix[i + y][j + x].wall = true;
                                    matrix[i + y][j + x].food = 0;
                                    let curCell = document.getElementById(`cell-${i + y}-${j + x}`);
                                    curCell.style.backgroundColor = "";
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
}


function updateCells(changedCells = null) {
    if (!changedCells) {
        changedCells = [];
        for (let i = 0; i < HEIGHT; i++) {
            for (let j = 0; j < WIDTH; j++) {
                changedCells.push({y: i, x: j});
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
            cell.classList.add("food");
        } else if (loc.Y === startY && loc.X === startX) {
            cell.classList.add("start");
        } else if (antsHere === 1) {
            cell.classList.add('ant');
        } else if (antsHere === 2) {
            cell.classList.add('ants5-10');
        } else if (antsHere > 2) {
            cell.classList.add('ants11-20');
        }
    }
}

async function startSimulation() {
    ants_ = [];
    ants = antsInputField.value;
    if (ants <= 0 || isRunning) {
        return;
    }
    isRunning = true;
    stopSimulation = false;
    startButton.classList.remove("btnStartState1");
    startButton.classList.add("btnStartState2");

    optimization = new Optimization(
        new Location(3, 3, 0),
        ants
    );

    const updateCallback = async (antPositions) => {
        updateCells(antPositions);
        await new Promise(resolve => setTimeout(resolve, 100 - speed));
    };

    await optimization.MainAlg(updateCallback);
    isRunning = false;
}

function removeAll() {
    startButton.classList.remove("btnStartState2");
    startButton.classList.add("btnStartState1");
    stopSimulation = true;
    isRunning = false;
    matrix = [];
    initDesk(0);
}

initDesk();


document.getElementById('startBtn').addEventListener("click",startSimulation);
document.getElementById('removeAllBtn').addEventListener("click",removeAll);