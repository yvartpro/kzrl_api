const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const path = require('path');

const { syncDatabase } = require('./src/models');
const apiRoutes = require('./src/routes/api');

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "connect-src": ["'self'", ...allowedOrigins],
    },
  },
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use("/kzrl/", express.static("public"))

// Routes
app.use('/kzrl/api', apiRoutes);
// catch all
app.get('/kzrl/*splat', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')) });

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await syncDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
