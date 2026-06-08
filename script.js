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
    
    // グリッド描画（薄いグレー）
    drawCtx.strokeStyle = '#f0f0f0';
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
    
    // 軸線（濃いめ）
    drawCtx.strokeStyle = '#d0d0d0';
    drawCtx.lineWidth = 2;
    // X軸
    drawCtx.beginPath();
    drawCtx.moveTo(0, drawCanvas.height);
    drawCtx.lineTo(drawCanvas.width, drawCanvas.height);
    drawCtx.stroke();
    // Y軸
    drawCtx.beginPath();
    drawCtx.moveTo(0, 0);
    drawCtx.lineTo(0, drawCanvas.height);
    drawCtx.stroke();
    
    // 描画した線を再描画
    if (rawPoints.length > 0) {
        drawCtx.strokeStyle = '#4a90e2';
        drawCtx.lineWidth = 2.5;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        drawCtx.beginPath();
        drawCtx.moveTo(rawPoints[0].x, rawPoints[0].y);
        for (let i = 1; i < rawPoints.length; i++) {
            drawCtx.lineTo(rawPoints[i].x, rawPoints[i].y);
        }
        drawCtx.stroke();
        
        // ポイントを描画
        drawCtx.fillStyle = '#4a90e2';
        for (let i = 0; i < rawPoints.length; i += 5) {
            drawCtx.beginPath();
            drawCtx.arc(rawPoints[i].x, rawPoints[i].y, 2, 0, Math.PI * 2);
            drawCtx.fill();
        }
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
    
    e.preventDefault();
    const pos = getMousePos(e);
    
    // 前の点との距離を計算
    if (rawPoints.length > 0) {
        const lastPoint = rawPoints[rawPoints.length - 1];
        const distance = Math.sqrt(
            Math.pow(pos.x - lastPoint.x, 2) + 
            Math.pow(pos.y - lastPoint.y, 2)
        );
        
        // 距離が大きい場合は中間点を補間
        if (distance > 5) {
            const steps = Math.ceil(distance / 5);
            for (let i = 1; i <= steps; i++) {
                const t = i / steps;
                const interpolatedPoint = {
                    x: lastPoint.x + (pos.x - lastPoint.x) * t,
                    y: lastPoint.y + (pos.y - lastPoint.y) * t
                };
                rawPoints.push(interpolatedPoint);
            }
        } else {
            rawPoints.push(pos);
        }
    } else {
        rawPoints.push(pos);
    }
    
    redrawCanvas();
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
    let convertedPoints = rawPoints.map(p => ({
        time: (p.x / drawCanvas.width) * maxTime,
        intensity: maxIntensity - (p.y / drawCanvas.height) * maxIntensity
    }));
    
    // X軸でソート
    convertedPoints.sort((a, b) => a.time - b.time);
    
    // 重複するX座標を平均化
    const uniquePoints = [];
    let currentTime = -1;
    let sumIntensity = 0;
    let count = 0;
    
    for (let i = 0; i < convertedPoints.length; i++) {
        const roundedTime = Math.round(convertedPoints[i].time * 10) / 10;
        
        if (roundedTime !== currentTime) {
            if (count > 0) {
                uniquePoints.push({
                    time: currentTime,
                    intensity: sumIntensity / count
                });
            }
            currentTime = roundedTime;
            sumIntensity = convertedPoints[i].intensity;
            count = 1;
        } else {
            sumIntensity += convertedPoints[i].intensity;
            count++;
        }
    }
    
    if (count > 0) {
        uniquePoints.push({
            time: currentTime,
            intensity: sumIntensity / count
        });
    }
    
    // より滑らかな補間（キュービックスプライン風）
    smoothedData = smoothInterpolation(uniquePoints, 200);
    
    updateChart();
    updateDataTable();
}

// 滑らかな補間処理
function smoothInterpolation(points, numPoints) {
    if (points.length < 2) return points;
    
    const result = [];
    const minTime = points[0].time;
    const maxTime = points[points.length - 1].time;
    const step = (maxTime - minTime) / numPoints;
    
    for (let t = minTime; t <= maxTime; t += step) {
        let intensity;
        
        // カトマル・ロム・スプライン補間
        intensity = catmullRomInterpolate(points, t);
        
        // 範囲内に制限
        intensity = Math.max(0, Math.min(maxIntensity, intensity));
        
        result.push({ 
            time: parseFloat(t.toFixed(2)), 
            intensity: parseFloat(intensity.toFixed(2)) 
        });
    }
    
    return result;
}

// カトマル・ロム補間
function catmullRomInterpolate(points, targetTime) {
    if (targetTime <= points[0].time) return points[0].intensity;
    if (targetTime >= points[points.length - 1].time) return points[points.length - 1].intensity;
    
    // targetTimeを含む区間を見つける
    let i = 0;
    for (i = 0; i < points.length - 1; i++) {
        if (targetTime >= points[i].time && targetTime <= points[i + 1].time) {
            break;
        }
    }
    
    // 4点を取得（catmull-romには前後2点ずつ必要）
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];
    
    // 正規化されたt（0-1）
    const t = (targetTime - p1.time) / (p2.time - p1.time);
    const t2 = t * t;
    const t3 = t2 * t;
    
    // カトマル・ロム公式
    const v0 = (p2.intensity - p0.intensity) * 0.5;
    const v1 = (p3.intensity - p1.intensity) * 0.5;
    
    return (2 * p1.intensity - 2 * p2.intensity + v0 + v1) * t3 +
           (-3 * p1.intensity + 3 * p2.intensity - 2 * v0 - v1) * t2 +
           v0 * t +
           p1.intensity;
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
                borderColor: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.08)',
                borderWidth: 2.5,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: '#4a90e2'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Time-Intensity曲線',
                    font: { size: 16, weight: '600' },
                    color: '#2d3748',
                    padding: { bottom: 20 }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: 13 },
                        color: '#4a5568',
                        usePointStyle: true,
                        padding: 15
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '時間 (秒)',
                        font: { size: 13, weight: '500' },
                        color: '#4a5568'
                    },
                    grid: {
                        color: '#f0f0f0',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#718096',
                        font: { size: 12 }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '強度',
                        font: { size: 13, weight: '500' },
                        color: '#4a5568'
                    },
                    min: 0,
                    max: maxIntensity,
                    grid: {
                        color: '#f0f0f0',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#718096',
                        font: { size: 12 }
                    }
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
