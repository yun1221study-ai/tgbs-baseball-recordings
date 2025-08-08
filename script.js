// 事件對應中文名稱（重複貼，方便你直接複製）
const eventNames = {
  hit: '安打',
  dbl: '二壘安打',
  hr: '本壘打',
  bb: '保送',
  hbp: '觸身球',
  so: '三振',
  out: '其他出局',
  dp: '雙殺',
  t: '觸殺',
  e: '失誤',
  fc: '野手選擇',
  l: '殘壘'
};

// 事件統計欄位（長條圖用）
const statKeys = ['hit','dbl','hr','bb','hbp','so','out','dp','t','e','fc','l'];

// 重新計算統計數據
function recalcStats() {
  stats.home = statKeys.reduce((acc,k) => (acc[k]=0, acc), {});
  stats.away = statKeys.reduce((acc,k) => (acc[k]=0, acc), {});
  events.forEach(e => {
    if(statKeys.includes(e.event)) {
      stats[e.team][e.event]++;
    }
  });
}

// 顯示事件列表
function renderList() {
  eventList.innerHTML = '';
  events.forEach((e,i) => {
    // 產生佔壘文字
    const basesText = [e.bases[0]?'一壘':'', e.bases[1]?'二壘':'', e.bases[2]?'三壘':''].filter(Boolean).join(', ') || '無';

    const li = document.createElement('li');
    li.innerHTML = `
      <strong>局數:</strong> ${e.inning} ，
      <strong>球數:</strong> ${e.pitchCount} ，
      <strong>隊伍:</strong> ${e.team==='home'?'主隊':'客隊'} ，
      <strong>打者:</strong> ${e.batter} ，
      <strong>投球結果:</strong> ${e.pitchResult} ，
      <strong>事件:</strong> ${eventNames[e.event]||'無'} ，
      <strong>打點(RBI):</strong> ${e.rbi} ，
      <strong>得分:</strong> ${e.runs} ，
      <strong>殘壘:</strong> ${basesText} ，
      <strong>盜壘:</strong> ${e.steal || '無'}
    `;
    eventList.appendChild(li);
  });
}

// 更新圖表資料並重繪
function updateChart() {
  recalcStats();
  chart.data.datasets[0].data = statKeys.map(k => stats.home[k]);
  chart.data.datasets[1].data = statKeys.map(k => stats.away[k]);
  chart.update();
}

// 新增事件監聽
addEventBtn.addEventListener('click', () => {
  const inning = Number(inningInput.value);
  const pitchCount = Number(pitchInput.value);
  const team = teamSelect.value;
  const batter = batterInput.value.trim();
  const pitchRes = pitchResult.value;
  const evType = eventType.value;
  const rbi = Number(rbiInput.value);
  const runs = Number(runsInput.value);
  const bases = [base1.checked, base2.checked, base3.checked];
  const steal = stealSelect.value;

  if (!batter) {
    alert('請輸入打者姓名和背號');
    return;
  }
  if (inning < 1) {
    alert('請輸入正確的局數');
    return;
  }
  if (pitchCount < 1) {
    alert('請輸入正確的球數');
    return;
  }

  // 新事件物件
  const newEvent = {
    inning,
    pitchCount,
    team,
    batter,
    pitchResult: pitchRes,
    event: evType,
    rbi,
    runs,
    bases,
    steal
  };

  events.push(newEvent);
  localStorage.setItem('events', JSON.stringify(events));

  renderList();
  updateChart();

  // 清空輸入框，但保留局數和隊伍方便連續輸入
  batterInput.value = '';
  rbiInput.value = 0;
  runsInput.value = 0;
  base1.checked = false;
  base2.checked = false;
  base3.checked = false;
  stealSelect.value = '';
  eventType.value = '';
  pitchResult.value = 'S';
  pitchInput.value = pitchCount + 1; // 球數 +1
});

// 頁面載入時渲染
renderList();

// Chart.js 初始化
const ctx = document.getElementById('barChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels,
    datasets: [
      {
        label: '主隊',
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        data: statKeys.map(k => stats.home[k]),
      },
      {
        label: '客隊',
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        data: statKeys.map(k => stats.away[k]),
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero:true,
        precision: 0,
        stepSize: 1,
      }
    }
  }
});

// 初始化更新一次
updateChart();
