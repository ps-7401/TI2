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
    const convertedPoints = rawPoints.map(p => ({
        time: (p.x / drawCanvas.width) * maxTime,
        intensity: maxIntensity - (p.y / drawCanvas.height) * maxIntensity
    }));
    
    // X軸でソート
    convertedPoints.sort((a, b) => a.time - b.time);
    
    // スプライン補間で滑らかに
    smoothedData = interpolateSpline(convertedPoints, 100);
    
    updateChart();
    updateDataTable();
}

// スプライン補間（簡易版）
function interpolateSpline(points, numPoints) {
    if (points.length < 2) return points;
    
    const result = [];
    const step = maxTime / numPoints;
    
    for (let t = 0; t <= maxTime; t += step) {
        const intensity = interpolateValue(points, t);
        result.push({ time: parseFloat(t.toFixed(2)), intensity: parseFloat(intensity.toFixed(2)) });
    }
    
    return result;
}

function interpolateValue(points, targetTime) {
    if (targetTime <= points[0].time) return points[0].intensity;
    if (targetTime >= points[points.length - 1].time) return points[points.length - 1].intensity;
    
    // 線形補間
    for (let i = 0; i < points.length - 1; i++) {
        if (targetTime >= points[i].time && targetTime <= points[i + 1].time) {
            const t = (targetTime - points[i].time) / (points[i + 1].time - points[i].time);
            return points[i].intensity + t * (points[i + 1].intensity - points[i].intensity);
        }
    }
    
    return 0;
}

// Chart.jsの初期化
function initChart() {
    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '強度',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Time-Intensity曲線（補間後）',
                    font: { size: 18, weight: 'bold' }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時間 (秒)',
                        font: { size: 14, weight: 'bold' }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '強度',
                        font: { size: 14, weight: 'bold' }
                    },
                    min: 0,
                    max: maxIntensity
                }
            }
        }
    });
}

function updateChart() {
    currentSample = document.getElementById('sampleName').value || 'サンプル名未設定';
    currentAttribute = document.getElementById('attribute').value || '属性未設定';
    
    chart.data.datasets[0].label = `${currentSample} - ${currentAttribute}`;
    chart.data.labels = smoothedData.map(d => d.time);
    chart.data.datasets[0].data = smoothedData.map(d => d.intensity);
    chart.options.scales.y.max = maxIntensity;
    chart.update();
}

function updateDataTable() {
    const tableDiv = document.getElementById('dataTable');
    
    let html = '<table><thead><tr><th>時間(秒)</th><th>強度</th></tr></thead><tbody>';
    
    // 10件ごとに表示
    const displayData = smoothedData.filter((_, i) => i % 10 === 0);
    
    for (let i = 0; i < displayData.length; i++) {
        html += `<tr><td>${displayData[i].time.toFixed(2)}</td><td>${displayData[i].intensity.toFixed(2)}</td></tr>`;
    }
    
    html += '</tbody></table>';
    tableDiv.innerHTML = html;
}

// イベントリスナー設定
function setupEventListeners() {
    document.getElementById('applySettings').addEventListener('click', () => {
        maxTime = parseInt(document.getElementById('maxTime').value);
        maxIntensity = parseInt(document.getElementById('maxIntensity').value);
        
        chart.options.scales.y.max = maxIntensity;
        chart.update();
        
        alert('設定を適用しました！新しく描画してください。');
    });
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        rawPoints = [];
        smoothedData = [];
        redrawCanvas();
        
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();
        
        document.getElementById('dataTable').innerHTML = '';
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('すべてをリセットしますか？')) {
            rawPoints = [];
            smoothedData = [];
            redrawCanvas();
            
            document.getElementById('sampleName').value = '';
            document.getElementById('attribute').value = '';
            document.getElementById('maxTime').value = 60;
            document.getElementById('maxIntensity').value = 10;
            
            maxTime = 60;
            maxIntensity = 10;
            
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.options.scales.y.max = 10;
            chart.update();
            
            document.getElementById('dataTable').innerHTML = '';
        }
    });
    
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        if (smoothedData.length === 0) {
            alert('データがありません');
            return;
        }
        
        currentSample = document.getElementById('sampleName').value || 'サンプル名未設定';
        currentAttribute = document.getElementById('attribute').value || '属性未設定';
        
        let csv = 'サンプル名,属性,時間(秒),強度\n';
        
        for (let i = 0; i < smoothedData.length; i++) {
            csv += `${currentSample},${currentAttribute},${smoothedData[i].time},${smoothedData[i].intensity}\n`;
        }
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `TI_${currentSample}_${currentAttribute}_${new Date().getTime()}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
