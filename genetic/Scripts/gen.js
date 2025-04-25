//==============================
//          GLOBALS
//==============================

const canvas = document.getElementById('algorithm-genetics-graphCanvas');
const ctx = canvas.getContext('2d');

const radius = 200;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const nodeRadius = 20;

const nodes = [];

let numNodes;
let adjMatrix = [];

let shouldStop = false;
let graphChanged = false;

const buttonStop = document.getElementById('genetic-stop');
buttonStop.addEventListener('click', () => {
    shouldStop = true;
    buttonStop.classList.add('pressed');
    startAlgBtn.classList.remove('pressed');
});

//==============================
//       DISPLAY GRAPH
//==============================

const button = document.getElementById('algorithm-genetics-generate');
button.addEventListener('click', generateGraph);

let draggedNode = null;
let offsetX = 0;
let offsetY = 0;

function generateGraph() {
    shouldStop = true;
    startAlgBtn.classList.remove('pressed');
    buttonStop.classList.remove('pressed');

    numNodes = parseInt(document.getElementById('algorithm-genetics-size').value, 10);
    nodes.length = 0;

    for (let i = 0; i < numNodes; i++) {
        const angle = ((2 * Math.PI) / numNodes) * i;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        nodes.push({ x, y });
    }

    drawGraph();
}

function drawGraph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    adjMatrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(0));

    // draw edges with dynamic weights
    ctx.strokeStyle = '#d1d1d1';
    ctx.font = '11px Arial';
    ctx.fillStyle = '#d1d1d1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    nodes.forEach((fromNode, i) => {
        for (let j = i + 1; j < nodes.length; j++) {
            const toNode = nodes[j];

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.stroke();

            //calculate distance
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy).toFixed(0);
            adjMatrix[i][j] = distance;
            adjMatrix[j][i] = distance;

            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            ctx.fillText(distance, midX, midY);
        }
    });

    // draw nodes
    nodes.forEach((node, index) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgb(118, 187, 134)';
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(index + 1, node.x, node.y);
    });
}

function displayRoute(route) {
    if (!route || route.length === 0) return;

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#76bb86';

    ctx.beginPath();
    const start = nodes[route[0]];
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < route.length; i++) {
        const node = nodes[route[i]];
        ctx.lineTo(node.x, node.y);
    }

    ctx.lineTo(start.x, start.y);
    ctx.stroke();
    ctx.lineWidth = 1;
    nodes.forEach((node, index) => {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(index + 1, node.x, node.y);
    });
}

//==============================
//        CANVAS EVENTS
//==============================

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPosition(x, y);
    if (node) {
        draggedNode = node;
        offsetX = x - node.x;
        offsetY = y - node.y;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (draggedNode) {
        graphChanged = true;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        draggedNode.x = x - offsetX;
        draggedNode.y = y - offsetY;
        drawGraph();
    }
});

canvas.addEventListener('mouseup', () => {
    draggedNode = null;
});

canvas.addEventListener('mouseleave', () => {
    draggedNode = null;
});

function getNodeAtPosition(x, y) {
    return nodes.find((node) => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) <= nodeRadius;
    });
}

//==============================
//      GENETIC ALGORITHM
//==============================

const startAlgBtn = document.getElementById('genetic-start');
startAlgBtn.addEventListener('click', runGenerations);

const populationSize = 1000;
const mutationPercent = 5;
const generations = 5000;

function generatePopulation() {
    const population = [];

    for (let i = 0; i < populationSize; i++) {
        const individual = shuffle([...Array(numNodes).keys()]);

        const distance = routeDistance(individual, adjMatrix);
        const fitness = Math.pow(1 / distance, 4);
        population.push({ route: individual, distance, fitness });
    }
    return population;
}

