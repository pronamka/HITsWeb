const WIDTH = 50
const HEIGHT = 50

let cells = []
let chosenCells =  new Set()

class Location{
    constructor(y, x) {
        this.y = y
        this.x = x
    }
}

function initGrid(){
    let grid = document.getElementById("grid")
    grid.innerHTML = '';
    for(let i = 0; i < WIDTH; i++){
        const row = document.createElement("div")
        row.className = "row"
        for(let j = 0; j < HEIGHT; j++){
            const cell = document.createElement("div")
            cell.className = "cell"
            cell.id = `cell-${i}-${j}`
            cells.push([])
            cells[i].push(new Location(i, j))
            cell.addEventListener("click", function (){
                console.log(i, j)
                if(chosenCells.has(cells[i][j])){
                    document.getElementById(`cell-${i}-${j}`).classList.remove("chosen-cell")
                    chosenCells.delete(cells[i][j])
                }
                else{
                    document.getElementById(`cell-${i}-${j}`).classList.add("chosen-cell")
                    chosenCells.add(cells[i][j])
                }
            })
            row.appendChild(cell)

        }
        grid.appendChild(row);
    }
}

initGrid()