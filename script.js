let chart;
let timeData = [];
let intensityData = [];
let isRecording = false;
let startTime;
let intervalId;
let currentSample = '';
let currentAttribute = '';

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
                pointRadius: 4,
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Time-Intensity曲線',
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
                    max: 10
                }
            }
        }
    });
}

// 要素の取得
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');
const sampleNameInput = document.getElementById('sampleName');
const attributeInput = document.getElementById('attribute');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportImageBtn = document.getElementById('exportImageBtn');

// 評価開始
startBtn.addEventListener('click', () => {
    currentSample = sampleNameInput.value || 'サンプル名未設定';
    currentAttribute = attributeInput.value || '属性未設定';
    
    isRecording = true;
    startTime = Date.now();
    timeData = [];
    intensityData = [];
    
    startBtn.disabled = true;
    stopBtn.disabled = false;
    intensitySlider.disabled = false;
    sampleNameInput.disabled = true;
    attributeInput.disabled = true;
    
    chart.data.datasets[0].label = `${currentSample} - ${currentAttribute}`;
    
    intervalId = setInterval(() => {
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        const intensity = parseFloat(intensitySlider.value);
        
        timeData.push(parseFloat(elapsedTime));
        intensityData.push(intensity);
        
        updateChart();
        updateDataTable();
    }, 100);
});

// 評価終了
stopBtn.addEventListener('click', () => {
    isRecording = false;
    clearInterval(intervalId);
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    intensitySlider.disabled = true;
});

// リセット
resetBtn.addEventListener('click', () => {
    if (confirm('データをリセットしますか?')) {
        isRecording = false;
        clearInterval(intervalId);
        
        timeData = [];
        intensityData = [];
        
        chart.data.labels = [];
        chart.data.datasets[0].data = [];
        chart.update();
        
        intensitySlider.value = 0;
        intensityValue.textContent = '0.0';
        
        startBtn.disabled = false;
        stopBtn.disabled = true;
        intensitySlider.disabled = true;
        sampleNameInput.disabled = false;
        attributeInput.disabled = false;
        
        document.getElementById('dataTable').innerHTML = '';
    }
});

// スライダーの値表示
intensitySlider.addEventListener('input', (e) => {
    intensityValue.textContent = parseFloat(e.target.value).toFixed(1);
});

// グラフ更新
function updateChart() {
    chart.data.labels = timeData;
    chart.data.datasets[0].data = intensityData;
    chart.update('none'); // アニメーションなしで更新
}

// データテーブル更新
function updateDataTable() {
    const tableDiv = document.getElementById('dataTable');
    
    let html = '<table><thead><tr><th>時間(秒)</th><th>強度</th></tr></thead><tbody>';
    
    // 最新10件のみ表示
    const displayData = timeData.slice(-10);
    const displayIntensity = intensityData.slice(-10);
    
    for (let i = 0; i < displayData.length; i++) {
        html += `<tr><td>${displayData[i].toFixed(1)}</td><td>${displayIntensity[i].toFixed(1)}</td></tr>`;
    }
    
    html += '</tbody></table>';
    tableDiv.innerHTML = html;
}

// CSV出力
exportCsvBtn.addEventListener('click', () => {
    if (timeData.length === 0) {
        alert('データがありません');
        return;
    }
    
    let csv = 'サンプル名,属性,時間(秒),強度\n';
    
    for (let i = 0; i < timeData.length; i++) {
        csv += `${currentSample},${currentAttribute},${timeData[i].toFixed(1)},${intensityData[i].toFixed(1)}\n`;
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

// 画像出力
exportImageBtn.addEventListener('click', () => {
    if (timeData.length === 0) {
        alert('データがありません');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `TI_${currentSample}_${currentAttribute}_${new Date().getTime()}.png`;
    link.href = chart.toBase64Image();
    link.click();
});

// 初期化
window.addEventListener('load', () => {
    initChart();
});
