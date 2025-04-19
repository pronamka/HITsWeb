const WIDTH = 101
const HEIGHT = 101
const EVAPORATION_FOOD = 0.00001
const EVAPORATION_HOME = 0.00001
const BASE_WALL_FILLING = 0.0
const TO_FOOD_REFUSE_COEF = 0.99
const MAX_DISTANCE = 500
const CHANCE_TO_GO_HOME = 0.005
const RANGE = 15

let ants_ = []
let matrix = []
let optimization
let isRunning = false
let ants = 0
let maxP = 160
let paintState = 2
let draw = false
let stopSimulation = false
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

class Location {
    constructor(x, y, pheromones = 0, food = 0) {
        this.X = x
        this.Y = y
        this.wall = false
        this.food = food
        this.IsChanged = false
        this.antsHere = 0
        this.mazeVisited = false
        this.toHomePheromones = 0
        this.toFoodPheromones = 0
    }
}

class Ant {
    constructor(start = new Location(0, 0)) {
        this.start = start
        this.curLoc = start
        this.dst = 0
        this.foodFind = 0
        this.improveValue = 0
    }

    getNeighborLocs() {
        const locs = []
        const dst = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]
        for (let d of dst) {
            const newY = this.curLoc.Y + d[0]
            const newX = this.curLoc.X + d[1]

            if (newY >= 0 && newY < HEIGHT && newX >= 0 && newX < WIDTH) {
                if (!matrix[newY][newX].wall) {
                    locs.push(matrix[newY][newX])
                }
            }
        }
        return locs
    }

    getWishForToFood(nextLoc) {
        const vec = [nextLoc.Y - this.curLoc.Y, nextLoc.X - this.curLoc.X]
        let wish = 0
        let endsCnt = 0
        for (let i = 1; i < RANGE; i++) {
            const checkY = this.curLoc.Y + vec[0] * i
            const checkX = this.curLoc.X + vec[1] * i
            const checkYLeft = this.curLoc.Y + vec[0] * i + vec[1]
            const checkXLeft = this.curLoc.X + vec[1] * i - vec[0]
            const checkYRight = this.curLoc.Y + vec[0] * i - vec[1]
            const checkXRight = this.curLoc.X + vec[1] * i + vec[0]

            if (checkY >= 0 && checkY < HEIGHT && checkX >= 0 && checkX < WIDTH) {
                if (!matrix[checkY][checkX].wall) {
                    const leftInBounds = checkYLeft >= 0 && checkYLeft < HEIGHT && checkXLeft >= 0 && checkXLeft < WIDTH
                    const rightInBounds = checkYRight >= 0 && checkYRight < HEIGHT && checkXRight >= 0 && checkXRight < WIDTH

                    const leftFood = leftInBounds ? matrix[checkYLeft][checkXLeft].food > 0 : false;
                    const rightFood = rightInBounds ? matrix[checkYRight][checkXRight].food > 0 : false;

                    if (matrix[checkY][checkX].food > 0 || leftFood || rightFood) {
                        wish += 1000000
                    } else {
                        if (leftInBounds && !matrix[checkYLeft][checkXLeft].wall) {
                            wish += matrix[checkYLeft][checkXLeft].toFoodPheromones
                        }
                        if (rightInBounds && !matrix[checkYRight][checkXRight].wall) {
                            wish += matrix[checkYRight][checkXRight].toFoodPheromones
                        }
                        wish += matrix[checkY][checkX].toFoodPheromones
                    }
                } else {
                    break
                }
            }
            else{
                endsCnt++
            }
        }
        return [wish, endsCnt]
    }

    getWishForToHome(nextLoc) {
        const vec = [nextLoc.Y - this.curLoc.Y, nextLoc.X - this.curLoc.X]
        let wish = 0
        for (let i = 0; i < RANGE; i++) {
            const checkY = this.curLoc.Y + vec[0] * i
            const checkX = this.curLoc.X + vec[1] * i
            const checkYLeft = this.curLoc.Y + vec[0] * i + vec[1]
            const checkXLeft = this.curLoc.X + vec[1] * i - vec[0]
            const checkYRight = this.curLoc.Y + vec[0] * i - vec[1]
            const checkXRight = this.curLoc.X + vec[1] * i + vec[0]

            if (checkY >= 0 && checkY < HEIGHT && checkX >= 0 && checkX < WIDTH) {
                if (!matrix[checkY][checkX].wall) {
                    const leftInBounds = checkYLeft >= 0 && checkYLeft < HEIGHT && checkXLeft >= 0 && checkXLeft < WIDTH
                    const rightInBounds = checkYRight >= 0 && checkYRight < HEIGHT && checkXRight >= 0 && checkXRight < WIDTH

                    const isHomeAtCenter = checkY === this.start.Y && checkX === this.start.X;
                    const isHomeAtRight = rightInBounds && (checkYRight === this.start.Y && checkXRight === this.start.X);
                    const isHomeAtLeft = leftInBounds && (checkYLeft === this.start.Y && checkXLeft === this.start.X);

                    if (isHomeAtCenter || isHomeAtRight || isHomeAtLeft) {
                        wish += 1000000
                    } else {
                        if (leftInBounds && !matrix[checkYLeft][checkXLeft].wall) {
                            wish += matrix[checkYLeft][checkXLeft].toHomePheromones
                        }
                        if (rightInBounds && !matrix[checkYRight][checkXRight].wall) {
                            wish += matrix[checkYRight][checkXRight].toHomePheromones
                        }
                        wish += matrix[checkY][checkX].toHomePheromones
                    }
                }
                else {
                    break
                }
            }
            else {
                break
            }
        }
        return wish
    }

    makeChoice() {
        const neighborFields = this.getNeighborLocs()

        let wish = []
        let sumWish = 0
        let choosingProbability = []
        let probability = []

        if(this.dst > MAX_DISTANCE){
            let a = Math.random()
            if(a < CHANCE_TO_GO_HOME) {
                this.foodFind = 1
                this.improveValue = 0
            }
        }

        if (this.foodFind === 0) {
            for (let f of neighborFields) {
                if (f.food > 0) {
                    this.foodFind = 1
                    this.improveValue = (10000000 / (Math.pow(this.dst, 3) || 1)) * f.food
                    break
                }
            }

            for (let f of neighborFields) {
                const singleWish = ((this.getWishForToFood(f)[0] + 1) * 2) / (this.getWishForToHome(f) + 1) / (this.getWishForToFood(f)[1] + 1)
                wish.push(singleWish)
                sumWish += singleWish
            }
            this.dst++
            this.curLoc.toHomePheromones += 10000000 / Math.pow(this.dst, 3)

        } else {
            for (let f of neighborFields) {
                if (f.X === this.start.X && f.Y === this.start.Y) {
                    this.foodFind = 0
                    this.dst = 0
                    return
                }
            }
            for (let f of neighborFields) {
                const singleWish = Math.pow((this.getWishForToHome(f) + 1), 2)  / (this.getWishForToFood(f)[0] + 1)
                wish.push(singleWish)
                sumWish += singleWish
            }
            this.curLoc.toFoodPheromones += this.improveValue
            this.improveValue *= TO_FOOD_REFUSE_COEF
        }


        if (wish.length === 0 || sumWish === 0) {
            return
        }

        for (let neighbor = 0; neighbor < neighborFields.length; neighbor++) {
            probability.push(wish[neighbor] / sumWish)
            if (neighbor === 0) {
                choosingProbability.push(probability[neighbor])
            } else {
                choosingProbability.push(choosingProbability[neighbor - 1] + probability[neighbor])
            }
        }

        let nextStep = this.curLoc
        const choose = Math.random()
        for (let n = 0; n < neighborFields.length; n++) {
            if (choose <= choosingProbability[n]) {
                nextStep = neighborFields[n]
                break
            }
        }
        this.curLoc.antsHere--
        this.curLoc = nextStep
        this.curLoc.antsHere++
    }
}

