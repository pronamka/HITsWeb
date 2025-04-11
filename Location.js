export class Location {
    constructor(x, y, food = 0) {
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