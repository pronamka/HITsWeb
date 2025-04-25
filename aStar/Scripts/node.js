export class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }

    setHeuristic(goal) {
        this.h = Math.abs(this.x - goal.x) + Math.abs(this.y - goal.y);
        this.f = this.g + this.h;
    }
}