class Optimization {
    constructor(startLoc, ants) {
        this.ants = ants
        this.start = startLoc
    }

    CreateAnts() {
        for (let i = 0; i < this.ants; i++) {
            ants_.push(new Ant(matrix[startY][startX]))
        }
    }

    async MainAlg(updateCallback) {
        this.CreateAnts()
        let visitedGlobal = []

        while (true) {
            if (stopSimulation) {
                stopSimulation = false
                visitedGlobal = null
                ants_ = null
                return
            }

            for (let ant of ants_) {
                ant.makeChoice()
            }

            for (let ant of ants_) {
                if (ant.curLoc.IsChanged === false) {
                    visitedGlobal.push(ant.curLoc)
                    ant.curLoc.lastChanged = true
                }
            }

            for (let loc of visitedGlobal) {
                loc.toFoodPheromones *= 1 - EVAPORATION_FOOD
                loc.toHomePheromones *= 1 - EVAPORATION_HOME
            }

            if (updateCallback) {
                await updateCallback(visitedGlobal)
            }
        }
    }
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
    for (let i = 0; i < HEIGHT; i++) {
        for (let j = 0; j < WIDTH; j++) {
            let cell = document.getElementById(`cell-${i}-${j}`)
            cell.addEventListener("mouseenter", () => {
                if (draw) {
                    if (paintState === 1) {
                        for (let y = -1; y < 2; y++) {
                            for (let x = -1; x < 2; x++) {
                                if (i + y >= 0 && i + y < HEIGHT && j + x >= 0 && j + x < WIDTH)
                                    matrix[i + y][j + x].wall = true
                                matrix[i + y][j + x].food = 0
                                let curCell = document.getElementById(`cell-${i + y}-${j + x}`)
                                console.log(`cell-${i + y}-${j + x}`)
                                curCell.style.backgroundColor = ""
                                curCell.classList.add('wall')
                                //  cell.classList.add('wall')
                            }
                        }
                        cell.classList.remove('food')
                    }
                }
            })
        }
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
        } /*else if (loc.toFoodPheromones > 0) {
            const intensity = Math.min(loc.toFoodPheromones / maxP / 2, 1)
            cell.style.backgroundColor = `rgba(33, 150, 243, ${intensity})`
        }*/

    }
}

async function startSimulation() {
    ants_ = []
    ants = antsInputField.value
    if (ants <= 0 || isRunning) {
        return
    }
    isRunning = true
    stopSimulation = false
    startButton.classList.remove("btnStartState1")
    startButton.classList.add("btnStartState2")

    optimization = new Optimization(
        new Location(3, 3, 0),
        ants
    )

    const updateCallback = async (antPositions) => {
        updateCells(antPositions)
        await new Promise(resolve => setTimeout(resolve, 100 - speed))
    }

    await optimization.MainAlg(updateCallback)
    isRunning = false
}

function removeAll() {
    startButton.classList.remove("btnStartState2")
    startButton.classList.add("btnStartState1")
    stopSimulation = true
    isRunning = false
    matrix = []
    maxP = 140
    initDesk(0)
}

initDesk()