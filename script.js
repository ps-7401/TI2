let chart;
let drawCanvas;
let drawCtx;
let isDrawing = false;
let rawPoints = [];
let smoothedData = [];
let maxTime = 60;
let maxIntensity = 10;
let currentSample = '';
let currentAttribute = '';

// 初期化
window.addEventListener('load', () => {
    initDrawCanvas();
    initChart();
    setupEventListeners();
});

// 描画キャンバスの初期化
function initDrawCanvas() {
    drawCanvas = document.getElementById('drawCanvas');
    drawCtx = drawCanvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // マウスイベント
    drawCanvas.addEventListener('mousedown', startDrawing);
    drawCanvas.addEventListener('mousemove', draw);
    drawCanvas.addEventListener('mouseup', stopDrawing);
    drawCanvas.addEventListener('mouseleave', stopDrawing);
    
    // タッチイベント
    drawCanvas.addEventListener('touchstart', handleTouch);
    drawCanvas.addEventListener('touchmove', handleTouch);
    drawCanvas.addEventListener('touchend', stopDrawing);
}

function resizeCanvas() {
    const rect = drawCanvas.getBoundingClientRect();
    drawCanvas.width = rect.width;
    drawCanvas.height = rect.height;
    redrawCanvas();
}

function redrawCanvas() {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    
    // グリッド描画
    drawCtx.strokeStyle = '#e0e0e0';
    drawCtx.lineWidth = 1;
    
    // 横線
    for (let i = 0; i <= 10; i++) {
        const y = (drawCanvas.height / 10) * i;
        drawCtx.beginPath();
        drawCtx.moveTo(0, y);
        drawCtx.lineTo(drawCanvas.width, y);
        drawCtx.stroke();
    }
    
    // 縦線
    for (let i = 0; i <= 10; i++) {
        const x = (drawCanvas.width / 10) * i;
        drawCtx.beginPath();
        drawCtx.moveTo(x, 0);
        drawCtx.lineTo(x, drawCanvas.height);
        drawCtx.stroke();
    }
    
    // 描画した線を再描画
    if (rawPoints.length > 0) {
        drawCtx.strokeStyle = '#667eea';
        drawCtx.lineWidth = 3;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        drawCtx.beginPath();
        drawCtx.moveTo(rawPoints[0].x, rawPoints[0].y);
        for (let i = 1; i < rawPoints.length; i++) {
            drawCtx.lineTo(rawPoints[i].x, rawPoints[i].y);
        }
        drawCtx.stroke();
    }
}

function startDrawing(e) {
    isDrawing = true;
    rawPoints = [];
    const pos = getMousePos(e);
    rawPoints.push(pos);
}

function draw(e) {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    rawPoints.push(pos);
    
    drawCtx.strokeStyle = '#667eea';
    drawCtx.lineWidth = 3;
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    
    if (rawPoints.length > 1) {
        const prev = rawPoints[rawPoints.length - 2];
        drawCtx.beginPath();
        drawCtx.moveTo(prev.x, prev.y);
        drawCtx.lineTo(pos.x, pos.y);
        drawCtx.stroke();
    }
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (rawPoints.length > 2) {
        processDrawing();
    }
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    drawCanvas.dispatchEvent(mouseEvent);
}

function getMousePos(e) {
    const rect = drawCanvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// 描画データの処理と補間
function processDrawing() {
    // キャンバス座標を実際の値に変換
    const convertedPoints = raw
