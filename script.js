// 資料初始化
let events = JSON.parse(localStorage.getItem('events') || '[]');

// 事件對應中文名稱
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
const labels = statKeys.map(k => eventNames[k]);

// 狀態統計物件，分主隊/客隊
let stats = {
  home: statKeys.reduce((acc,k) => (acc[k]=0, acc), {}),
  away: statKeys.reduce((acc,k) => (acc[k]=0, acc), {})
};

// HTML 元素
const eventList = document.getElementById('eventList');
const addEventBtn = document.getElementById('addEventBtn');

const inningInput = document.getElementById('inningInput');
const pitchInput = document.getElementById('pitchInput');
const teamSelect = document.getElementById('teamSelect');
const batterInput = document.getElementById('batterInput');
const pitchResult = document.getElementById('pitchResult');
const eventType = document.getElementById('eventType');
const rbiInput = document.getElementById('rbiInput');
const runsInput = document.getElementById('runsInput');
const base1 = document.getElementById('base1');
const base2 = document.getElementById('base2');
const base3 = document.getElementById('base3');
const stealSelect = document.getElementById('stealSelect');

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
    const li = document.createElement('li');
    li.textContent = `局數: ${e.inning}  球數: ${e.pitchCount}  隊伍: ${e.team==='home'?'主隊':'客隊'}  打者: ${e.batter}  投球: ${e.pitchResult}  事件: ${eventNames[e.event]||'無'}  RBI: ${e.rbi}  得分: ${e.runs}  殘壘: ${[e.bases[0]?'一壘':'',e.bases[1]?'二壘':'',e.bases[2]?'三壘':''].filter(Boolean).join(',')||'無'}  盜壘: ${e.steal||'無'}`;
    eventList.appendChild(li);
  });
}

// 新增事件
addEventBtn.addEventListener('click', () => {
  const inning = Number(inningInput.value);
  const pitchCount = Number(pitchInput.value);
  const team = teamSelect.value;
  const batter = batterInput.value.trim();
