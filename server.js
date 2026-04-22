const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MONGO_URI = 'mongodb+srv://ilmca568_db_user:MyPassword2026@cluster0.nqdobbg.mongodb.net/myDatabase?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('DB Error:', err));

const DataSchema = new mongoose.Schema({
    type: String, user: String, day: Number, month: Number, text: String, title: String, desc: String
});
const Data = mongoose.model('Data', DataSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const monthsRu = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

const myStyles = '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>' +
        ':root { --bg: #0f172a; --panel: #1e293b; --text: #f8fafc; --accent: #6366f1; --border: #334155; }' +
        'body.theme-light { --bg: #f8fafc; --panel: #ffffff; --text: #0f172a; --accent: #2563eb; --border: #e2e8f0; }' +
        /* Nordic Night - Спокойный сине-серый */
        'body.theme-nordic { --bg: #2e3440; --panel: #3b4252; --text: #eceff4; --accent: #88c0d0; --border: #4c566a; }' +
        /* Coffee Slate - Теплый графит */
        'body.theme-coffee { --bg: #1a1a1a; --panel: #2d2a28; --text: #e2e2e2; --accent: #d4a373; --border: #3d3d3d; }' +
        
        'body { background: var(--bg); color: var(--text); font-family: sans-serif; padding: 20px; transition: 0.3s; margin:0; }' +
        '.container { max-width: 1200px; margin: 0 auto; padding-top: 60px; }' +
        '.theme-bar { position: fixed; top: 10px; right: 10px; background: var(--panel); padding: 10px; border-radius: 30px; border: 2px solid var(--border); display: flex; gap: 10px; z-index: 1000; }' +
        '.theme-bar button { border: none; background: none; font-size: 24px; cursor: pointer; transition: 0.2s; }' +
        '.theme-bar button:hover { transform: scale(1.1); }' +
        
        '.nav-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }' +
        '.nav-btn { padding: 30px; border-radius: 20px; text-align: center; color: #fff; text-decoration: none; font-weight: 900; font-size: 24px; text-transform: uppercase; }' +
        
        '.month-nav { display: flex; justify-content: center; align-items: center; gap: 30px; margin-bottom: 30px; }' +
        '.month-btn { background: var(--accent); color: #fff; border: none; padding: 15px 30px; border-radius: 15px; font-weight: bold; cursor: pointer; font-size: 20px; text-decoration: none; }' +
        '.month-title { font-size: 38px; font-weight: 900; min-width: 280px; text-align: center; text-transform: uppercase; letter-spacing: 2px; }' +
        
        '.cal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; margin-top: 30px; }' +
        '.cal-item { background: var(--panel); border: 3px solid var(--border); border-radius: 25px; padding: 25px; min-height: 180px; }' +
        '.cal-num { font-size: 28px; color: var(--accent); font-weight: 900; margin-bottom: 15px; display: block; border-bottom: 3px solid var(--border); padding-bottom: 10px; }' +
        'textarea { background: transparent; border: none; color: var(--text); width: 100%; height: 100px; resize: none; outline: none; font-size: 20px; font-weight: 600; }' +
        '.card { background: var(--panel); padding: 25px; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 20px; }' +
    '</style>';

const themeLogic = '<script>' +
    'function applyTheme(t) { document.body.className = t === "classic" ? "" : "theme-" + t; localStorage.setItem("user-theme", t); }' +
    'const saved = localStorage.getItem("user-theme"); if(saved) applyTheme(saved);' +
    '</script>';

// Главная
app.get('/', async (req, res) => {
    try {
        const items = await Data.find({ type: 'item' });
        let cardsHtml = "";
        items.forEach(item => {
            cardsHtml += '<div class="card"><h3 style="color:var(--accent); font-size:26px; margin:0">' + item.title + '</h3><p style="font-size:20px">' + item.desc + '</p><a href="/delete/' + item._id + '" style="color:#fb7185; font-weight:bold; text-decoration:none;">УДАЛИТЬ</a></div>';
        });
        res.send('<html><head><title>Base</title>' + myStyles + '</head><body>' +
            '<div class="theme-bar">' +
                '<button onclick="applyTheme(\'classic\')">🌌</button>' +
                '<button onclick="applyTheme(\'light\')">☀️</button>' +
                '<button onclick="applyTheme(\'nordic\')">❄️</button>' +
                '<button onclick="applyTheme(\'coffee\')">☕</button>' +
            '</div>' +
            '<div class="container">' +
                '<div class="nav-box">' +
                    '<a href="/calendar/Илья" class="nav-btn" style="background:#4f46e5">ГРАФИК ИЛЬЯ</a>' +
                    '<a href="/calendar/Катя" class="nav-btn" style="background:#7c3aed">ГРАФИК КАТЯ</a>' +
                '</div>' +
                '<div style="margin-top:50px">' + cardsHtml + '</div>' +
            '</div>' + themeLogic + '</body></html>');
    } catch (e) { res.send(e.message); }
});

// Календарь
app.get('/calendar/:user', async (req, res) => {
    try {
        const user = req.params.user;
        const nameDisplay = user === 'ilya' ? 'ИЛЬЯ' : 'КАТЯ';
        let m = parseInt(req.query.m);
        if (isNaN(m)) m = new Date().getMonth();
        
        const records = await Data.find({ type: 'calendar', user: user, month: m });
        const cal = {};
        records.forEach(r => cal[r.day] = r.text);
        
        let days = "";
        for (let i = 1; i <= 31; i++) {
            days += '<div class="cal-item"><span class="cal-num">' + i + ' ЧИСЛО</span>' +
                '<textarea oninput="socket.emit(\'edit-calendar\', {user:\'' + user + '\', month:' + m + ', day:' + i + ', text:this.value})">' + (cal[i] || '') + '</textarea></div>';
        }
        
        const prevM = (m === 0) ? 11 : m - 1;
        const nextM = (m === 11) ? 0 : m + 1;

        res.send('<html><head><title>Календарь</title>' + myStyles + '</head><body>' +
            '<script src="/socket.io/socket.io.js"></script><script>const socket = io();</script>' +
            '<div class="container">' +
                '<a href="/" style="color:var(--accent); text-decoration:none; font-weight:bold; font-size:22px;">← НАЗАД</a>' +
                '<h1 style="text-align:center; font-size:50px; margin:30px 0; letter-spacing:3px;">ГРАФИК: ' + nameDisplay + '</h1>' +
                '<div class="month-nav">' +
                    '<a href="?m=' + prevM + '" class="month-btn">⬅</a>' +
                    '<div class="month-title">' + monthsRu[m] + '</div>' +
                    '<a href="?m=' + nextM + '" class="month-btn">➡</a>' +
                '</div>' +
                '<div class="cal-grid">' + days + '</div>' +
            '</div>' + themeLogic + '</body></html>');
    } catch (e) { res.send(e.message); }
});

io.on('connection', (socket) => {
    socket.on('edit-calendar', async (data) => {
        await Data.findOneAndUpdate(
            { type: 'calendar', user: data.user, month: data.month, day: data.day }, 
            { text: data.text }, 
            { upsert: true }
        );
    });
});

app.get('/delete/:id', async (req, res) => { await Data.findByIdAndDelete(req.params.id); res.redirect('/'); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Ready with Smooth Themes!'));