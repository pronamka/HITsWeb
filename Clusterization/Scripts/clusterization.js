import {Algorithms} from "./algorithms.js";
import {Config} from "./config.js";


const kMeanStartBtn = document.getElementById(Config.DOM_IDS.KMEANS_BTN);
const hierarchicalStartBtn = document.getElementById(Config.DOM_IDS.HIERARCHICAL_BTN);
const miniBatchKMeansStartBtn = document.getElementById(Config.DOM_IDS.MINIBATCH_BTN);
const clusterInput = document.getElementById(Config.DOM_IDS.CLUSTERS_INPUT);
const clearBtn = document.getElementById(Config.DOM_IDS.CLEAR_BTN);

let cells = [];
let chosenCells = new Set();
let clusterCnt = 0;
let pointsArray = [];
let kMeansClusters;
let hierarchicalClusters;
let miniBatchKMeansClusters;

const screenState = {
    firstAlg: false,
    secondAlg: false,
    thirdAlg: false,
};

class Location {
    constructor(y, x) {
        this.y = y;
        this.x = x;
    }
}


function showKMeansClusters() {
    if (clusterInput.value === '') {
        return;
    }

    if (screenState.firstAlg === false) {
        kMeanStartBtn.classList.remove(Config.CSS_CLASSES.KMEANS_INACTIVE);
        kMeanStartBtn.classList.add(Config.CSS_CLASSES.KMEANS_ACTIVE);
        screenState.firstAlg = true;
        applyKMeansColoring();
    } else {
        screenState.firstAlg = false;
        kMeanStartBtn.classList.remove(Config.CSS_CLASSES.KMEANS_ACTIVE);
        kMeanStartBtn.classList.add(Config.CSS_CLASSES.KMEANS_INACTIVE);
        makeAllTransparent();

        if (screenState.secondAlg === true) {
            applyHierarchicalColoring();
        }
        if (screenState.thirdAlg === true) {
            applyMiniBatchKMeansColoring();
        }

        if (screenState.secondAlg === false && screenState.thirdAlg === false) {
            cancelAllAlg();
        }
    }
}

function showHierarchicalClusters() {
    if (clusterInput.value === '') {
        return;
    }

    if (screenState.secondAlg === false) {
        hierarchicalStartBtn.classList.remove(Config.CSS_CLASSES.HIERARCHICAL_INACTIVE);
        hierarchicalStartBtn.classList.add(Config.CSS_CLASSES.HIERARCHICAL_ACTIVE);
        screenState.secondAlg = true;
        applyHierarchicalColoring();
    } else {
        hierarchicalStartBtn.classList.add(Config.CSS_CLASSES.HIERARCHICAL_INACTIVE);
        hierarchicalStartBtn.classList.remove(Config.CSS_CLASSES.HIERARCHICAL_ACTIVE);
        screenState.secondAlg = false;

        makeAllTransparent();

        if (screenState.firstAlg === true) {
            applyKMeansColoring();
        }
        if (screenState.thirdAlg === true) {
            applyMiniBatchKMeansColoring();
        }

        if (screenState.firstAlg === false && screenState.thirdAlg === false) {
            cancelAllAlg();
        }
    }
}

function showMiniBatchKMeansClusters() {
    if (clusterInput.value === '') {
        return;
    }

    if (screenState.thirdAlg === false) {
        miniBatchKMeansStartBtn.classList.remove(Config.CSS_CLASSES.MINI_BATCH_INACTIVE);
        miniBatchKMeansStartBtn.classList.add(Config.CSS_CLASSES.MINI_BATCH_ACTIVE);
        screenState.thirdAlg = true;
        applyMiniBatchKMeansColoring();
    } else {
        miniBatchKMeansStartBtn.classList.add(Config.CSS_CLASSES.MINI_BATCH_INACTIVE);
        miniBatchKMeansStartBtn.classList.remove(Config.CSS_CLASSES.MINI_BATCH_ACTIVE);
        screenState.thirdAlg = false;

        makeAllTransparent();

        if (screenState.firstAlg === true) {
            applyKMeansColoring();
        }
        if (screenState.secondAlg === true) {
            applyHierarchicalColoring();
        }

        if (screenState.firstAlg === false && screenState.secondAlg === false) {
            cancelAllAlg();
        }
    }
}

function cancelAllAlg() {
    pointsArray = Array.from(chosenCells);
    pointsArray.forEach((cell) => {
        const cellElement = document.getElementById(
            `${Config.CSS_CLASSES.GRID_CELL}-${cell.y}-${cell.x}`
        );
        for (let i = 0; i < 3; i++) {
            cellElement.children[i].style.backgroundColor = Config.COLORS.TRANSPARENT;
            if (i === 1) {
                for (let j = 0; j < 2; j++) {
                    cellElement.children[1].children[j].style.backgroundColor = Config.COLORS.TRANSPARENT;
                }
            }
        }
        cellElement.style.backgroundColor = Config.COLORS.CHOSEN_CELL;
    });
}

