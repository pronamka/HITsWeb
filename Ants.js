import {Location} from "./Location.js"
import {Optimization, state} from "./Optimization.js"
import {WIDTH, HEIGHT, matrix} from "./Config.js";

const BASE_WALL_FILLING = 0.0

let optimization
let isRunning = false
let ants = 0
let maxP = 160
let paintState = 2
let draw = false
let startButton = document.getElementById("startBtn")
let antsInputField = document.getElementById("ants")
let speed = 83.3
let startX = 50
let startY = 50

document.getElementById("wallBtn").addEventListener("click", () => {
    paintState = 1
})

document.getElementById("removeBtn").addEventListener("click", () => {
    paintState = 0
})

document.getElementById("foodBtn").addEventListener("click", () => {
    paintState = 2
})

document.getElementById("nestBtn").addEventListener("click", () => {
    paintState = 3
})

function drawTrue() {
    draw = true
}

function drawFalse() {
    draw = false
}


function initDesk(wallFilling = BASE_WALL_FILLING) {
    for (let i = 0; i < HEIGHT; i++) {
        let row = []
        for (let j = 0; j < WIDTH; j++) {
            let loc = new Location(j, i, 1)
            row.push(loc)
        }
        matrix.push(row)
    }
    const grid = document.getElementById('grid')
    grid.innerHTML = ''
    document.body.addEventListener("mousedown", drawTrue)
    document.body.addEventListener("mouseup", drawFalse)
    for (let i = 0; i < HEIGHT; i++) {
        const row = document.createElement('div')
        row.className = 'row'
        for (let j = 0; j < WIDTH; j++) {
            const cell = document.createElement('div')
            cell.className = 'cell'
            cell.id = `cell-${i}-${j}`
            cell.addEventListener("mouseenter", () => {
                if (draw) {
                    if (paintState === 1) {
                        matrix[i][j].wall = true
                        matrix[i][j].food = 0
                        cell.style.backgroundColor = ""
                        cell.classList.add('wall')
                        cell.classList.remove('food')
                    } else if (paintState === 0) {
                        matrix[i][j].wall = false
                        matrix[i][j].food = 0
                        cell.style.backgroundColor = ""
                        cell.classList.remove('wall')
                        cell.classList.remove('food')
                    } else if (paintState === 2) {
                        matrix[i][j].food = 5
                        matrix[i][j].wall = false
                        cell.classList.add('food')
                        cell.classList.remove('wall')
                    }
                }
            })
            cell.addEventListener("click", () => {
                if (isRunning === false) {
                    if (paintState === 3) {
                        document.getElementById(`cell-${startY}-${startX}`).classList.remove("start")
                        startX = j
                        startY = i
                        cell.classList.add("start")
                    }
                }
            })
            row.appendChild(cell)
        }
        grid.appendChild(row)
    }
    generateMaze(wallFilling)
}

function generateMaze(wallFilling) {
    function getNeighbors(y, x) {
        const up = [y - 2, x]
        const down = [y + 2, x]
        const right = [y, x + 2]
        const left = [y, x - 2]
        const ways = [up, down, right, left]
        const correctWays = []
        for (let way of ways) {
            if (way[0] < HEIGHT - 1 && way[0] > 0 && way[1] < WIDTH - 1 && way[1] > 0) {
                if (!matrix[way[0]][way[1]].mazeVisited) {
                    correctWays.push(way)
                }
            }
        }
        return correctWays
    }

    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            if (i % 2 === 0 || j % 2 === 0) {
                const rand = Math.random()
                if (rand > (1 - wallFilling)) {
                    document.getElementById(`cell-${i}-${j}`).classList.add("wall")
                    matrix[i][j].wall = true
                }
            }
        }
    }

    let curCell = [1, 1]
    let neighbourCell
    let vis = []
    let visCount = 5000

    do {
        let neighbours = getNeighbors(curCell[0], curCell[1])
        if (neighbours.length !== 0) {
            vis.push(curCell)
            let randNum = Math.floor(Math.random() * neighbours.length)
            neighbourCell = neighbours[randNum]

            matrix[(neighbourCell[0] + curCell[0]) / 2][(neighbourCell[1] + curCell[1]) / 2].wall = false
            document
                .getElementById(`cell-${(neighbourCell[0] + curCell[0]) / 2}-${(neighbourCell[1] + curCell[1]) / 2}`)
                .classList.remove('wall')

            matrix[neighbourCell[0]][neighbourCell[1]].mazeVisited = true

            curCell = neighbourCell
            visCount--
        } else {
            if (vis.length > 0) {
                curCell = vis.pop()
            }
            visCount--
        }
    } while (visCount > 0)
}

function updateCells(changedCells = null) {
    if (!changedCells) {
        changedCells = []
        for (let i = 0; i < HEIGHT; i++) {
            for (let j = 0; j < WIDTH; j++) {
                changedCells.push({y: i, x: j})
            }
        }
    }

    for (const loc of changedCells.slice(-ants * 2)) {
        const cell = document.getElementById(`cell-${loc.Y}-${loc.X}`)
        if (!cell) continue

        cell.className = 'cell'
        cell.style.backgroundColor = ''

        const antsHere = loc.antsHere

        if (loc.food > 0) {
            cell.classList.add("food")
        }
        else if (loc.Y === startY && loc.X === startX) {
            cell.classList.add("start")
        } else if (antsHere === 1) {
            cell.classList.add('ant')
        } else if (antsHere === 2) {
            cell.classList.add('ants5-10')
        } else if (antsHere > 2) {
            cell.classList.add('ants11-20')
        }
    }
}

async function startSimulation() {
    ants = antsInputField.value
    if (ants <= 0 || isRunning) {
        return
    }
    isRunning = true
    state.stopSimulation = false
    startButton.classList.remove("btnStartState1")
    startButton.classList.add("btnStartState2")

    optimization = new Optimization(
        new Location(50, 50),
        ants,
        startY,
        startX
    )

    const updateCallback = async (antPositions) => {
        updateCells(antPositions)
        await new Promise(resolve => setTimeout(resolve, 100 - speed))
    }

    await optimization.MainAlg(updateCallback)
    isRunning = false
}

function clr() {
    startButton.classList.remove("btnStartState2")
    startButton.classList.add("btnStartState1")
    state.stopSimulation = true
    isRunning = false
    matrix.length = 0
    maxP = 140
    initDesk()
}

function removeAll() {
    startButton.classList.remove("btnStartState2")
    startButton.classList.add("btnStartState1")
    state.stopSimulation = true
    isRunning = false
    matrix.length = 0
    maxP = 140
    initDesk(0)
}

window.startSimulation = startSimulation;
window.clr = clr;
window.removeAll = removeAll;

initDesk()