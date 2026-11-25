// Defining the array of colors in the same order as in the palette
// (must be declared before the cells are created, otherwise COLORS is undefined)
var COLORS = [
    "rgb(62, 62, 62)",      // 0 - default color (eraser)
    "rgb(255, 102, 46)",    // 1 - red
    "rgb(26, 218, 84)",     // 2 - green
    "rgb(83, 15, 255)",     // 3 - dark blue 
    "rgb(255, 236, 26)",    // 4 - yellow
    "rgb(142, 229, 255)"    // 5 - light blue
];

// The field is a 30 x 15 grid
var CELL_COUNT = 450;

// Loading from cookie
function get_result_from_cookie() {
    let cookies = document.cookie.split('; ')

    for (let i = 0; i < cookies.length; i += 1) {
        let cookie = cookies[i].split('=')

        // The cookie is only valid when it has exactly one color index per cell
        if (cookie[0] == 'pixel-result' && cookie[1] && cookie[1].length == CELL_COUNT) {
            return cookie[1]
        }
    }

    // Default result: 450 empty cells
    return '0'.repeat(CELL_COUNT)
}

// Flags and values
var CURRENT_COLOR = "rgb(255, 102, 46)"; // Initial color (red)
var DEFAULT_COLOR = "rgb(62, 62, 62)";   // Default color (dark gray)
var IS_CLICKED = false; // Flag for tracking the mouse button state
var FILL_MODE = false; // Flag for fill mode


// Class-to-color mapping array
var COLOR_MAP = {
    "red": "rgb(255, 102, 46)",
    "green": "rgb(26, 218, 84)",
    "blue": "rgb(83, 15, 255)",
    "yellow": "rgb(255, 236, 26)",
    "skyblue": "rgb(142, 229, 255)"
};

// Tracking the mouse button state
document.addEventListener('mousedown', function() {
    IS_CLICKED = true;
});

document.addEventListener('mouseup', function() {
    IS_CLICKED = false;
});

// Filling the field with cells (restoring the saved drawing from the cookie)
let field = document.querySelector('.field')
let temp_result = get_result_from_cookie()
for (let i = 0; i < CELL_COUNT; i += 1) {
    let cell = document.createElement('div')
    cell.classList.add('cell')
    cell.setAttribute('id', `${i}`) // Adding an ID for the animation
    // Restoring the saved color of this cell (0 = empty, so no inline style needed)
    let savedIndex = parseInt(temp_result[i])
    if (savedIndex > 0) {
        cell.style.backgroundColor = COLORS[savedIndex]
    }
    field.appendChild(cell)
}

// Adding event handlers to each cell
let cells = document.querySelectorAll('.cell')
for (let i = 0; i < cells.length; i++) {
    let cell = cells[i];
    
    // Click handler (for single-cell coloring)
    cell.addEventListener('click', function() {
        cell.style.backgroundColor = CURRENT_COLOR;
    })
    
    // Mouse hover handler (for drawing while holding down the button)
    cell.addEventListener('mouseover', function() {
        if (IS_CLICKED) {
            cell.style.backgroundColor = CURRENT_COLOR;
        }
    })
    
    // Cell mouse click handler
    cell.addEventListener('mousedown', function() {
        if (FILL_MODE) {
        let cell_id = parseInt(cell.getAttribute('id'));
        
        cells.forEach((targetCell, index) => {
            let gridCols = 30;
            let targetRow = Math.floor(index / gridCols);
            let targetCol = index % gridCols;
            let startRow = Math.floor(cell_id / gridCols);
            let startCol = cell_id % gridCols;
            
            let rowDist = Math.abs(targetRow - startRow);
            let colDist = Math.abs(targetCol - startCol);
            let distance = rowDist + colDist;

            let delay = distance * 30;
            
            targetCell.animate([
                { backgroundColor: CURRENT_COLOR }
            ], {
                duration: 300,
                easing: 'ease-in-out',
                delay: delay,
                fill: 'forwards'
            });
        });
        setTimeout(() => {
            for (let j = 0; j < cells.length; j++) {
                cells[j].style.backgroundColor = CURRENT_COLOR;
            }
        }, 1000);
    } else {
        cell.style.backgroundColor = CURRENT_COLOR;
    }
    })	
}

// Selecting a color from the palette
let color_cells = document.querySelectorAll('.color-cell')
for (let i = 0; i < color_cells.length; i++) {
    let color_cell = color_cells[i];
    color_cell.addEventListener('click', function() {
        // Determine the color based on the element's class.
        let colorClass = "";
        if (color_cell.classList.contains("red")) colorClass = "red";
        else if (color_cell.classList.contains("green")) colorClass = "green";
        else if (color_cell.classList.contains("blue")) colorClass = "blue";
        else if (color_cell.classList.contains("yellow")) colorClass = "yellow";
        else if (color_cell.classList.contains("skyblue")) colorClass = "skyblue";
        
        // Setting up the current color
        CURRENT_COLOR = COLOR_MAP[colorClass];
		
		// Turning off fill mode when selecting a color
        FILL_MODE = false;
        
        // Updating the selection in the palette
        document.querySelector('.selected').classList.remove('selected')
        color_cell.classList.add('selected')
    })
}

// Eraser handler
document.querySelector('.eraser').addEventListener('click', function() {
    CURRENT_COLOR = DEFAULT_COLOR;
	FILL_MODE = false; // Disable fill mode when selecting the eraser
    
    // Removing the selection from the previously selected element.
    document.querySelector('.selected').classList.remove('selected')
    
    // Adding a selection highlight to the eraser.
    this.classList.add('selected')
})

// Filling tool handler
document.querySelector('.fill-tool').addEventListener('click', function() {
    FILL_MODE = true;
    
    document.querySelector('.selected').classList.remove('selected')
    this.classList.add('selected')
})

// Saving to a cookie every minute
setInterval(function() {
    let result = '';
    let temp_cells = document.querySelectorAll('.cell');
    
    for (let i = 0; i < temp_cells.length; i += 1) {
        let cell = temp_cells[i];
        let color = cell.style.backgroundColor;
        
        // Finding the color index in the COLORS array
        let colorIndex = "0"; // Default (eraser)
        for (let j = 0; j < COLORS.length; j++) {
            if (color === COLORS[j]) {
                colorIndex = j.toString();
                break;
            }
        }
        
        result += colorIndex;
    }
    document.cookie = `pixel-result=${result};max-age=100000`;
}, 5000);

// Saving the result to the computer as an image using dom-to-image
document.querySelector('.save-tool').addEventListener('click', function() {
    // quality must be between 0 and 1 (0.95 = high quality, small size)
    domtoimage.toJpeg(field, { quality: 0.95 })
    .then(function (dataUrl) {
        // Creating a temporary link and clicking it to trigger the download
        let link = document.createElement('a');
        link.download = 'pixel.jpg';
        link.href = dataUrl;
        link.click();
    })
    .catch(function (error) {
        console.error('oops, something went wrong!', error);
    });
})

// Pencil cursor: an image that follows the mouse while it is over the field
let pencil_cursor = document.createElement('img');
pencil_cursor.src = 'pencils.png';
pencil_cursor.className = 'pencil-cursor';
pencil_cursor.alt = '';
document.body.appendChild(pencil_cursor);

field.addEventListener('mouseenter', function() {
    pencil_cursor.classList.add('visible');
});

field.addEventListener('mouseleave', function() {
    pencil_cursor.classList.remove('visible');
});

field.addEventListener('mousemove', function(event) {
    pencil_cursor.style.transform =
        `translate(${event.clientX}px, ${event.clientY}px) translate(-7%, -91%)`;
});