function makeAllTransparent() {
    pointsArray.forEach((cell) => {
        const cellElement = document.getElementById(
            `${Config.CSS_CLASSES.GRID_CELL}-${cell.y}-${cell.x}`
        );
        cellElement.style.backgroundColor = Config.COLORS.TRANSPARENT;
        cellElement.children[0].style.backgroundColor = Config.COLORS.TRANSPARENT;
        cellElement.children[1].style.backgroundColor = Config.COLORS.TRANSPARENT;
        cellElement.children[2].style.backgroundColor = Config.COLORS.TRANSPARENT;
        cellElement.children[1].children[0].style.backgroundColor = Config.COLORS.TRANSPARENT;
        cellElement.children[1].children[1].style.backgroundColor = Config.COLORS.TRANSPARENT;
    });
}

function applyKMeansColoring() {
    pointsArray = Array.from(chosenCells);
    clusterCnt = parseInt(clusterInput.value, 10);
    kMeansClusters = Algorithms.kMeansClustering(pointsArray, Math.min(clusterCnt, pointsArray.length));
    pointsArray.forEach((cell, index) => {
        const group = kMeansClusters[index];
        const cellElement = document.getElementById(
            `${Config.CSS_CLASSES.GRID_CELL}-${cell.y}-${cell.x}`
        );
        if (screenState.secondAlg === true && screenState.thirdAlg === true) {
            cellElement.children[0].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[0][group];
            applyHierarchicalColoring();
        } else if (
            (screenState.secondAlg === false && screenState.thirdAlg === true) ||
            (screenState.secondAlg === true && screenState.thirdAlg === false)
        ) {
            cellElement.children[0].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[0][group];
            cellElement.children[1].children[0].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[0][group];
        } else if (screenState.secondAlg === false && screenState.thirdAlg === false) {
            cellElement.style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[0][group];
        }
    });
}

function applyMiniBatchKMeansColoring() {
    pointsArray = Array.from(chosenCells);
    clusterCnt = parseInt(clusterInput.value, 10);
    miniBatchKMeansClusters = Algorithms.miniBatchKMeansClustering(pointsArray, Math.min(clusterCnt, pointsArray.length));
    pointsArray.forEach((cell, index) => {
        const group = miniBatchKMeansClusters[index];
        const cellElement = document.getElementById(
            `${Config.CSS_CLASSES.GRID_CELL}-${cell.y}-${cell.x}`
        );
        if (screenState.secondAlg === true && screenState.firstAlg === true) {
            cellElement.children[2].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[2][group];
            applyHierarchicalColoring();
        } else if (
            (screenState.secondAlg === false && screenState.firstAlg === true) ||
            (screenState.secondAlg === true && screenState.firstAlg === false)
        ) {
            cellElement.children[2].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[2][group];
            cellElement.children[1].children[1].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[2][group];
        } else if (screenState.secondAlg === false && screenState.firstAlg === false) {
            cellElement.style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[2][group];
        }
    });
}

function applyHierarchicalColoring() {
    pointsArray = Array.from(chosenCells);
    clusterCnt = parseInt(clusterInput.value, 10);
    hierarchicalClusters = Algorithms.hierarchicalClustering(pointsArray, Math.min(clusterCnt, pointsArray.length));
    pointsArray.forEach((cell, index) => {
        const group = hierarchicalClusters[index];
        const cellElement = document.getElementById(
            `${Config.CSS_CLASSES.GRID_CELL}-${cell.y}-${cell.x}`
        );
        if (screenState.firstAlg === true && screenState.thirdAlg === true) {
            cellElement.children[1].children[0].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[1][group];
            cellElement.children[1].children[1].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[1][group];
        } else if (screenState.firstAlg === true && screenState.thirdAlg === false) {
            cellElement.children[2].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[1][group];
            cellElement.children[1].children[1].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[1][group];
        } else if (screenState.firstAlg === false && screenState.thirdAlg === true) {
            cellElement.children[0].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[1][group];
            cellElement.children[1].children[0].style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[1][group];
        } else if (screenState.firstAlg === false && screenState.thirdAlg === false) {
            cellElement.style.backgroundColor = Config.COLORS.ALGORITHM_COLORS[1][group];
        }
    });
}

