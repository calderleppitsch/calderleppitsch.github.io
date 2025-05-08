const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
//try disabling antialiasing
ctx.imageSmoothingEnabled = false;

// Adjustable variables
const rows = 100; // Number of rows in the grid
const cols = 100; // Number of columns in the grid
let site_refresh_rate = 60; // Frames per second for website refresh
let sim_refresh_rate = 10; // Frames per second for simulation refresh
let zoomLevel = 1; // Initial zoom level
let offsetX = 0; // Initial horizontal pan offset
let offsetY = 0; // Initial vertical pan offset

// Initialize the grid
let grid = createGrid(rows, cols);

function createGrid(rows, cols) {
    // Create a grid with random 0s and 1s (dead and alive cells)
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (Math.random() > 0.8 ? 1 : 0))
    );
}

let cellSize = canvas.clientWidth / cols; // Calculate initial cell size based on canvas width
// Make sure the pixels are square
function adjustCanvasResolution() {
    const dpr = window.devicePixelRatio || 1; // Get the device pixel ratio
    canvas.width = canvas.clientWidth * dpr; // Scale canvas width
    canvas.height = canvas.clientHeight * dpr; // Scale canvas height
    ctx.scale(dpr, dpr); // Scale the drawing context to match the DPR
    cellSize = canvas.clientWidth / cols; // Recalculate cell size to ensure square cells
}
// Call this function during initialization
adjustCanvasResolution();

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startRow = Math.floor(offsetY / cellSize);
    const endRow = Math.ceil((offsetY + canvas.height / zoomLevel) / cellSize);
    const startCol = Math.floor(offsetX / cellSize);
    const endCol = Math.ceil((offsetX + canvas.width / zoomLevel) / cellSize);

    for (let i = Math.max(0, startRow); i < Math.min(rows, endRow); i++) {
        for (let j = Math.max(0, startCol); j < Math.min(cols, endCol); j++) {
            const x = (j * cellSize - offsetX) * zoomLevel;
            const y = (i * cellSize - offsetY) * zoomLevel;
            const size = cellSize * zoomLevel + 0.5;

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

let iterationCount = 0; // Counter to track iterations
let frame_rate_ratio = Math.floor(site_refresh_rate / sim_refresh_rate); // Ratio of site refresh rate to simulation refresh rate

function gameLoop() {
    drawGrid(); // Always redraw the grid for responsiveness

    // Update the grid only once every 10 iterations
    if (iterationCount % frame_rate_ratio === 0) {
        updateGrid();
    }

    iterationCount++; // Increment the iteration counter

    setTimeout(() => requestAnimationFrame(gameLoop), 1000 / site_refresh_rate);
}

// Event listeners
// Window resize
window.addEventListener('resize', adjustCanvasResolution);

// Mouse wheel zoom
const zoomFactor = 1.01; // Increase zoom factor for faster zooming
canvas.addEventListener('wheel', (event) => {
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / zoomLevel + offsetX;
    const mouseY = (event.clientY - rect.top) / zoomLevel + offsetY;

    if (event.deltaY < 0) {
        // Zoom in
        zoomLevel *= zoomFactor;
    } else {
        // Zoom out
        zoomLevel /= zoomFactor;
    }

    // Adjust offsets to keep the zoom centered on the mouse position
    offsetX = mouseX - (event.clientX - rect.left) / zoomLevel;
    offsetY = mouseY - (event.clientY - rect.top) / zoomLevel;
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
        // Calculate the difference in mouse position
        const deltaX = startX - event.clientX;
        const deltaY = startY - event.clientY;

        // Update offsets directly based on mouse movement
        offsetX += deltaX / zoomLevel;
        offsetY += deltaY / zoomLevel;

        // Update the starting position for the next movement
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

//TOUCH LOGIC: for mobile devices
let lastTouchDistance = null; // To track pinch-to-zoom distance
let lastTouchX = 0, lastTouchY = 0; // To track panning

canvas.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
        // Single touch for panning
        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        // Two fingers for pinch-to-zoom
        lastTouchDistance = getTouchDistance(event.touches);
    }
});

canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();

    if (event.touches.length === 2) {
        const currentTouchDistance = getTouchDistance(event.touches);
        const rect = canvas.getBoundingClientRect();

        const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

        const gridMidX = (midX - rect.left) / zoomLevel + offsetX;
        const gridMidY = (midY - rect.top) / zoomLevel + offsetY;

        if (lastTouchDistance) {
            if (currentTouchDistance > lastTouchDistance) {
                zoomLevel *= zoomFactor; // Zoom in
            } else {
                zoomLevel /= zoomFactor; // Zoom out
            }

            // Adjust offsets to keep the zoom centered on the midpoint
            offsetX = gridMidX - (midX - rect.left) / zoomLevel;
            offsetY = gridMidY - (midY - rect.top) / zoomLevel;
        }

        lastTouchDistance = currentTouchDistance;
    }
});

canvas.addEventListener('touchend', (event) => {
    if (event.touches.length < 2) {
        lastTouchDistance = null; // Reset pinch-to-zoom tracking
    }
});

// Helper function to calculate the distance between two touch points
function getTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

gameLoop();