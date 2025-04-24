const WIDTH = 25;
const HEIGHT = 25;
const kMeanStartBtn = document.getElementById('kmeans-start-btn');
const hierarchicalStartBtn = document.getElementById('hierarchical-start-btn');
const miniBatchKMeansStartBtn = document.getElementById('miniBatchKMeans-start-btn');
const clusterInput = document.getElementById('clusters');

let cells = [];
let chosenCells = new Set();
let clusterCntInputField = document.getElementById('clusters');
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

let algorithmColors = [
    [
        '#FF0000',
        '#33FF57',
        '#3357FF',
        '#F3FF33',
        '#FF33F3',
        '#33FFF3',
        '#FF8C33',
        '#9933FF',
        '#33FF99',
    ],

    [
        '#FF9999',
        '#99FF99',
        '#9999FF',
        '#FFFF99',
        '#FF99FF',
        '#99FFFF',
        '#FFCC99',
        '#CC99FF',
        '#99FFCC',
    ],

    [
        '#CC8888',
        '#88CC88',
        '#8888CC',
        '#CCCC88',
        '#CC88CC',
        '#88CCCC',
        '#CC9988',
        '#AA88CC',
        '#88CCAA',
    ],
];

class Location {
    constructor(y, x) {
        this.y = y;
        this.x = x;
    }
}

function kMeansClustering(points, k, maxIterations = 100, convergenceThreshold = 0.001) {
    if (points.length < k) {
        return Array(points.length)
            .fill()
            .map((_, i) => i);
    }

    let centroids = [{ ...points[Math.floor(Math.random() * points.length)] }];

    while (centroids.length < k) {
        let distances = points.map((point) => {
            return Math.min(
                ...centroids.map(
                    (centroid) =>
                        Math.pow(point.x - centroid.x, 2) + Math.pow(point.y - centroid.y, 2)
                )
            );
        });

        let sum = distances.reduce((a, b) => a + b, 0);
        let random = Math.random() * sum;

        let acc = 0;
        for (let i = 0; i < points.length; i++) {
            acc += distances[i];
            if (acc >= random) {
                centroids.push({ ...points[i] });
                break;
            }
        }
    }

    let clusterAssignments = Array(points.length);
    let iterations = 0;

    while (iterations < maxIterations) {
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            let minDistance = Infinity;
            let closestCluster = 0;

            for (let j = 0; j < centroids.length; j++) {
                const distance = Math.sqrt(
                    Math.pow(point.y - centroids[j].y, 2) + Math.pow(point.x - centroids[j].x, 2)
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    closestCluster = j;
                }
            }
            clusterAssignments[i] = closestCluster;
        }

        let newCentroids = Array(k)
            .fill()
            .map(() => ({ y: 0, x: 0, count: 0 }));

        for (let i = 0; i < points.length; i++) {
            const clusterIndex = clusterAssignments[i];
            newCentroids[clusterIndex].y += points[i].y;
            newCentroids[clusterIndex].x += points[i].x;
            newCentroids[clusterIndex].count++;
        }

        let maxCentroidShift = 0;
        for (let i = 0; i < k; i++) {
            if (newCentroids[i].count > 0) {
                const newY = newCentroids[i].y / newCentroids[i].count;
                const newX = newCentroids[i].x / newCentroids[i].count;

                const shift = Math.sqrt(
                    Math.pow(newY - centroids[i].y, 2) + Math.pow(newX - centroids[i].x, 2)
                );
                maxCentroidShift = Math.max(maxCentroidShift, shift);

                centroids[i] = {
                    y: newY,
                    x: newX,
                };
            }
        }

        iterations++;

        if (maxCentroidShift < convergenceThreshold) {
            break;
        }
    }
    let totalDistance = 0;
    for (let i = 0; i < points.length; i++) {
        const centroid = centroids[clusterAssignments[i]];
        totalDistance += Math.sqrt(
            Math.pow(points[i].y - centroid.y, 2) + Math.pow(points[i].x - centroid.x, 2)
        );
    }

    return clusterAssignments;
}

