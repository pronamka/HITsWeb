import {Ant} from "./Ant.js"
import {matrix} from "./Config.js"

const EVAPORATION_FOOD = 0.00001
const EVAPORATION_HOME = 0.00001

export const state = {
    stopSimulation: false
}

export class Optimization {
    constructor(startLoc, ants) {
        this.ants = ants
        this.start = startLoc
        this.ants_ = []
        this.startY = 50
        this.startX = 50
    }

    CreateAnts() {
        for (let i = 0; i < this.ants; i++) {
            this.ants_.push(new Ant(matrix[this.startY][this.startX]))
        }
    }

    async MainAlg(updateCallback) {
        this.CreateAnts()
        let visitedGlobal = []

        while (true) {
            if (state.stopSimulation) {
                state.stopSimulation = false
                visitedGlobal = null
                this.ants_ = null
                return
            }

            for (let ant of this.ants_) {
                ant.makeChoice()
            }

            for (let ant of this.ants_) {
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