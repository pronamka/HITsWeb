import {Location} from "./location.js";
import {Config} from "./config.js";

export class Ant {
    constructor(start = new Location(0, 0)) {
        this.start = start;
        this.curLoc = start;
        this.visitedLocations = [];
        this.dst = 0;
        this.foodFind = 0;
        this.improveValue = 0;
    }

    #getNeighborLocs(matrix) {
        const locs = [];
        const dst = [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
        ];
        const curY = this.curLoc.Y;
        const curX = this.curLoc.X;

        for (let d of dst) {
            const newY = curY + d[0];
            const newX = curX + d[1];

            if (newY >= 0 && newY < Config.HEIGHT && newX >= 0 && newX < Config.WIDTH) {
                const neighbor = matrix[newY][newX];
                if (!neighbor.wall) {
                    locs.push(neighbor);
                }
            }
        }
        return locs;
    }

    #getWishForToFood(nextLoc, matrix) {
        const vec = [nextLoc.Y - this.curLoc.Y, nextLoc.X - this.curLoc.X];
        let wish = 0;
        let endsCnt = 0;
        let wallCnt = 0;
        const curY = this.curLoc.Y;
        const curX = this.curLoc.X;

        for (let i = 1; i < Config.RANGE; i++) {
            const halfWidth = Math.floor(i / 3);

            for (let offset = -halfWidth; offset <= halfWidth; offset++) {
                const checkYOffset = curY + vec[0] * i + vec[1] * offset;
                const checkXOffset = curX + vec[1] * i - vec[0] * offset;

                if (
                    checkYOffset >= 0 &&
                    checkYOffset < Config.HEIGHT &&
                    checkXOffset >= 0 &&
                    checkXOffset < Config.WIDTH
                ) {
                    const cell = matrix[checkYOffset][checkXOffset];
                    if (!cell.wall) {
                        if (cell.food > 0 && i <= 10) {
                            wish += 1000000;
                        } else {
                            wish += cell.toFoodPheromones;
                        }
                        wallCnt = 0;
                    } else {
                        if (wallCnt < 2) {
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

    #getWishForToHome(nextLoc, matrix) {
        const vec = [nextLoc.Y - this.curLoc.Y, nextLoc.X - this.curLoc.X];
        let wish = 0;
        let wallCnt = 0;
        const curY = this.curLoc.Y;
        const curX = this.curLoc.X;

        for (let i = 0; i < Config.RANGE; i++) {
            const halfWidth = Math.floor(i / 3);

            for (let offset = -halfWidth; offset <= halfWidth; offset++) {
                const checkYOffset = curY + vec[0] * i + vec[1] * offset;
                const checkXOffset = curX + vec[1] * i - vec[0] * offset;

                if (
                    checkYOffset >= 0 &&
                    checkYOffset < Config.HEIGHT &&
                    checkXOffset >= 0 &&
                    checkXOffset < Config.WIDTH
                ) {
                    const cell = matrix[checkYOffset][checkXOffset];
                    if (!cell.wall) {
                        const isHome =
                            checkYOffset === this.start.Y && checkXOffset === this.start.X;
                        if (isHome && i <= 10) {
                            wish += 1000000;
                        } else {
                            wish += cell.toHomePheromones;
                        }
                        wallCnt = 0;
                    } else {
                        if (wallCnt < 2) {
                            wallCnt++;
                        } else {
                            return wish;
                        }
                    }
                }
            }
        }
        return wish;
    }

    #isRecentlyVisited(loc) {
        return this.visitedLocations.some(visited =>
            visited && visited.X === loc.X && visited.Y === loc.Y
        );
    }

    #updateVisitedLocations() {
        this.visitedLocations.unshift(this.curLoc);

        if (this.visitedLocations.length > 2) {
            this.visitedLocations.pop();
        }
    }


    makeChoice(matrix) {
        const neighborFields = this.#getNeighborLocs(matrix);

        let wish = [];
        let sumWish = 0;
        let choosingProbability = [];
        let probability = [];

        if (this.dst > Config.MAX_DISTANCE) {
            if (Math.random() < Config.CHANCE_TO_GO_HOME) {
                this.foodFind = 1;
                this.improveValue = 0;
            }
        }

        if (this.foodFind === 0) {
            for (let f of neighborFields) {
                if (f.food > 0) {
                    this.foodFind = 1;
                    this.improveValue = (Config.EQUALIZATION_COEFFICIENT / Math.pow(this.dst, Config.INCREASE_COEFFICIENT));
                    break;
                }
            }
            for (let i = 0; i < neighborFields.length; i++) {
                const f = neighborFields[i];

                if (this.#isRecentlyVisited(f)) {
                    wish.push(0);
                    continue;
                }
                const [curFoodWish, antiWish] = this.#getWishForToFood(f, matrix)
                const wishToFood = curFoodWish + 1
                const wishToHome = this.#getWishForToHome(f, matrix) + 1
                const singleWish = Math.pow(wishToFood, Config.HERD_COEFFICIENT) / wishToHome / (antiWish + 1)
                wish.push(singleWish)
                sumWish += singleWish

            }
            this.dst++;
            this.curLoc.toHomePheromones += Config.EQUALIZATION_COEFFICIENT / Math.pow(this.dst, Config.INCREASE_COEFFICIENT) + Config.MIN_IMPROVE_VALUE;
        } else {
            for (let f of neighborFields) {
                if (f.X === this.start.X && f.Y === this.start.Y) {
                    this.foodFind = 0;
                    this.dst = 0;
                    return;
                }
            }
            for (let f of neighborFields) {
                const [curFoodWish, antiWish] = this.#getWishForToFood(f, matrix)
                const wishToFood = curFoodWish + 1
                const wishToHome = this.#getWishForToHome(f, matrix) + 1
                const singleWish = Math.pow(wishToHome, Config.HERD_COEFFICIENT) / Math.pow(wishToFood, 0.5) / (antiWish+ 1);

                wish.push(singleWish);
                sumWish += singleWish;
            }
            this.curLoc.toFoodPheromones += this.improveValue + Config.MIN_IMPROVE_VALUE;
            this.improveValue *= Config.TO_FOOD_REFUSE_COEFFICIENT;
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
        this.#updateVisitedLocations();

        this.curLoc.antsHere--;
        this.curLoc = nextStep;
        this.curLoc.antsHere++;
    }
}