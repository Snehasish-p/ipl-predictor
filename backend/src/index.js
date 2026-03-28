const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes      = require('./routes/auth');
const matchRoutes     = require('./routes/matches');
const selectionRoutes = require('./routes/selections');
const standingsRoutes = require('./routes/standings');
const usersRoutes     = require('./routes/users');

const app = express();

app.use(cors({
  origin: [
    'https://ipl-predictor-plum.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/matches',    matchRoutes);
app.use('/api/selections', selectionRoutes);
app.use('/api/standings',  standingsRoutes);
app.use('/api/users',      usersRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));