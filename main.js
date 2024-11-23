const canvas = document.getElementById("bezierCanvas");
const ctx = canvas.getContext("2d");

// buttons
const toggleDrawing = document.getElementById("drawingMode");
const addConvolution = document.getElementById("addConvolution");
const deleteConvolution = document.getElementById("deleteConvolution");
const ensureContinuity = document.getElementById("ensureContinuity");
const ensureSmoothness = document.getElementById("ensureSmoothness");
const clearCanvas = document.getElementById("clear");

let convolutions = [];
let selectedConvolution = null;
let controlPoints = []; // points for the currently active convolution

let drawingEnabled = false;

let draggingPoint = null; // the control point being dragged
let draggingPointIndex = null; // index of the dragged point in the selected convolution

// toggle drawing mode
toggleDrawing.addEventListener("click", () => {
    if(drawingEnabled && controlPoints.length > 0){
        saveCurrentConvolution();
    }

    drawingEnabled = !drawingEnabled;   
    toggleDrawing.style.backgroundColor = drawingEnabled ? "#db90de" : "";

    // changing cursor
    canvas.style.cursor = drawingEnabled ? "crosshair" : "default";

    drawCanvas();
});

// start a new convolution
addConvolution.addEventListener("click", () => {
    if(controlPoints.length > 0){
        saveCurrentConvolution();
        drawCanvas();
    }
});

// delete convolution
deleteConvolution.addEventListener("click", () => {
    if(selectedConvolution == null) return;

    convolutions.splice(selectedConvolution, 1);
    selectedConvolution = null;

    drawCanvas();
});

// ensuring continuity C**0
ensureContinuity.addEventListener("click", () => {
    if(selectedConvolution == null) return;

    const points = convolutions[selectedConvolution];

    if(points.length < 8) return;

    for(let i = 4; i < points.length; i += 4){
        const endOfPrev = points[i - 1];
        const startOfNext = points[i];

        startOfNext.x = endOfPrev.x;
        startOfNext.y = endOfPrev.y;
    }

    drawCanvas();
});

// ensuring continuity C**1
ensureSmoothness.addEventListener("click", () => {
    if(selectedConvolution == null) return;

    const points = convolutions[selectedConvolution];

    if(points.length < 8) return;

    for(let i = 4; i < points.length; i += 4){
        const p3prev = points[i - 1];
        const p2prev = points[i - 2];
        const p0next = points[i];
        const p1next = points[i + 1];

        // C**0 continuity
        p0next.x = p3prev.x;
        p0next.y = p3prev.y;

        // C**1 continuity
        const dx = p3prev.x - p2prev.x;
        const dy = p3prev.y - p2prev.y;

        // mantaining tangent alignment
        p1next.x = p0next.x + dx;
        p1next.y = p0next.y + dy;
    }

    drawCanvas();
});

// clear canvas
clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    convolutions = [];
});


// add a new control point on mouse click
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if(!drawingEnabled){
        selectClosestConvolution({x, y});
        return;
    }

    controlPoints.push({x, y});

    drawCanvas();
});

canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if(selectedConvolution == null) return;

    // check if a point in the selected convolution is clicked
    const points = convolutions[selectedConvolution];
    points.forEach((point, index) => {
        const distance = Math.hypot(point.x - x, point.y - y);
        if(distance < 10){
            draggingPoint = point;
            draggingPointIndex = index;
        }
    });
});

canvas.addEventListener("mousemove", (event) => {
    if(!draggingPoint) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // update the position of the dragged point
    draggingPoint.x = x;
    draggingPoint.y = y;

    drawCanvas();
});

canvas.addEventListener("mouseup", () => {
    draggingPoint = null;
    draggingPointIndex = null;
});

// save the convolution
function saveCurrentConvolution(){
    convolutions.push([...controlPoints]);
    controlPoints = [];
}

function drawCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    convolutions.forEach((convolution, index) => {
        const color = index == selectedConvolution ? "#db90de" : "#2056e8";
        drawConvolution(convolution, color);
    });

    if(controlPoints.length > 0){
        drawConvolution(controlPoints, "#2056e8");
    }
    
}

function drawConvolution(points, color){
    // draw points
    ctx.fillStyle = "#d61818";
    points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // draw connecting lines between points
    if(points.length > 1){
        ctx.strokeStyle = "#aeb5bf";
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for(let i = 1; i < points.length; i++){
            if(i % 4 == 0){
                ctx.moveTo(points[i].x, points[i].y);
                continue;
            }
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    // draw curves
    for(let i = 0; i <= points.length - 4; i += 4){
        drawBezier(points.slice(i, i + 4), color);
    }
}

function drawBezier(points, color){
    const[p0, p1, p2, p3] = points;

    ctx.strokeStyle = color;
    ctx.beginPath();

    const accuracy = Math.ceil(
        Math.hypot(p0.x - p3.x, p0.y - p3.y) / 10
    );

    let prevPoint = p0;
    ctx.moveTo(prevPoint.x, prevPoint.y);

    for(let i = 1; i <= accuracy; i++){
        const t = i / accuracy;
        const nextPoint = calculateBezier(t, p0, p1, p2, p3);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        prevPoint = nextPoint;
    }

    ctx.stroke();
}

// De Casteljau's alorithm
function calculateBezier(t, p0, p1, p2, p3){
    const lerp = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

    const p01 = lerp(p0, p1, t);
    const p12 = lerp(p1, p2, t);
    const p23 = lerp(p2, p3, t);

    const p012 = lerp(p01, p12, t);
    const p123 = lerp(p12, p23, t);

    return lerp(p012, p123, t);
}

// select the closest convolution
function selectClosestConvolution(clickPoint){
    let closestIndex = null;
    let minDistance = Infinity;

    convolutions.forEach((convolution, index) => {
        convolution.forEach((point) => {
            const distance = Math.hypot(clickPoint.x - point.x, clickPoint.y - point.y);
            if(distance < minDistance){
                minDistance = distance;
                closestIndex = index;
            }
        });
    });

    if(closestIndex != selectedConvolution){
        selectedConvolution = closestIndex;
        drawCanvas();
    }
}

