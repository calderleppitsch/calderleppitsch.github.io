const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Adjustable variables
const rows = 50;
const cols = 50;
let cellSize = canvas.width / cols; // Cell size can change with zoom
let frameRate = 5; // Frames per second
let zoomLevel = 1; // Zoom level
let offsetX = 0; // Horizontal pan offset
let offsetY = 0; // Vertical pan offset

let grid = createGrid(rows, cols);

function createGrid(rows, cols) {
    const grid = [];
    for (let i = 0; i < rows; i++) {
        grid[i] = [];
        for (let j = 0; j < cols; j++) {
            grid[i][j] = Math.random() > 0.8 ? 1 : 0; // Randomly populate cells
        }
    }
    return grid;
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = (j * cellSize - offsetX) * zoomLevel;
            const y = (i * cellSize - offsetY) * zoomLevel;
            const size = cellSize * zoomLevel;

            ctx.fillStyle = grid[i][j] ? 'white' : 'black';
            ctx.fillRect(x, y, size, size);
        }
    }
}

function updateGrid() {
    const newGrid = createGrid(rows, cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const neighbors = countNeighbors(grid, i, j);
            if (grid[i][j] === 1 && (neighbors === 2 || neighbors === 3)) {
                newGrid[i][j] = 1;
            } else if (grid[i][j] === 0 && neighbors === 3) {
                newGrid[i][j] = 1;
            } else {
                newGrid[i][j] = 0;
            }
        }
    }
    grid = newGrid;
}

function countNeighbors(grid, x, y) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const row = (x + i + rows) % rows;
            const col = (y + j + cols) % cols;
            count += grid[row][col];
        }
    }
    return count;
}

function gameLoop() {
    drawGrid();
    updateGrid();
    setTimeout(() => requestAnimationFrame(gameLoop), 1000 / frameRate);
}

// Event listeners for zoom and pan
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomFactor = 1.1;
    if (event.deltaY < 0) {
        zoomLevel *= zoomFactor; // Zoom in
    } else {
        zoomLevel /= zoomFactor; // Zoom out
    }
});

let isPanning = false;
let startX, startY;

canvas.addEventListener('mousedown', (event) => {
    isPanning = true;
    startX = event.clientX;
    startY = event.clientY;
});

canvas.addEventListener('mousemove', (event) => {
    if (isPanning) {
        offsetX += (startX - event.clientX) / zoomLevel;
        offsetY += (startY - event.clientY) / zoomLevel;
        startX = event.clientX;
        startY = event.clientY;
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
});

gameLoop();