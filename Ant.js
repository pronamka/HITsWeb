import {Location} from "./Location.js"
import {WIDTH, HEIGHT} from "./Config.js"
import {matrix} from "./Config.js";

const TO_FOOD_REFUSE_COEF = 0.99

export class Ant {
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
        for (let i = 1; i < 20; i++) {
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
                    return 0.00001
                }
            }
        }
        return wish
    }

    getWishForToHome(nextLoc, cond) {
        const vec = [nextLoc.Y - this.curLoc.Y, nextLoc.X - this.curLoc.X]
        let wish = 0
        for (let i = 0; i < 20; i++) {
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


        if (this.foodFind === 0) {
            for (let f of neighborFields) {
                if (f.food > 0) {
                    this.foodFind = 1
                    this.improveValue = (1000000 / (Math.pow(this.dst, 3) || 1)) * f.food
                    break
                }
            }

            for (let f of neighborFields) {
                const singleWish = ((this.getWishForToFood(f) + 1) * 2) / (this.getWishForToHome(f, true) + 1)
                wish.push(singleWish)
                sumWish += singleWish
            }
            this.dst++
            this.curLoc.toHomePheromones += 1000000000 / Math.pow(this.dst, 3)

        } else {
            for (let f of neighborFields) {
                if (f.X === this.start.X && f.Y === this.start.Y) {
                    this.foodFind = 0
                    this.dst = 0
                    return
                }
            }
            for (let f of neighborFields) {
                const singleWish = this.getWishForToHome(f, false) + 1
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