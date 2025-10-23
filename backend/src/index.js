require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_,res)=>res.send('ShipLink API is running'));

app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/quotes', require('./routes/quoteRoutes'));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API on :${PORT}`));
