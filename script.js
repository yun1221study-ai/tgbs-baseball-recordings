/* index script for Baseball recorder - stores data in localStorage */
const LS_KEY = 'bb_games_v1';

function loadGames(){
  const raw = localStorage.getItem(LS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveGames(games){
  localStorage.setItem(LS_KEY, JSON.stringify(games));
}

/* UI elements */
const teamAEl = document.getElementById('teamA');
const teamBEl = document.getElementById('teamB');
const createBtn = document.getElementById('createGame');
const gamesListEl = document.getElementById('games');

const scoreboardSection = document.getElementById('scoreboardSection');
const gameTitle = document.getElementById('gameTitle');
const homeNameEl = document.getElementById('homeName');
const awayNameEl = document.getElementById('awayName');
const homeScoreEl = document.getElementById('homeScore');
const awayScoreEl = document.getElementById('awayScore');
const inningEl = document.getElementById('inning');
const halfEl = document.getElementById('half');
const eventsListEl = document.getElementById('eventsList');
const backToListBtn = document.getElementById('backToList');
const recordEventBtn = document.getElementById('recordEvent');
const clearEventsBtn = document.getElementById('clearEvents');
const deleteGameBtn = document.getElementById('deleteGame');

const eventDialog = document.getElementById('eventDialog');
const eventForm = document.getElementById('eventForm');
const eventDesc = document.getElementById('eventDesc');
const eventRuns = document.getElementById('eventRuns');
const saveEventBtn = document.getElementById('saveEvent');
const cancelEventBtn = document.getElementById('cancelEvent');

let games = loadGames();
let currentGameId = null;

function renderGamesList(){
  gamesListEl.innerHTML = '';
  if(games.length === 0){
    gamesListEl.innerHTML = '<li>目前沒有比賽，請新增。</li>';
    return;
  }
  games.forEach(g=>{
    const li = document.createElement('li');
    li.className = 'game-li';
    const t = document.createElement('div');
    t.innerHTML = `<strong>${g.home}</strong> (${g.score.home}) vs <strong>${g.away}</strong> (${g.score.away}) — <small>${new Date(g.createdAt).toLocaleString()}</small>`;
    const enter = document.createElement('button');
    enter.textContent = '進入';
    enter.style.marginLeft = '12px';
    enter.onclick = ()=> openGame(g.id);
    li.appendChild(t);
    li.appendChild(enter);
    gamesListEl.appendChild(li);
  });
}

function openGame(id){
  const g = games.find(x=>x.id === id);
  if(!g) return;
  currentGameId = id;
  // populate UI
  gameTitle.textContent = `${g.home} vs ${g.away}`;
  homeNameEl.textContent = g.home;
  awayNameEl.textContent = g.away;
  homeScoreEl.textContent = g.score.home;
  awayScoreEl.textContent = g.score.away;
  inningEl.value = g.inning || 1;
  halfEl.value = g.half || 'top';
  renderEvents(g);
  document.querySelector('.games-list').classList.add('hidden');
  scoreboardSection.classList.remove('hidden');
}

function closeGame(){
  currentGameId = null;
  scoreboardSection.classList.add('hidden');
  document.querySelector('.games-list').classList.remove('hidden');
  renderGamesList();
}

/* events */
function renderEvents(g){
  eventsListEl.innerHTML = '';
  if(!g.events || g.events.length === 0){
    eventsListEl.innerHTML = '<li>尚無事件</li>';
    return;
  }
  g.events.slice().reverse().forEach(ev=>{
    const li = document.createElement('li');
    li.textContent = `${new Date(ev.time).toLocaleString()} — ${ev.desc}` + (ev.runs ? ` — +${ev.runs} run(s)` : '');
    eventsListEl.appendChild(li);
  });
}

createBtn.addEventListener('click', ()=>{
  const home = teamAEl.value.trim();
  const away = teamBEl.value.trim();
  if(!home || !away){ alert('請輸入雙方球隊名稱'); return; }
  const newGame = {
    id: 'g_' + Date.now(),
    home, away,
    createdAt: new Date().toISOString(),
    score: { home:0, away:0 },
    inning: 1,
    half: 'top',
    events: []
  };
  games.push(newGame);
  saveGames(games);
  teamAEl.value = '';
  teamBEl.value = '';
  renderGamesList();
  openGame(newGame.id);
});

backToListBtn.addEventListener('click', closeGame);

document.addEventListener('click', (e)=>{
  // increment/decrement buttons
  if(e.target.matches('button.inc')){
    const side = e.target.getAttribute('data-side');
    changeScore(side, 1);
  }
  if(e.target.matches('button.dec')){
    const side = e.target.getAttribute('data-side');
    changeScore(side, -1);
  }
});

function changeScore(side, delta){
  if(!currentGameId) return;
  const g = games.find(x=>x.id === currentGameId);
  if(!g) return;
  if(side === 'home') g.score.home = Math.max(0, (g.score.home || 0) + delta);
  else g.score.away = Math.max(0, (g.score.away || 0) + delta);
  // push event for history
  if(delta !== 0){
    g.events = g.events || [];
    g.events.push({ time: new Date().toISOString(), desc: `手動修改比分 (${side === 'home' ? g.home : g.away})`, runs: delta > 0 ? delta : 0 });
  }
  saveGames(games);
  homeScoreEl.textContent = g.score.home;
  awayScoreEl.textContent = g.score.away;
  renderEvents(g);
  renderGamesList();
}

inningEl.addEventListener('change', ()=>{
  if(!currentGameId) return;
  const g = games.find(x=>x.id === currentGameId);
  g.inning = Number(inningEl.value);
  saveGames(games);
});

halfEl.addEventListener('change', ()=>{
  if(!currentGameId) return;
  const g = games.find(x=>x.id === currentGameId);
  g.half = halfEl.value;
  saveGames(games);
});

recordEventBtn.addEventListener('click', ()=>{
  eventDesc.value = '';
  eventRuns.value = 0;
  eventDialog.showModal();
});

cancelEventBtn.addEventListener('click', (e)=>{
  e.preventDefault();
  eventDialog.close();
});

saveEventBtn.addEventListener('click', (e)=>{
  e.preventDefault();
  if(!currentGameId) return;
  const g = games.find(x=>x.id === currentGameId);
  const desc = eventDesc.value.trim();
  const runs = Number(eventRuns.value) || 0;
  if(!desc){ alert('請輸入事件描述'); return; }
  const ev = { time: new Date().toISOString(), desc, runs };
  g.events.push(ev);
  // 若有 runs，更新比分（這個範例預設攻方為主隊 home，可改進）
  if(runs > 0){
    // prompt：要哪隊得分？這裡簡化：詢問使用者
    const side = confirm('按「確定」表示主隊得分（Home）；按「取消」表示客隊得分（Away）。') ? 'home' : 'away';
    if(side === 'home') g.score.home += runs;
    else g.score.away += runs;
  }
  saveGames(games);
  renderEvents(g);
  homeScoreEl.textContent = g.score.home;
  awayScoreEl.textContent = g.score.away;
  renderGamesList();
  eventDialog.close();
});

clearEventsBtn.addEventListener('click', ()=>{
  if(!currentGameId) return;
  if(!confirm('確定要清空此場比賽的所有事件紀錄？')) return;
  const g = games.find(x=>x.id === currentGameId);
  g.events = [];
  saveGames(games);
  renderEvents(g);
});

deleteGameBtn.addEventListener('click', ()=>{
  if(!currentGameId) return;
  if(!confirm('確定要刪除此比賽？')) return;
  games = games.filter(x=>x.id !== currentGameId);
  saveGames(games);
  closeGame();
});

function init(){
  renderGamesList();
}

init();