function miniBatchKMeansClustering(points, k) {
    const batchSize = Math.min(10, points.length);
    const maxIterations = 50;

    let centroids = [];
    let usedIndices = new Set();

    while (centroids.length < k) {
        const randomIndex = Math.floor(Math.random() * points.length);
        if (!usedIndices.has(randomIndex)) {
            usedIndices.add(randomIndex);
            centroids.push({
                x: points[randomIndex].x,
                y: points[randomIndex].y,
                count: 0,
            });
        }
    }

    let clusterAssignments = new Array(points.length).fill(0);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let batchIndices = new Set();
        while (batchIndices.size < batchSize) {
            batchIndices.add(Math.floor(Math.random() * points.length));
        }
        batchIndices = Array.from(batchIndices);

        batchIndices.forEach((pointIndex) => {
            const point = points[pointIndex];
            let minDistance = Infinity;
            let nearestCentroid = 0;

            centroids.forEach((centroid, centroidIndex) => {
                const distance = calculateDistance(point, centroid);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestCentroid = centroidIndex;
                }
            });

            clusterAssignments[pointIndex] = nearestCentroid;

            const centroid = centroids[nearestCentroid];
            centroid.count += 1;
            const learningRate = 1 / centroid.count;

            centroid.x = centroid.x * (1 - learningRate) + point.x * learningRate;
            centroid.y = centroid.y * (1 - learningRate) + point.y * learningRate;
        });
    }

    return clusterAssignments;
}

function hierarchicalClustering(points, k) {
    let clusters = points.map((point, index) => ({
        points: [point],
        index: index,
    }));

    let distances = [];
    for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
            distances.push({
                from: i,
                to: j,
                distance: calculateDistance(clusters[i].points[0], clusters[j].points[0]),
            });
        }
    }

    while (clusters.filter((c) => c !== null).length > k) {
        let minDistance = Infinity;
        let mergeIndexes = null;

        distances.forEach((d) => {
            if (d.distance < minDistance && clusters[d.from] !== null && clusters[d.to] !== null) {
                minDistance = d.distance;
                mergeIndexes = [d.from, d.to];
            }
        });

        if (!mergeIndexes) break;

        const [from, to] = mergeIndexes;
        clusters[from].points = clusters[from].points.concat(clusters[to].points);
        clusters[to] = null;

        distances = distances.map((d) => {
            if (d.from === to || d.to === to) {
                return { ...d, distance: Infinity };
            }
            if (d.from === from || d.to === from) {
                const otherIndex = d.from === from ? d.to : d.from;
                if (clusters[otherIndex] === null) return d;

                return {
                    ...d,
                    distance: calculateAverageDistance(
                        clusters[from].points,
                        clusters[otherIndex].points
                    ),
                };
            }
            return d;
        });
    }

    let clusterAssignments = new Array(points.length);
    let clusterNumber = 0;

    clusters.forEach((cluster) => {
        if (cluster === null) return;

        cluster.points.forEach((point) => {
            const pointIndex = points.findIndex((p) => p.x === point.x && p.y === point.y);
            clusterAssignments[pointIndex] = clusterNumber;
        });
        clusterNumber++;
    });

    return clusterAssignments;
}

