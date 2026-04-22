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
    type: String, user: String, day: Number, text: String, title: String, desc: String
});
const Data = mongoose.model('Data', DataSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const myStyles = '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>' +
        ':root { --bg: #0f172a; --panel: #1e293b; --text: #f8fafc; --accent: #6366f1; --border: #334155; }' +
        'body.theme-light { --bg: #f8fafc; --panel: #ffffff; --text: #0f172a; --accent: #2563eb; --border: #e2e8f0; }' +
        'body.theme-emerald { --bg: #064e3b; --panel: #065f46; --text: #ecfdf5; --accent: #34d399; --border: #059669; }' +
        'body.theme-rose { --bg: #2e1065; --panel: #4c1d95; --text: #fae8ff; --accent: #f472b6; --border: #7c3aed; }' +
        'body { background: var(--bg); color: var(--text); font-family: sans-serif; padding: 20px; transition: 0.3s; margin:0; }' +
        '.container { max-width: 900px; margin: 0 auto; padding-top: 40px; }' +
        '.theme-bar { position: fixed; top: 10px; right: 10px; background: var(--panel); padding: 8px; border-radius: 25px; border: 1px solid var(--border); display: flex; gap: 8px; z-index: 1000; }' +
        '.theme-bar button { border: none; background: none; font-size: 20px; cursor: pointer; transition: 0.2s; }' +
        '.theme-bar button:hover { transform: scale(1.2); }' +
        '.card { background: var(--panel); padding: 25px; border-radius: 20px; border: 1px solid var(--border); margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }' +
        'h3 { color: var(--accent); margin: 0 0 10px 0; font-size: 22px; }' +
        '.nav-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }' +
        '.nav-btn { padding: 25px; border-radius: 20px; text-align: center; color: #fff; text-decoration: none; font-weight: bold; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }' +
        'form { background: var(--panel); padding: 25px; border-radius: 20px; border: 1px solid var(--border); display: grid; gap: 15px; }' +
        'input { padding: 15px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 16px; outline: none; }' +
        'button[type="submit"] { padding: 15px; background: var(--accent); color: #fff; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 16px; }' +
        '.del { color: #fb7185; text-decoration: none; font-size: 13px; font-weight: bold; margin-top: 10px; display: inline-block; }' +
        /* Стили для календаря */
        '.cal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; margin-top: 30px; }' +
        '.cal-item { background: var(--panel); border: 2px solid var(--border); border-radius: 15px; padding: 15px; min-height: 100px; display: flex; flex-direction: column; }' +
        '.cal-num { font-size: 18px; color: var(--accent); font-weight: 900; margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 5px; }' +
        'textarea { background: transparent; border: none; color: var(--text); width: 100%; flex-grow: 1; resize: none; outline: none; font-size: 15px; line-height: 1.4; }' +
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
            cardsHtml += '<div class="card"><h3>' + item.title + '</h3><p>' + item.desc + '</p><a href="/delete/' + item._id + '" class="del">УДАЛИТЬ ЗАПИСЬ</a></div>';
        });

        res.send('<html><head><title>Личная База</title>' + myStyles + '</head><body>' +
            '<div class="theme-bar">' +
                '<button onclick="applyTheme(\'classic\')" title="Классика">🌑</button>' +
                '<button onclick="applyTheme(\'light\')" title="Светлая">☀️</button>' +
                '<button onclick="applyTheme(\'emerald\')" title="Изумруд">🌿</button>' +
                '<button onclick="applyTheme(\'rose\')" title="Роза">🍷</button>' +
            '</div>' +
            '<div class="container">' +
                '<div class="nav-box">' +
                    '<a href="/calendar/ilya" class="nav-btn" style="background:#6366f1">ИЛЬЯ</a>' +
                    '<a href="/calendar/katya" class="nav-btn" style="background:#a855f7">КАТЯ</a>' +
                '</div>' +
                '<form action="/add" method="POST">' +
                    '<input name="title" placeholder="Заголовок задания..." required>' +
                    '<input name="desc" placeholder="Подробное описание..." required>' +
                    '<button type="submit">ДОБАВИТЬ В СПИСОК</button>' +
                '</form>' +
                '<div style="margin-top:40px">' + cardsHtml + '</div>' +
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
            days += '<div class="cal-item">' +
                    '<div class="cal-num">' + i + ' число</div>' +
                    '<textarea oninput="socket.emit(\'edit-calendar\', {user:\'' + user + '\', day:' + i + ', text:this.value})" ' +
                    'placeholder="...">' + (cal[i] || '') + '</textarea></div>';
        }
        res.send('<html><head><title>Календарь</title>' + myStyles + '</head><body>' +
            '<script src="/socket.io/socket.io.js"></script><script>const socket = io();</script>' +
            '<div class="container"><a href="/" style="color:var(--accent);text-decoration:none;font-weight:bold;font-size:18px;">← НАЗАД В МЕНЮ</a>' +
            '<h1 style="text-align:center;text-transform:uppercase;letter-spacing:2px;margin:30px 0;">ГРАФИК: ' + user.toUpperCase() + '</h1>' +
            '<div class="cal-grid">' + days + '</div></div>' +
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
server.listen(PORT, () => console.log('Server Ready'));