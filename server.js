const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Подключение к базе данных
const MONGO_URI = 'mongodb+srv://ilmca568_db_user:MyPassword2026@cluster0.nqdobbg.mongodb.net/myDatabase?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('DB Error:', err));

const DataSchema = new mongoose.Schema({
    type: String, user: String, day: Number, text: String, title: String, desc: String
});
const Data = mongoose.model('Data', DataSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Стили вынесены в обычную строку, чтобы не было ошибок синтаксиса
const myStyles = '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>' +
        ':root { --bg: #0f172a; --panel: #1e293b; --text: #f8fafc; --accent: #6366f1; --border: #334155; }' +
        'body.theme-light { --bg: #f8fafc; --panel: #ffffff; --text: #0f172a; --accent: #2563eb; --border: #e2e8f0; }' +
        'body.theme-neon { --bg: #0d0221; --panel: #261447; --text: #ff0055; --accent: #00f7ff; --border: #ff0055; }' +
        'body.theme-hacker { --bg: #000; --panel: #0a0a0a; --text: #00ff41; --accent: #008f11; --border: #003b00; }' +
        'body { background: var(--bg); color: var(--text); font-family: sans-serif; padding: 20px; transition: 0.3s; margin:0; }' +
        '.container { max-width: 800px; margin: 0 auto; padding-top: 40px; }' +
        '.theme-bar { position: fixed; top: 10px; right: 10px; background: var(--panel); padding: 5px; border-radius: 20px; border: 1px solid var(--border); display: flex; gap: 5px; z-index: 1000; }' +
        '.theme-bar button { border: none; background: none; font-size: 18px; cursor: pointer; }' +
        '.card { background: var(--panel); padding: 20px; border-radius: 15px; border: 1px solid var(--border); margin-bottom: 15px; }' +
        'h3 { color: var(--accent); margin: 0 0 10px 0; }' +
        '.nav-box { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }' +
        '.nav-btn { padding: 20px; border-radius: 15px; text-align: center; color: #fff; text-decoration: none; font-weight: bold; }' +
        'form { background: var(--panel); padding: 20px; border-radius: 15px; border: 1px solid var(--border); display: grid; gap: 10px; }' +
        'input { padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--text); }' +
        'button[type="submit"] { padding: 12px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; }' +
        '.del { color: #fb7185; text-decoration: none; font-size: 12px; }' +
    '</style>';

const themeLogic = '<script>' +
    'function applyTheme(t) { ' +
        'document.body.className = t === "classic" ? "" : "theme-" + t; ' +
        'localStorage.setItem("user-theme", t); ' +
    '}' +
    'const saved = localStorage.getItem("user-theme");' +
    'if(saved) applyTheme(saved);' +
    '</script>';

app.get('/', async (req, res) => {
    try {
        const items = await Data.find({ type: 'item' });
        let cardsHtml = "";
        items.forEach(item => {
            cardsHtml += '<div class="card"><h3>' + item.title + '</h3><p>' + item.desc + '</p><a href="/delete/' + item._id + '" class="del">УДАЛИТЬ</a></div>';
        });

        res.send('<html><head><title>My Base</title>' + myStyles + '</head><body>' +
            '<div class="theme-bar">' +
                '<button onclick="applyTheme(\'classic\')">🌌</button>' +
                '<button onclick="applyTheme(\'light\')">☀️</button>' +
                '<button onclick="applyTheme(\'neon\')">🔮</button>' +
                '<button onclick="applyTheme(\'hacker\')">📟</button>' +
            '</div>' +
            '<div class="container">' +
                '<div class="nav-box">' +
                    '<a href="/calendar/ilya" class="nav-btn" style="background:#6366f1">ИЛЬЯ</a>' +
                    '<a href="/calendar/katya" class="nav-btn" style="background:#a855f7">КАТЯ</a>' +
                '</div>' +
                '<form action="/add" method="POST">' +
                    '<input name="title" placeholder="Заголовок" required>' +
                    '<input name="desc" placeholder="Описание" required>' +
                    '<button type="submit">ДОБАВИТЬ</button>' +
                '</form>' +
                '<div style="margin-top:30px">' + cardsHtml + '</div>' +
            '</div>' + themeLogic + '</body></html>');
    } catch (e) { res.send(e.message); }
});

app.get('/calendar/:user', async (req, res) => {
    try {
        const user = req.params.user;
        const records = await Data.find({ type: 'calendar', user: user });
        const cal = {};
        records.forEach(r => cal[r.day] = r.text);
        let days = "";
        for (let i = 1; i <= 31; i++) {
            days += '<div style="background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:10px;">' +
                    '<div style="font-size:10px;color:var(--accent)">' + i + ' число</div>' +
                    '<textarea oninput="socket.emit(\'edit-calendar\', {user:\'' + user + '\', day:' + i + ', text:this.value})" ' +
                    'style="background:transparent;border:none;color:var(--text);width:100%;height:40px;resize:none;outline:none;">' + (cal[i] || '') + '</textarea></div>';
        }
        res.send('<html><head><title>Calendar</title>' + myStyles + '</head><body>' +
            '<script src="/socket.io/socket.io.js"></script><script>const socket = io();</script>' +
            '<div class="container"><a href="/" style="color:var(--accent);text-decoration:none;font-weight:bold;">← НАЗАД</a>' +
            '<h2 style="text-align:center">ГРАФИК: ' + user.toUpperCase() + '</h2>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:20px">' + days + '</div></div>' +
            themeLogic + '</body></html>');
    } catch (e) { res.send(e.message); }
});

io.on('connection', (socket) => {
    socket.on('edit-calendar', async (data) => {
        await Data.findOneAndUpdate({ type: 'calendar', user: data.user, day: data.day }, { text: data.text }, { upsert: true });
        socket.broadcast.emit('update-ui', data);
    });
});

app.post('/add', async (req, res) => {
    await new Data({ type: 'item', title: req.body.title, desc: req.body.desc }).save();
    res.redirect('/');
});

app.get('/delete/:id', async (req, res) => {
    await Data.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Ready'));