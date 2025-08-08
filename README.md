<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>棒球賽記錄 - GitHub Pages</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="container">
    <header>
      <h1>棒球賽記錄（記錄員）</h1>
      <p class="muted">純前端 + LocalStorage，適合放在 GitHub Pages</p>
    </header>

    <section class="new-game">
      <h2>新增比賽</h2>
      <input id="teamA" placeholder="主隊名稱 (Team A)" />
      <input id="teamB" placeholder="客隊名稱 (Team B)" />
      <button id="createGame">建立比賽</button>
    </section>

    <section class="games-list">
      <h2>比賽清單</h2>
      <ul id="games"></ul>
    </section>

    <section id="scoreboardSection" class="hidden">
      <button id="backToList" class="link">← 返回比賽清單</button>
      <div class="scoreboard">
        <h2 id="gameTitle"></h2>
        <div class="score-row">
          <div class="team">
            <div id="homeName" class="team-name"></div>
            <div class="score-controls">
              <button class="inc" data-side="home">+1</button>
              <button class="dec" data-side="home">-1</button>
              <div class="score" id="homeScore">0</div>
            </div>
          </div>
          <div class="team">
            <div id="awayName" class="team-name"></div>
            <div class="score-controls">
              <button class="inc" data-side="away">+1</button>
              <button class="dec" data-side="away">-1</button>
              <div class="score" id="awayScore">0</div>
            </div>
          </div>
        </div>

        <div class="controls">
          <label>局數：
            <input id="inning" type="number" min="1" value="1" />
          </label>
          <label>上下半：
            <select id="half">
              <option value="top">上半</option>
              <option value="bottom">下半</option>
            </select>
          </label>
          <button id="recordEvent">新增事件</button>
          <button id="clearEvents" class="danger">清空事件</button>
          <button id="deleteGame" class="danger">刪除比賽</button>
        </div>

        <div class="events">
          <h3>事件紀錄</h3>
          <ol id="eventsList"></ol>
        </div>
      </div>
    </section>

    <footer>
      <small>資料儲存在本機 LocalStorage。想換成伺服器版可再跟我說！</small>
    </footer>
  </div>

  <dialog id="eventDialog">
    <form method="dialog" id="eventForm">
      <h3>新增事件（例：安打、失誤、換投）</h3>
      <label>描述
        <input id="eventDesc" placeholder="e.g. 安打：二壘打 - 王小明" />
      </label>
      <label>得分 runs
        <input id="eventRuns" type="number" min="0" value="0" />
      </label>
      <div class="dialog-actions">
        <button id="saveEvent">儲存</button>
        <button id="cancelEvent">取消</button>
      </div>
    </form>
  </dialog>

  <script src="script.js" type="module"></script>
</body>
</html>

