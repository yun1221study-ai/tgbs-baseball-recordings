# tgbs-baseball-recordings
TGBS 比賽紀錄系統
baseball-score-system/
├─ README.md  (this file)
├─ node_modules/
/dist/
/frontend/node_modules/
/backend/node_modules/
.env
db.json
├─ docker-compose.yml (選用)
├─ backend/
│  ├─ {
  "name": "bb-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "lowdb": "^6.0.1",
    "socket.io": "^4.7.2",
    "shortid": "^2.2.16"
  }
}
│  ├─ node_modules/
/db.json
│  └─ // 後端：Express + socket.io + lowdb (輕量 JSON DB)
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { Low } = require('lowdb')
const { JSONFile } = require('lowdb/node')
const shortid = require('shortid')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })
app.use(cors())
app.use(express.json())

// DB 初始化
const adapter = new JSONFile('db.json')
const db = new Low(adapter)
;(async () => {
  await db.read()
  db.data = db.data || { teams: [], players: [], games: [] }
  await db.write()
})()

// RESTful - 簡易 API
app.get('/api/teams', async (req, res) => {
  await db.read()
  res.json(db.data.teams)
})

app.post('/api/teams', async (req, res) => {
  const { name, city } = req.body
  await db.read()
  const team = { id: shortid.generate(), name, city }
  db.data.teams.push(team)
  await db.write()
  res.json(team)
})

app.post('/api/players', async (req, res) => {
  const { name, number, position, teamId } = req.body
  await db.read()
  const player = { id: shortid.generate(), name, number, position, teamId }
  db.data.players.push(player)
  await db.write()
  res.json(player)
})

app.post('/api/games', async (req, res) => {
  // 建立簡單賽事物件
  const { homeTeamId, awayTeamId, date, venue } = req.body
  await db.read()
  const game = {
    id: shortid.generate(),
    homeTeamId,
    awayTeamId,
    date: date || new Date().toISOString(),
    venue: venue || '',
    status: 'scheduled',
    inning: 1,
    half: 'top', // top / bottom
    score: { home: 0, away: 0 },
    events: [] // {type: 'atbat'|'event', payload }
  }
  db.data.games.push(game)
  await db.write()
  res.json(game)
})

app.get('/api/games/:id', async (req, res) => {
  const id = req.params.id
  await db.read()
  const g = db.data.games.find(x => x.id === id)
  if (!g) return res.status(404).json({ error: 'not found' })
  res.json(g)
})

// 在比賽中新增打席或事件
app.post('/api/games/:id/event', async (req, res) => {
  const id = req.params.id
  const { type, payload } = req.body // payload 包含打者、投手、結果、rbi 等
  await db.read()
  const game = db.data.games.find(x => x.id === id)
  if (!game) return res.status(404).json({ error: 'game not found' })

  const ev = { id: shortid.generate(), time: new Date().toISOString(), type, payload }
  game.events.push(ev)

  // 如果是 scoring event 並含 rbi 或 runs，更新比分
  if (type === 'atbat' && payload && payload.runs) {
    const isHome = payload.offensive === 'home'
    if (isHome) game.score.home += payload.runs
    else game.score.away += payload.runs
  }

  await db.write()

  // 廣播給 front-end
  io.to(game.id).emit('gameUpdate', game)
  res.json(ev)
})