function initGrid() {
    let grid = document.getElementById(Config.DOM_IDS.GRID);
    grid.innerHTML = '';
    cells = Array(Config.GRID.WIDTH)
        .fill()
        .map(() => Array(Config.GRID.HEIGHT));

    for (let i = 0; i < Config.GRID.WIDTH; i++) {
        const row = document.createElement('div');
        row.className = Config.CSS_CLASSES.GRID_ROW;
        for (let j = 0; j < Config.GRID.HEIGHT; j++) {
            const cell = document.createElement('div');
            cell.className = Config.CSS_CLASSES.GRID_CELL;
            cell.id = `${Config.CSS_CLASSES.GRID_CELL}-${i}-${j}`;
            cells[i][j] = new Location(i, j);
            cell.addEventListener('click', function () {
                if (chosenCells.has(cells[i][j])) {
                    const currentCell = document.getElementById(
                        `${Config.CSS_CLASSES.GRID_CELL}-${i}-${j}`
                    )
                    currentCell.style.backgroundColor = Config.COLORS.TRANSPARENT;
                    currentCell.children[0].style.backgroundColor = Config.COLORS.TRANSPARENT;
                    currentCell.children[1].style.backgroundColor = Config.COLORS.TRANSPARENT;
                    currentCell.children[2].style.backgroundColor = Config.COLORS.TRANSPARENT;
                    currentCell.children[1].children[0].style.backgroundColor = Config.COLORS.TRANSPARENT;
                    currentCell.children[1].children[1].style.backgroundColor = Config.COLORS.TRANSPARENT;

                    chosenCells.delete(cells[i][j]);
                } else {
                    document.getElementById(
                        `${Config.CSS_CLASSES.GRID_CELL}-${i}-${j}`
                    ).style.backgroundColor = Config.COLORS.CHOSEN_CELL;
                    chosenCells.add(cells[i][j]);
                }
                if (clusterInput.value !== '') {
                    if (screenState.firstAlg === true) {
                        applyKMeansColoring();
                    }
                    if (screenState.secondAlg === true) {
                        applyHierarchicalColoring();
                    }
                    if (screenState.thirdAlg === true) {
                        applyMiniBatchKMeansColoring();
                    }
                }
            });

            for (let i = 0; i < 3; i++) {
                let subCell = document.createElement('div');
                subCell.className = Config.CSS_CLASSES.GRID_SUBCELL;
                if (i === 1) {
                    for (let j = 0; j < 2; j++) {
                        let subSubCell = document.createElement('div');
                        subSubCell.className = Config.CSS_CLASSES.GRID_SUBSUBCELL;
                        subCell.appendChild(subSubCell);
                    }
                }
                cell.appendChild(subCell);
            }
            row.appendChild(cell);
        }
        grid.appendChild(row);
    }
}

function clearGrid() {
    makeAllTransparent();
    chosenCells.clear();

    screenState.firstAlg = false;
    kMeanStartBtn.classList.add(Config.CSS_CLASSES.KMEANS_INACTIVE);
    kMeanStartBtn.classList.remove(Config.CSS_CLASSES.KMEANS_ACTIVE);

    screenState.secondAlg = false;
    hierarchicalStartBtn.classList.add(Config.CSS_CLASSES.HIERARCHICAL_INACTIVE);
    hierarchicalStartBtn.classList.remove(Config.CSS_CLASSES.HIERARCHICAL_ACTIVE);

    screenState.thirdAlg = false;
    miniBatchKMeansStartBtn.classList.add(Config.CSS_CLASSES.MINI_BATCH_INACTIVE);
    miniBatchKMeansStartBtn.classList.remove(Config.CSS_CLASSES.MINI_BATCH_ACTIVE);
}


kMeanStartBtn.addEventListener('click', showKMeansClusters);
hierarchicalStartBtn.addEventListener('click', showHierarchicalClusters);
miniBatchKMeansStartBtn.addEventListener('click', showMiniBatchKMeansClusters);
clusterInput.addEventListener('keypress', function (e) {
    if (e.key === '.' || e.key === ',') {
        e.preventDefault();
    }
});
clearBtn.addEventListener('click', clearGrid);
clusterInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^1-9]/g, '');

    if (this.value.length > 1) {
        this.value = this.value.slice(0, 1);
    }

    const num = parseInt(this.value);
    if (num > Config.CLUSTERING.MAX_CLUSTERS) {
        this.value = Config.CLUSTERING.MAX_CLUSTERS;
    }

    if (parseInt(this.value) !== clusterCnt && this.value !== '') {
        if (screenState.firstAlg === true) {
            applyKMeansColoring();
        }
        if (screenState.secondAlg === true) {
            applyHierarchicalColoring();
        }
        if (screenState.thirdAlg === true) {
            applyMiniBatchKMeansColoring();
        }
    }
});



initGrid();