function regeneratePopulation(oldPopulation, eliteFraction = 0.1) {
    const eliteCount = Math.floor(populationSize * eliteFraction);
    const sorted = [...oldPopulation].sort((a, b) => b.fitness - a.fitness);
    const elites = sorted.slice(0, eliteCount);

    const newPopulation = [];
    for (let i = 0; i < populationSize - eliteCount; i++) {
        const individual = shuffle([...Array(numNodes).keys()]);
        const distance = routeDistance(individual, adjMatrix);
        const fitness = Math.pow(1 / distance, 4);
        newPopulation.push({ route: individual, distance, fitness });
    }

    return elites.concat(newPopulation);
}

function evolve(population, matrix, offspringCount, eliteCount) {
    const size = population.length;

    const sortedPopulation = [...population].sort((a, b) => b.fitness - a.fitness);
    const elites = sortedPopulation.slice(0, eliteCount);
    const survivors = sortedPopulation.slice(0, size - offspringCount);
    const children = [];

    for (let i = 0; i < offspringCount; i++) {
        const mom = tourSelection(population).route;
        const dad = tourSelection(population).route;

        const child = orderCrossover(mom, dad);
        const mutated = mutate(child);

        const dist = routeDistance(mutated, matrix);
        const fit = Math.pow(1 / dist, 4);

        children.push({ route: mutated, distance: dist, fitness: fit });
    }

    return elites
        .concat(survivors)
        .concat(children)
        .sort((a, b) => b.fitness - a.fitness)
        .slice(0, populationSize);
}

async function runGenerations() {
    shouldStop = false;
    startAlgBtn.classList.add('pressed');
    buttonStop.classList.remove('pressed');

    let population = generatePopulation();
    let bestSoFar = null;

    let gen = 0;
    while (gen < generations) {
        if (shouldStop) return;

        if (graphChanged) {
            gen = 0;
            population = regeneratePopulation(population, 0.1);
            graphChanged = false;
        }

        population = evolve(population, adjMatrix, Math.floor(populationSize * 0.5), 30);
        const best = population.reduce((a, b) => (a.fitness > b.fitness ? a : b));
        bestSoFar = best;

        drawGraph();
        displayRoute(bestSoFar.route);
        await sleep(200);

        gen++;
    }

    startAlgBtn.classList.remove('pressed');
}

//==============================
//      HELPER FUNCTIONS
//==============================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function routeDistance(route, adjMatrix) {
    let distance = 0;
    for (let i = 0; i < route.length - 1; i++) {
        distance += adjMatrix[route[i]][route[i + 1]];
    }
    distance += adjMatrix[route[route.length - 1]][route[0]];
    return distance;
}

function orderCrossover(mama, papa) {
    const size = mama.length;
    const child = new Array(size).fill(null);

    const start = Math.floor(Math.random() * size);
    const end = Math.floor(Math.random() * size);
    const [l, r] = [Math.min(start, end), Math.max(start, end)];

    for (let i = l; i <= r; i++) {
        child[i] = mama[i];
    }

    let papaIndex = 0;
    for (let i = 0; i < size; i++) {
        const pos = (r + 1 + i) % size;
        while (child.includes(papa[papaIndex])) {
            papaIndex++;
        }
        if (child[pos] === null && papaIndex < size) {
            child[pos] = papa[papaIndex++];
        }
    }
    return child;
}

function mutate(individual) {
    const currMutationPercent = Math.floor(Math.random() * 100);
    if (currMutationPercent < mutationPercent) {
        let i = Math.floor(Math.random() * individual.length);
        let j = Math.floor(Math.random() * individual.length);
        
        if(j < i){
            [i,j] = [j,i];
        }
        let slice = individual.slice(i, j + 1).reverse();
        individual.splice(i, slice.length, ...slice);
    }
    return individual;
}

function tourSelection(population, tourSize = 5) {
    const contestants = [];
    for (let i = 0; i < tourSize; i++) {
        const randIndex = Math.floor(Math.random() * population.length);
        contestants.push(population[randIndex]);
    }
    return contestants.reduce((a, b) => (a.fitness > b.fitness ? a : b));
}