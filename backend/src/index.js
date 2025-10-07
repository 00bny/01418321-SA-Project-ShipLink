const express = require('express');
const db = require('./config/db');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.send('OK'));

app.get('/parcels', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM parcels');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

async function start() {
  // พยายามเชื่อม DB ก่อน start server (retry)
  for (let i = 0; i < 10; i++) {
    try {
      await db.query('SELECT 1');
      console.log('Connected to DB');
      break;
    } catch (e) {
      console.log('DB not ready, retry in 3s...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, () => console.log(`Server on ${PORT}`));
}

start();