require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const frontendPublic = path.join(__dirname, '..', 'frontend', 'public'); 

app.use('/public', express.static(frontendPublic));            // รองรับ /public/...
app.use('/frontend/public', express.static(frontendPublic));   // รองรับ /frontend/public/...


app.get('/', (_,res)=>res.send('ShipLink API is running'));

app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api', (req, res, next) => {
  res.status(404).json({ message: 'Not Found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('API Error:', err);
  const code = err.status || 500;
  res.status(code).json({
    message: err.message || 'Internal Server Error',
    code
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API on :${PORT}`));
