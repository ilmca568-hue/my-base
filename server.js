const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const DATA_FILE = 'data.json';

// ЧИТАЕМ БАЗУ
const readDB = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const initial = { work_calendar: { ilya: {}, katya: {} }, items: [] };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
            return initial;
        }
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (!data.work_calendar) data.work_calendar = { ilya: {}, katya: {} };
        if (!data.items) data.items = [];
        return data;
    } catch (e) {
        return { work_calendar: { ilya: {}, katya: {} }, items: [] };
    }
};

const writeDB = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// ГЛАВНАЯ
app.get('/', (req, res) => {
    const db = readDB();
    const items = db.items || [];
    
    let cardsHtml = `
        <div style="grid-column: 1/-1; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <a href="/calendar/ilya" style="text-decoration: none;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 25px; border-radius: 20px; text-align: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);">
                    <h2 style="color: #fff; margin: 0; font-size: 20px;">ГРАФИК ИЛЬЯ →</h2>
                </div>
            </a>
            <a href="/calendar/katya" style="text-decoration: none;">
                <div style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); padding: 25px; border-radius: 20px; text-align: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);">
                    <h2 style="color: #fff; margin: 0; font-size: 20px;">ГРАФИК КАТЯ →</h2>
                </div>
            </a>
        </div>
    `;

    items.forEach((item, index) => {
        cardsHtml += `
            <div style="background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h3 style="color: #38bdf8; margin: 0;">${item.title}</h3>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 10px;">${item.desc}</p>
                </div>
                <a href="/delete/${index}" style="color: #fb7185; text-decoration: none; font-size: 12px; margin-top: 15px; font-weight: bold; border-top: 1px solid #334155; padding-top: 10px; display: block; text-align: center;">УДАЛИТЬ</a>
            </div>
        `;
    });

    res.send(`
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; margin: 0;">
            <div style="max-width: 1200px; margin: 0 auto;">
                <h1 style="text-align: center; font-weight: 300; margin-bottom: 40px;">Личная <b style="color: #6366f1;">База</b></h1>
                <div style="max-width: 500px; margin: 0 auto 50px; background: #1e293b; padding: 25px; border-radius: 20px; border: 1px solid #334155;">
                    <form action="/add" method="POST" style="display: flex; flex-direction: column; gap: 15px;">
                        <input name="title" placeholder="Заголовок" required style="padding: 12px; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 10px; outline: none;">
                        <input name="desc" placeholder="Описание" required style="padding: 12px; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 10px; outline: none;">
                        <button type="submit" style="padding: 14px; background: #6366f1; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">ДОБАВИТЬ КАРТОЧКУ</button>
                    </form>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px;">\${cardsHtml}</div>
            </div>
        </body></html>
    `);
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
        daysHtml += `
            <div style="background: #1e293b; border: 1px solid #334155; min-height: 100px; display: flex; flex-direction: column; border-radius: 8px;">
                <div style="background: #334155; color: #fff; padding: 4px 8px; font-size: 11px;">\${i}</div>
                <textarea onchange="saveDay('\${user}', \${i}, this.value)" style="background: transparent; border: none; color: #fff; padding: 8px; resize: none; flex-grow: 1; outline: none; font-size: 13px;">\${cal[i] || ''}</textarea>
            </div>
        `;
    }

    res.send(`
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; margin: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1100px; margin: 0 auto 30px;">
                <a href="/" style="color: #fff; text-decoration: none; font-weight: bold; background: \${color}; padding: 8px 15px; border-radius: 8px;">← НА ГЛАВНУЮ</a>
                <h1 style="margin: 0; font-weight: 300;">ГРАФИК: <b style="color: \${color};">\${name}</b></h1>
                <div style="width: 100px;"></div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; max-width: 1100px; margin: 0 auto;">\${daysHtml}</div>
            <script>
                async function saveDay(user, day, text) {
                    await fetch('/save-calendar', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ user, day, text })
                    });
                }
            </script>
        </body></html>
    `);
});

app.post('/save-calendar', (req, res) => {
    const { user, day, text } = req.body;
    const db = readDB();
    if (!db.work_calendar[user]) db.work_calendar[user] = {};
    db.work_calendar[user][day] = text;
    writeDB(db);
    res.sendStatus(200);
});

app.post('/add', (req, res) => {
    const db = readDB();
    db.items.push(req.body);
    writeDB(db);
    res.redirect('/');
});

app.get('/delete/:id', (req, res) => {
    const db = readDB();
    db.items.splice(req.params.id, 1);
    writeDB(db);
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server is running'));