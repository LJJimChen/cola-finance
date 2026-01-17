import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { auth } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { assetRoutes } from './routes/assets';
import { categoryRoutes } from './routes/categories';
import { dashboardRoutes } from './routes/dashboard';
import { portfolioRoutes } from './routes/portfolio';
import { rebalanceRoutes } from './routes/rebalance';
import { exchangeRateRoutes } from './routes/exchange-rates';
import { historyRoutes } from './routes/history';
import { userRoutes } from './routes/users';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'https://cola-finance.com'], // Adjust for your frontend URL
    credentials: true,
  })
);

// Error handler
app.onError(errorHandler);

// Health check
app.get('/', (c) => c.text('Cola Finance BFF is running!'));

// API routes
app.route('/api/assets', assetRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/portfolio', portfolioRoutes);
app.route('/api/rebalance', rebalanceRoutes);
app.route('/api/exchange-rates', exchangeRateRoutes);
app.route('/api/history', historyRoutes);
app.route('/api/users', userRoutes);

// Auth middleware for protected routes
app.use('/api/*', auth);

export default app;