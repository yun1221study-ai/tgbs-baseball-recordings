let stats = {
  home: { hit: 0, hr: 0, bb: 0, so: 0, out: 0, run: 0 },
  away: { hit: 0, hr: 0, bb: 0, so: 0, out: 0, run: 0 }
};

const eventList = document.getElementById('eventList');
const teamSelect = document.getElementById('teamSelect');
const eventType = document.getElementById('eventType');
const addEventBtn = document.getElementById('addEvent');

function renderList() {
  eventList.innerHTML = '';
  JSON.parse(localStorage.getItem('events') || '[]').forEach(e => {
    const li = document.createElement('li');
    li.textContent = `${e.team === 'home' ? '主隊' : '客隊'} - ${e.type}`;
    eventList.appendChild(li);
  });
}

function updateCharts() {
  barChart.data.datasets[0].data = Object.values(stats.home);
  barChart.data.datasets[1].data = Object.values(stats.away);
  barChart.update();

  let totalOuts = stats.home.so + stats.home.out + stats.away.so + stats.away.out;
  pieChart.data.datasets[0].data = [stats.home.so + stats.away.so, stats.home.out + stats.away.out];
  pieChart.update();
}

addEventBtn.addEventListener('click', () => {
  const team = teamSelect.value;
  const type = eventType.value;
  if (!type) return alert('請選擇事件');
  stats[team][type]++;

  let events = JSON.parse(localStorage.getItem('events') || '[]');
  events.push({ team, type });
  localStorage.setItem('events', JSON.stringify(events));

  renderList();
  updateCharts();
});

const barChart = new Chart(document.getElementById('barChart'), {
  type: 'bar',
  data: {
    labels: ['安打', '本壘打', '保送', '三振', '其他出局', '得分'],
    datasets: [
      { label: '主隊', data: Object.values(stats.home), backgroundColor: 'rgba(255,99,132,0.5)' },
      { label: '客隊', data: Object.values(stats.away), backgroundColor: 'rgba(54,162,235,0.5)' }
    ]
  },
  options: { responsive: true }
});

const pieChart = new Chart(document.getElementById('pieChart'), {
  type: 'pie',
  data: {
    labels: ['三振', '其他出局'],
    datasets: [{ data: [0, 0], backgroundColor: ['#ff6384', '#36a2eb'] }]
  }
});

renderList();
updateCharts();

