const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const http = require('http'); // Добавили HTTP сервер
const { Server } = require('socket.io'); // Добавили Сокеты

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const DATA_FILE = 'data.json';

const readDB = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initial = { work_calendar: { ilya: {}, katya: {} }, items: [] };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
            return initial;
        }
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) { return { work_calendar: { ilya: {}, katya: {} }, items: [] }; }
};

const writeDB = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// ЛОГИКА СОКЕТОВ
io.on('connection', (socket) => {
    console.log('Пользователь зашел на сайт');

    // Когда кто-то пишет в календаре
    socket.on('edit-calendar', (data) => {
        const db = readDB();
        if (!db.work_calendar[data.user]) db.work_calendar[data.user] = {};
        db.work_calendar[data.user][data.day] = data.text;
        writeDB(db);

        // Рассылаем ВСЕМ остальным обновленный текст
        socket.broadcast.emit('update-ui', data);
    });
});

// ГЛАВНАЯ
app.get('/', (req, res) => {
    const db = readDB();
    const items = db.items || [];
    let cardsHtml = `<div style="grid-column: 1/-1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <a href="/calendar/ilya" style="text-decoration:none;"><div style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:25px;border-radius:20px;text-align:center;"><h2 style="color:#fff;margin:0;font-size:20px;">ИЛЬЯ</h2></div></a>
        <a href="/calendar/katya" style="text-decoration:none;"><div style="background:linear-gradient(135deg,#a855f7 0%,#9333ea 100%);padding:25px;border-radius:20px;text-align:center;"><h2 style="color:#fff;margin:0;font-size:20px;">КАТЯ</h2></div></a>
    </div>`;

    items.forEach((item, i) => {
        cardsHtml += `<div style="background:#1e293b;border:1px solid #334155;padding:20px;border-radius:16px;">
            <h3 style="color:#38bdf8;margin:0">${item.title}</h3>
            <p style="color:#94a3b8;font-size:14px">${item.desc}</p>
            <a href="/delete/${i}" style="color:#fb7185;text-decoration:none;font-size:12px;font-weight:bold;">УДАЛИТЬ</a>
        </div>`;
    });

    res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:20px;">
            <h1 style="text-align:center;margin-bottom:40px;">Личная <b style="color:#6366f1;">База</b></h1>
            <div style="max-width:500px;margin:0 auto 50px;background:#1e293b;padding:25px;border-radius:20px;">
                <form action="/add" method="POST" style="display:flex;flex-direction:column;gap:15px;">
                    <input name="title" placeholder="Заголовок" required style="padding:12px;background:#0f172a;color:#fff;border:1px solid #334155;border-radius:10px;">
                    <input name="desc" placeholder="Описание" required style="padding:12px;background:#0f172a;color:#fff;border:1px solid #334155;border-radius:10px;">
                    <button type="submit" style="padding:14px;background:#6366f1;color:#fff;border:none;border-radius:10px;cursor:pointer;">ДОБАВИТЬ</button>
                </form>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:25px;">${cardsHtml}</div>
        </body></html>`);
});

// ГРАФИК
app.get('/calendar/:user', (req, res) => {
    const user = req.params.user;
    const db = readDB();
    const cal = db.work_calendar[user] || {};
    const name = user === 'ilya' ? 'ИЛЬЯ' : 'КАТЯ';
    const color = user === 'ilya' ? '#6366f1' : '#a855f7';
    
    let daysHtml = '';
    for (let i = 1; i <= 31; i++) {
        daysHtml += `<div style="background:#1e293b;border:1px solid #334155;min-height:80px;border-radius:8px;">
            <div style="background:#334155;color:#fff;padding:4px;font-size:11px;">${i}</div>
            <textarea id="day-${i}" oninput="sendData('${user}', ${i}, this.value)" style="background:transparent;border:none;color:#fff;padding:5px;width:100%;height:50px;resize:none;outline:none;">${cal[i] || ''}</textarea>
        </div>`;
    }

    res.send(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:20px;">
            <script src="/socket.io/socket.io.js"></script>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;">
                <a href="/" style="color:#fff;text-decoration:none;background:${color};padding:10px 20px;border-radius:10px;">← НА ГЛАВНУЮ</a>
                <h1 style="margin:0;">ГРАФИК: <b style="color:${color};">${name}</b></h1>
                <div style="width:50px;"></div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">${daysHtml}</div>
            <script>
                const socket = io();
                function sendData(user, day, text) {
                    socket.emit('edit-calendar', { user, day, text });
                }
                socket.on('update-ui', (data) => {
                    const el = document.getElementById('day-' + data.day);
                    if (el && data.user === '${user}') {
                        el.value = data.text;
                    }
                });
            </script>
        </body></html>`);
});

// Доп роуты
app.post('/add', (req, res) => { const db = readDB(); db.items.push(req.body); writeDB(db); res.redirect('/'); });
app.get('/delete/:id', (req, res) => { const db = readDB(); db.items.splice(req.params.id, 1); writeDB(db); res.redirect('/'); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Real-time server active'));