const express = require('express');
const { port } = require('./config');
// const routes = require('./routes');
const { errorHandler } = require('./middleware/errorMiddleware');
const limiter = require('./middleware/rateLimitMiddleware');
const logger = require('./utils/logger');
const superadminRoutes = require('./super-admin/super-adminRoutes');
const adminRoutes = require('./admin/adminRoutes');
const workerRoutes = require('./workers/workerRoutes'); 
const cors = require('cors'); // Added for CORS support
const app = express();


// config dotenv
dotenv = require('dotenv');
dotenv.config();
// Enable CORS for all origins (adjust for production)
app.use(cors({
  origin: '*', // Allow all origins for testing; restrict in production (e.g., 'http://your-frontend-domain.com')
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Debug log for all incoming requests (moved after express.json)
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers
  });
  next();
});

app.use(limiter);
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
// app.use('/api', routes);
app.use('/api/super-admin', superadminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/worker', workerRoutes);
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});