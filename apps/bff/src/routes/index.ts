import { Hono } from 'hono';
import { authRoutes } from './auth';
import { userRoutes } from './users';
import { portfolioRoutes, categoryRoutes } from './portfolios';
import { historicalPerformanceRoutes } from './historical-performance';
import { exchangeRateRoutes } from './exchange-rates';

export const apiRoutes = new Hono();

apiRoutes.route('/auth', authRoutes);
apiRoutes.route('/users', userRoutes);
apiRoutes.route('/portfolios', portfolioRoutes);
apiRoutes.route('/categories', categoryRoutes);
apiRoutes.route('/historical-performance', historicalPerformanceRoutes);
apiRoutes.route('/exchange-rates', exchangeRateRoutes);

