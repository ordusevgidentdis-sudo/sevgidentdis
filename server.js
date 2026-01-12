
import express from 'express';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000; 
const JWT_SECRET = 'sevgident_ultra_secret_2024';

app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const dbPath = path.join(__dirname, 'database.sqlite');
const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database(dbPath, (err) => {
  if (err) console.error('SQLite bağlantı hatası:', err);
  else {
    console.log('SQLite Bağlandı:', dbPath);
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, key TEXT UNIQUE, value TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, image TEXT, slug TEXT, isVisible INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, title TEXT, description TEXT, image TEXT, isVisible INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, image TEXT, slug TEXT, status TEXT, date TEXT, isVisible INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS sliders (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, desc TEXT, image TEXT, isVisible INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS gallery (id INTEGER PRIMARY KEY AUTOINCREMENT, imageUrl TEXT, caption TEXT, isVisible INTEGER DEFAULT 1, sortOrder INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, fullName TEXT, email TEXT, message TEXT, date TEXT, isRead INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, fullName TEXT)`);

    db.get("SELECT count(*) as count FROM admins", (err, row) => {
      if (!err && row && row.count === 0) {
        const hashedPw = bcrypt.hashSync('admin123', 10);
        db.run("INSERT INTO admins (username, password, fullName) VALUES ('admin', ?, 'Sistem Yöneticisi')", [hashedPw]);
        console.log("-> Kurulum Tamamlandı: Kullanıcı adı: admin / Şifre: admin123");
      }
    });

    // Eksik ayarların otomatik tamamlanması
    const defaults = {
      clinicName: 'Poliklinik Adı',
      address: 'Adres bilgisini güncelleyiniz',
      phone: '0000 000 00 00',
      email: 'iletisim@site.com',
      logoText: 'KLİNİK',
      logoSubText: 'DİŞ POLİKLİNİĞİ',
      logoEmoji: '🦷',
      footerLogoUrl: '',
      logoColor: '#e11d48',
      logoSize: '80',
      footerSlogan: 'Profesyonel hizmet ve güler yüzlü ekip.',
      workingHoursWeekday: '09:00-18:00',
      workingHoursSaturday: '09:00-14:00',
      workingHoursSunday: 'Kapalı',
      adminPath: 'admin'
    };

    Object.entries(defaults).forEach(([key, value]) => {
      db.run("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", [key, value]);
    });
  });
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Yetkisiz erişim' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Oturum geçersiz' });
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// API Rotaları...
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM admins WHERE username = ?", [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Hatalı kullanıcı adı veya şifre' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, fullName: user.fullName } });
  });
});

app.get('/api/settings', (req, res) => {
  db.all("SELECT key, value FROM settings", (err, rows) => {
    if (err) return res.status(500).json({ message: 'Ayarlar yüklenemedi' });
    const s = {};
    if (rows) rows.forEach(r => s[r.key] = r.value);
    res.json(s);
  });
});

app.patch('/api/settings', authenticateToken, (req, res) => {
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  Object.entries(req.body).forEach(([k, v]) => stmt.run(k, String(v)));
  stmt.finalize(() => res.json({ success: true }));
});

const setupCrud = (table) => {
  app.get(`/api/${table}`, (req, res) => {
    db.all(`SELECT * FROM ${table} ORDER BY sortOrder ASC, id DESC`, (err, rows) => {
      res.json(rows || []);
    });
  });
  app.post(`/api/${table}`, authenticateToken, (req, res) => {
    const keys = Object.keys(req.body).filter(k => k !== 'id');
    const placeholders = keys.map(() => '?').join(',');
    const values = keys.map(k => req.body[k]);
    db.run(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`, values, function(err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ id: this.lastID });
    });
  });
  app.put(`/api/${table}/:id`, authenticateToken, (req, res) => {
    const keys = Object.keys(req.body).filter(k => k !== 'id');
    const sets = keys.map(k => `${k} = ?`).join(',');
    const values = [...keys.map(k => req.body[k]), req.params.id];
    db.run(`UPDATE ${table} SET ${sets} WHERE id = ?`, values, (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true });
    });
  });
  app.delete(`/api/${table}/:id`, authenticateToken, (req, res) => {
    db.run(`DELETE FROM ${table} WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
  });
  app.post(`/api/${table}/reorder`, authenticateToken, (req, res) => {
    const { id, direction } = req.body;
    db.get(`SELECT sortOrder FROM ${table} WHERE id = ?`, [id], (err, row) => {
      if (!row || err) return res.status(404).json({ message: 'Bulunamadı' });
      const currentOrder = row.sortOrder;
      const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
      db.run(`UPDATE ${table} SET sortOrder = ? WHERE sortOrder = ?`, [currentOrder, targetOrder], () => {
        db.run(`UPDATE ${table} SET sortOrder = ? WHERE id = ?`, [targetOrder, id], () => res.json({ success: true }));
      });
    });
  });
};

['services', 'doctors', 'posts', 'sliders', 'gallery'].forEach(setupCrud);

app.get('/api/admins', authenticateToken, (req, res) => {
  db.all("SELECT id, username, fullName FROM admins", (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/admins', authenticateToken, (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password || !fullName) return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
  const hashedPw = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO admins (username, password, fullName) VALUES (?, ?, ?)", [username, hashedPw, fullName], function(err) {
    if (err) return res.status(500).json({ message: 'Bu kullanıcı adı zaten alınmış.' });
    res.json({ id: this.lastID });
  });
});

app.post('/api/messages', (req, res) => {
  const { fullName, email, message } = req.body;
  const date = new Date().toLocaleString('tr-TR');
  db.run("INSERT INTO messages (fullName, email, message, date) VALUES (?, ?, ?, ?)", [fullName, email, message, date], () => res.json({ success: true }));
});
app.get('/api/messages', authenticateToken, (req, res) => db.all("SELECT * FROM messages ORDER BY id DESC", (err, rows) => res.json(rows || [])));
app.post('/api/messages/:id/read', authenticateToken, (req, res) => db.run("UPDATE messages SET isRead = 1 WHERE id = ?", [req.params.id], () => res.json({ success: true })));
app.delete('/api/messages/:id', authenticateToken, (req, res) => db.run("DELETE FROM messages WHERE id = ?", [req.params.id], () => res.json({ success: true })));

app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Dosya yüklenemedi' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use('/uploads', express.static(uploadDir));
app.use(express.static(__dirname)); 

app.use((req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send('Frontend bulunamadı.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sunucu Yayında: http://localhost:${PORT}`);
});
