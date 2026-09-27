require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const categoriesRouter = require('./routes/categories');
const nomineesRouter = require('./routes/nominees');
const nominationsRouter = require('./routes/nominations');
const votesRouter = require('./routes/votes');
const leaderboardRouter = require('./routes/leaderboard');
const statsRouter = require('./routes/stats');
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/nominees', nomineesRouter);
app.use('/api/nominations', nominationsRouter);
app.use('/api/votes', votesRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/stats', statsRouter);
app.use('/api/upload', uploadRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Comrade Choice Awards API running on port ${PORT}`);
});
