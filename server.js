const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MONGO_URI = 'mongodb+srv://ilmca568_db_user:1SO4MvZPhTQwNAJb@cluster0.nqdobbg.mongodb.net/myDatabase?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('DB Error:', err));

const DataSchema = new mongoose.Schema({
    type: String,
    user: String,
    day: Number,
    text: String,
    title: String,
    desc: String
});
const Data = mongoose.model('Data', DataSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
    try {
        const items = await Data.find({ type: 'item' });
        let cardsHtml = `
            <div style="grid-column: 1/-1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; max-width:600px; margin: 0 auto 30px;">
                <a href="/calendar/ilya" style="text-decoration:none;"><div style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:25px;border-radius:20px;text-align:center;"><h2 style="color:#fff;margin:0;font-size:20px;">ИЛЬЯ</h2></div></a>
                <a href="/calendar/katya" style="text-decoration:none;"><div style="background:linear-gradient(135deg,#a855f7 0%,#9333ea 100%);padding:25px;border-radius:20px;text-align:center;"><h2 style="color:#fff;margin:0;font-size:20px;">КАТЯ</h2></div></a>
            </div>
        `;
        items.forEach((item) => {
            cardsHtml += `
                <div style="background:#1e293b;border:1px solid #334155;padding:20px;border-radius:16px;">
                    <h3 style="color:#38bdf8;margin:0">${item.title}</h3>
                    <p style="color:#94a3b8;font-size:14px">${item.desc}</p>
                    <a href="/delete/${item._id}" style="color:#fb7185;text-decoration:none;font-size:12px;font-weight:bold;">УДАЛИТЬ</a>
                </div>
            `;
        });

        res.send(`<html><body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:20px;">
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
    } catch (e) { res.send(e.message); }
});

app.get('/calendar/:user', async (req, res) => {
    const user = req.params.user;
    const records = await Data.find({ type: 'calendar', user: user });
    const cal = {};
    records.forEach(r => cal[r.day] = r.text);
    let daysHtml = '';
    for (let i = 1; i <= 31; i++) {
        daysHtml += `
            <div style="background:#1e293b;border:1px solid #334155;min-height:80px;border-radius:8px;">
                <div style="background:#334155;color:#fff;padding:4px;font-size:11px;">${i}</div>
                <textarea id="day-${i}" oninput="sendData('${user}', ${i}, this.value)" style="background:transparent;border:none;color:#fff;padding:5px;width:100%;height:50px;resize:none;outline:none;">${cal[i] || ''}</textarea>
            </div>
        `;
    }
    res.send(`<html><body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;padding:20px;">
        <script src="/socket.io/socket.io.js"></script>
        <a href="/" style="color:#fff;text-decoration:none;background:#334155;padding:10px 20px;border-radius:10px;">← НАЗАД</a>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:20px;">${daysHtml}</div>
        <script>
            const socket = io();
            function sendData(user, day, text) { socket.emit('edit-calendar', { user, day, text }); }
            socket.on('update-ui', (data) => {
                const el = document.getElementById('day-' + data.day);
                if (el && data.user === '${user}') { el.value = data.text; }
            });
        </script>
    </body></html>`);
});

io.on('connection', (socket) => {
    socket.on('edit-calendar', async (data) => {
        await Data.findOneAndUpdate(
            { type: 'calendar', user: data.user, day: data.day },
            { text: data.text },
            { upsert: true }
        );
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