function calculateDistance(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function calculateAverageDistance(points1, points2) {
    let totalDistance = 0;
    let count = 0;

    points1.forEach((p1) => {
        points2.forEach((p2) => {
            totalDistance += calculateDistance(p1, p2);
            count++;
        });
    });

    return totalDistance / count;
}

function showKMeansClusters() {
    if (clusterCntInputField.value === '') {
        return;
    }

    if (screenState.firstAlg === false) {
        kMeanStartBtn.classList.remove('kmeans-start-btn-deactivate');
        kMeanStartBtn.classList.add('kmeans-start-btn-activate');
        screenState.firstAlg = true;
        applyKMeansColoring();
    } else {
        screenState.firstAlg = false;
        kMeanStartBtn.classList.remove('kmeans-start-btn-activate');
        kMeanStartBtn.classList.add('kmeans-start-btn-deactivate');
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
    if (clusterCntInputField.value === '') {
        return;
    }

    if (screenState.secondAlg === false) {
        hierarchicalStartBtn.classList.remove('hierarchical-start-btn-deactivate');
        hierarchicalStartBtn.classList.add('hierarchical-start-btn-activate');
        screenState.secondAlg = true;
        applyHierarchicalColoring();
    } else {
        hierarchicalStartBtn.classList.add('hierarchical-start-btn-deactivate');
        hierarchicalStartBtn.classList.remove('hierarchical-start-btn-activate');
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
    if (clusterCntInputField.value === '') {
        return;
    }

    if (screenState.thirdAlg === false) {
        miniBatchKMeansStartBtn.classList.remove('miniBatchKMeans-start-btn-deactivate');
        miniBatchKMeansStartBtn.classList.add('miniBatchKMeans-start-btn-activate');
        screenState.thirdAlg = true;
        applyMiniBatchKMeansColoring();
    } else {
        miniBatchKMeansStartBtn.classList.add('miniBatchKMeans-start-btn-deactivate');
        miniBatchKMeansStartBtn.classList.remove('miniBatchKMeans-start-btn-activate');
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
            `algorithm-clusterize-cell-${cell.y}-${cell.x}`
        );
        for (let i = 0; i < 3; i++) {
            cellElement.children[i].style.backgroundColor = 'transparent';
            if (i === 1) {
                for (let j = 0; j < 2; j++) {
                    cellElement.children[1].children[j].style.backgroundColor = 'transparent';
                }
            }
        }
        cellElement.style.backgroundColor = '#b5b094';
    });
}

function makeAllTransparent() {
    pointsArray.forEach((cell) => {
        const cellElement = document.getElementById(
            `algorithm-clusterize-cell-${cell.y}-${cell.x}`
        );
        cellElement.style.backgroundColor = 'transparent';
        cellElement.children[0].style.backgroundColor = 'transparent';
        cellElement.children[1].style.backgroundColor = 'transparent';
        cellElement.children[2].style.backgroundColor = 'transparent';
        cellElement.children[1].children[0].style.backgroundColor = 'transparent';
        cellElement.children[1].children[1].style.backgroundColor = 'transparent';
    });
}

function applyKMeansColoring() {
    console.log(screenState);
    pointsArray = Array.from(chosenCells);
    clusterCnt = parseInt(clusterCntInputField.value, 10);
    kMeansClusters = kMeansClustering(pointsArray, clusterCnt);
    pointsArray.forEach((cell, index) => {
        const group = kMeansClusters[index];
        const cellElement = document.getElementById(
            `algorithm-clusterize-cell-${cell.y}-${cell.x}`
        );
        if (screenState.secondAlg === true && screenState.thirdAlg === true) {
            cellElement.children[0].style.backgroundColor = algorithmColors[0][group];
            applyHierarchicalColoring();
        } else if (
            (screenState.secondAlg === false && screenState.thirdAlg === true) ||
            (screenState.secondAlg === true && screenState.thirdAlg === false)
        ) {
            cellElement.children[0].style.backgroundColor = algorithmColors[0][group];
            cellElement.children[1].children[0].style.backgroundColor = algorithmColors[0][group];
        } else if (screenState.secondAlg === false && screenState.thirdAlg === false) {
            cellElement.style.backgroundColor = algorithmColors[0][group];
        }
    });
}

function applyMiniBatchKMeansColoring() {
    console.log(screenState);
    pointsArray = Array.from(chosenCells);
    clusterCnt = parseInt(clusterCntInputField.value, 10);
    miniBatchKMeansClusters = miniBatchKMeansClustering(pointsArray, clusterCnt);
    pointsArray.forEach((cell, index) => {
        const group = miniBatchKMeansClusters[index];
        const cellElement = document.getElementById(
            `algorithm-clusterize-cell-${cell.y}-${cell.x}`
        );
        if (screenState.secondAlg === true && screenState.firstAlg === true) {
            cellElement.children[2].style.backgroundColor = algorithmColors[2][group];
            applyHierarchicalColoring();
        } else if (
            (screenState.secondAlg === false && screenState.firstAlg === true) ||
            (screenState.secondAlg === true && screenState.firstAlg === false)
        ) {
            cellElement.children[2].style.backgroundColor = algorithmColors[2][group];
            cellElement.children[1].children[1].style.backgroundColor = algorithmColors[2][group];
        } else if (screenState.secondAlg === false && screenState.firstAlg === false) {
            cellElement.style.backgroundColor = algorithmColors[2][group];
        }
    });
}

function applyHierarchicalColoring() {
    pointsArray = Array.from(chosenCells);
    clusterCnt = parseInt(clusterCntInputField.value, 10);
    hierarchicalClusters = hierarchicalClustering(pointsArray, clusterCnt);
    pointsArray.forEach((cell, index) => {
        const group = hierarchicalClusters[index];
        const cellElement = document.getElementById(
            `algorithm-clusterize-cell-${cell.y}-${cell.x}`
        );
        if (screenState.firstAlg === true && screenState.thirdAlg === true) {
            cellElement.children[1].children[0].style.backgroundColor = algorithmColors[1][group];
            cellElement.children[1].children[1].style.backgroundColor = algorithmColors[1][group];
        } else if (screenState.firstAlg === true && screenState.thirdAlg === false) {
            cellElement.children[2].style.backgroundColor = algorithmColors[1][group];
            cellElement.children[1].children[1].style.backgroundColor = algorithmColors[1][group];
        } else if (screenState.firstAlg === false && screenState.thirdAlg === true) {
            cellElement.children[0].style.backgroundColor = algorithmColors[1][group];
            cellElement.children[1].children[0].style.backgroundColor = algorithmColors[1][group];
        } else if (screenState.firstAlg === false && screenState.thirdAlg === false) {
            cellElement.style.backgroundColor = algorithmColors[1][group];
        }
    });
}

function initGrid() {
    let grid = document.getElementById('algorithm-clusterize-grid');
    grid.innerHTML = '';
    cells = Array(WIDTH)
        .fill()
        .map(() => Array(HEIGHT));

    for (let i = 0; i < WIDTH; i++) {
        const row = document.createElement('div');
        row.className = 'algorithm-clusterize-row';
        for (let j = 0; j < HEIGHT; j++) {
            const cell = document.createElement('div');
            cell.className = 'algorithm-clusterize-cell';
            cell.id = `algorithm-clusterize-cell-${i}-${j}`;
            cells[i][j] = new Location(i, j);
            cell.addEventListener('click', function () {
                if (chosenCells.has(cells[i][j])) {
                    document.getElementById(
                        `algorithm-clusterize-cell-${i}-${j}`
                    ).style.backgroundColor = 'transparent';
                    chosenCells.delete(cells[i][j]);
                } else {
                    document.getElementById(
                        `algorithm-clusterize-cell-${i}-${j}`
                    ).style.backgroundColor = '#b5b094';
                    chosenCells.add(cells[i][j]);
                }
                if (clusterCntInputField.value !== '') {
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
                subCell.className = 'algorithm-clusterize-sub-cell';
                if (i === 1) {
                    for (let j = 0; j < 2; j++) {
                        let subSubCell = document.createElement('div');
                        subSubCell.className = 'algorithm-clusterize-sub-sub-cell';
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
    kMeanStartBtn.classList.add('kmeans-start-btn-deactivate');
    kMeanStartBtn.classList.remove('kmeans-start-btn-activate');

    screenState.secondAlg = false;
    hierarchicalStartBtn.classList.add('hierarchical-start-btn-deactivate');
    hierarchicalStartBtn.classList.remove('hierarchical-start-btn-activate');

    screenState.thirdAlg = false;
    miniBatchKMeansStartBtn.classList.add('miniBatchKMeans-start-btn-deactivate');
    miniBatchKMeansStartBtn.classList.remove('miniBatchKMeans-start-btn-activate');
}

kMeanStartBtn.addEventListener('click', showKMeansClusters);
hierarchicalStartBtn.addEventListener('click', showHierarchicalClusters);
miniBatchKMeansStartBtn.addEventListener('click', showMiniBatchKMeansClusters);

clusterInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^1-9]/g, '');

    if (this.value.length > 1) {
        this.value = this.value.slice(0, 1);
    }

    const num = parseInt(this.value);
    if (num > 9) {
        this.value = '9';
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

clusterInput.addEventListener('keypress', function (e) {
    if (e.key === '.' || e.key === ',') {
        e.preventDefault();
    }
});

initGrid();

document.getElementById('clear-Btn').addEventListener('click', clearGrid);
