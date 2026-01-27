require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Middleware for parsing JSON data
app.use(cors());
app.use(express.json());

// Import stock routes
const stockRoutes = require('./routes/stockRoutes');
app.use('/api/stocks', stockRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Stock Data Visualization Dashboard API');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
