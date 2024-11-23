const canvas = document.getElementById("bezierCanvas");
const ctx = canvas.getContext("2d");

const toggleDrawing = document.getElementById("drawingMode");

let controlPoints = [];

let drawingEnabled = false;

toggleDrawing.addEventListener("click", (event) => {
    drawingEnabled = !drawingEnabled;
    toggleDrawing.style.backgroundColor = drawingEnabled ? "#a0f587" : "";
});

// add a new control point on mouse click
canvas.addEventListener("click", (event) => {
    if(!drawingEnabled) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    controlPoints.push({x, y});

    drawCanvas();
});

function drawCanvas(){
    // draw points
    ctx.fillStyle = "red";
    controlPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // draw connecting lines between points
    if(controlPoints.length > 1 && controlPoints.length % 4 != 1){
        let lastPoint = controlPoints.length - 1;

        ctx.strokeStyle = "#bac2cf";
        ctx.beginPath();
        ctx.moveTo(controlPoints[lastPoint - 1].x, controlPoints[lastPoint - 1].y);

        ctx.lineTo(controlPoints[lastPoint].x, controlPoints[lastPoint].y);

        ctx.stroke();
    }

    // draw curves
    if(controlPoints.length >= 4 && controlPoints.length % 4 == 0){
        drawBezier(controlPoints.slice(-4));
    }
}

function drawBezier(points){
    const[p0, p1, p2, p3] = points;

    ctx.strokeStyle = "blue";
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