// WebSocket: client 可 join game 房間，接收該場比賽即時更新
io.on('connection', socket => {
  console.log('socket connected', socket.id)

  socket.on('joinGame', async (gameId) => {
    socket.join(gameId)
    await db.read()
    const g = db.data.games.find(x => x.id === gameId)
    if (g) socket.emit('gameUpdate', g)
  })

  socket.on('leaveGame', (gameId) => socket.leave(gameId))

  socket.on('disconnect', () => console.log('socket disconnected', socket.id))
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => console.log(`Backend running on :${PORT}`))
└─ frontend/
   ├─ {
  "name": "bb-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.7.2",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
   ├─ <!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>棒球記錄系統 - 記錄員</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
   └─ src/
      ├─ import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'

createRoot(document.getElementById('root')).render(<App />)
      ├─ import React, { useEffect, useState } from 'react'
import axios from 'axios'
import Scorer from './components/Scorer'

const API = import.meta.env.VITE_API || 'http://localhost:4000'

export default function App(){
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)

  useEffect(()=>{
    (async ()=>{
      const t = await axios.get(`${API}/api/teams`)
      setTeams(t.data)
      // get existing games
      // (沒做分页，範例用途)
      // 另：若要取得 games list，可加 API
    })()
  },[])

  async function createDemo(){
    if (teams.length < 2) return alert('請先建立至少 2 隊（透過後端 API）')
    const homeTeamId = teams[0].id
    const awayTeamId = teams[1].id
    const res = await axios.post(`${API}/api/games`, { homeTeamId, awayTeamId })
    setGames([...(games||[]), res.data])
  }

  return (
    <div style={{ padding: 16, fontFamily: 'Arial' }}>
      <h1>棒球記錄系統 — 記錄員介面</h1>
      <p>後端 API: {API}</p>

      <button onClick={createDemo}>建立測試比賽（使用前 2 隊）</button>

      <h2>現有比賽</h2>
      <ul>
        {games.map(g=> (
          <li key={g.id}>
            {g.id} — {g.homeTeamId} vs {g.awayTeamId} — {g.status}
            <button onClick={()=> setSelectedGame(g)} style={{ marginLeft: 8 }}>進入</button>
          </li>
        ))}
      </ul>

      {selectedGame && (
        <Scorer game={selectedGame} apiBase={API} onClose={()=>setSelectedGame(null)} />
      )}

      <hr />
      <p>提示：請先使用後端 API 建立隊伍與球員，或直接修改 `db.json`。</p>
    </div>
  )
}
      └─ import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'
import axios from 'axios'

export default function Scorer({ game, apiBase, onClose }){
  const [socket, setSocket] = useState(null)
  const [g, setG] = useState(game)
  const [batter, setBatter] = useState('')
  const [runs, setRuns] = useState(0)
  const [note, setNote] = useState('')

  useEffect(()=>{
    const s = io(apiBase)
    setSocket(s)
    s.emit('joinGame', g.id)
    s.on('gameUpdate', (newg) => setG(newg))
    return ()=>{ s.disconnect() }
  }, [])

  async function recordAtBat(){
    const payload = { batter, runs: Number(runs), offensive: 'home' } // 範例把進攻方設 home
    await axios.post(`${apiBase}/api/games/${g.id}/event`, { type: 'atbat', payload })
    setBatter('')
    setRuns(0)
  }

  async function recordGeneric(){
    const payload = { note }
    await axios.post(`${apiBase}/api/games/${g.id}/event`, { type: 'event', payload })
    setNote('')
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 12 }}>
      <h3>比賽：{g.id}</h3>
      <p>局數：第 {g.inning} 局（{g.half}） — 比分 {g.score.home} : {g.score.away}</p>

      <div>
        <h4>新增打席（簡易）</h4>
        <input placeholder="打者名稱或 id" value={batter} onChange={e=>setBatter(e.target.value)} />
        <input type="number" placeholder="得分 runs" value={runs} onChange={e=>setRuns(e.target.value)} style={{ width: 100, marginLeft: 8 }} />
        <button onClick={recordAtBat} style={{ marginLeft: 8 }}>紀錄打席</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>其他事件</h4>
        <input placeholder="備註" value={note} onChange={e=>setNote(e.target.value)} />
        <button onClick={recordGeneric} style={{ marginLeft: 8 }}>紀錄事件</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>事件紀錄</h4>
        <ol>
          {g.events.slice().reverse().map(ev => (
            <li key={ev.id}><small>{new Date(ev.time).toLocaleString()}</small> — <b>{ev.type}</b> — {JSON.stringify(ev.payload)}</li>
          ))}
        </ol>
      </div>

      <button onClick={onClose}>關閉</button>
    </div>
  )
}
         └─ version: '3.8'
services:
  backend:
    build: ./backend
    working_dir: /app
    command: node index.js
    volumes:
      - ./backend:/app
      - ./db.json:/app/db.json
    ports:
      - '4000:4000'
  frontend:
    build: ./frontend
    working_dir: /app
    command: npm run dev -- --host 0.0.0.0
    volumes:
      - ./frontend:/app
    ports:
      - '5173:5173'
