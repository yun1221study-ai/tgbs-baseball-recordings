// script.js
const stats = {
  home: { hit:0, dbl:0, hr:0, bb:0, hbp:0, so:0, out:0, dp:0, t:0, e:0, fc:0, l:0, run_er:0, run_nr:0 },
  away: { hit:0, dbl:0, hr:0, bb:0, hbp:0, so:0, out:0, dp:0, t:0, e:0, fc:0, l:0, run_er:0, run_nr:0 }
};
const labels = ["安打","二壘安打","本壘打","保送","觸身球","三振","其他出局","雙殺","觸殺","失誤","野選","殘壘"];
const eventMap = { hit:"安打", dbl:"二壘安打", hr:"本壘打", bb:"保送", hbp:"觸身球", so:"三振", out:"其他出局", dp:"雙殺", t:"觸殺", e:"失誤", fc:"野手選擇", l:"殘壘", run_er:"得分 (自責)", run_nr:"得分 (非自責)" };

const teamSelect = document.getElementById('teamSelect');
const eventType = document.getElementById('eventType');
const addEvent = document.getElementById('addEvent');
const eventList = document.getElementById('eventList');

let events = JSON.parse(localStorage.getItem('events')||'[]');

function renderList(){
  eventList.innerHTML = '';
  events.forEach(e=>{
    const li = document.createElement('li');
    li.textContent = `${e.team==="home"?"主隊":"客隊"} - ${eventMap[e.type]}`;
    eventList.appendChild(li);
  });
}

function updateCharts(){
  barChart.data.datasets[0].data = labels.map((_,i)=> stats.home[Object.keys(stats.home)[i]]);
  barChart.data.datasets[1].data = labels.map((_,i)=> stats.away[Object.keys(stats.away)[i]]);
  barChart.update();

  const er = stats.home.run_er + stats.away.run_er;
  const nr = stats.home.run_nr + stats.away.run_nr;
  runPieChart.data.datasets[0].data = [er, nr];
  runPieChart.update();
}

addEvent.addEventListener('click', () => {
  const team = teamSelect.value;
  const type = eventType.value;
  if (!type) return alert('請選擇事件');
  stats[team][type]++;
  events.push({ team, type });
  localStorage.setItem('events', JSON.stringify(events));
  renderList();
  updateCharts();
});

const barChart = new Chart(document.getElementById('barChart'), {
  type: 'bar',
  data: {
    labels,
    datasets:[
      { label:'主隊', data:labels.map(_=>0), backgroundColor:'rgba(255,99,132,0.5)' },
      { label:'客隊', data:labels.map(_=>0), backgroundColor:'rgba(54,162,235,0.5)' }
    ]
  },
  options:{ responsive: true }
});

const runPieChart = new Chart(document.getElementById('runPieChart'), {
  type:'pie',
  data:{
    labels:['自責分 ●','非自責分 O'],
    datasets:[{ data:[0,0], backgroundColor:['#ff6384','#36a2eb'] }]
  }
});

renderList();
updateCharts();
