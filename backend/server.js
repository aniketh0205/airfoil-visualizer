require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const airfoilRoutes = require('./routes/airfoilRoutes');
const contentRoutes = require('./routes/contentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', airfoilRoutes);
app.use('/api', contentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Airfoil Visualizer API is running' });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
