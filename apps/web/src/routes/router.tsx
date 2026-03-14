import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';
import { IndexRedirect } from './IndexRedirect';
import WelcomePage from '../pages/WelcomePage';
import LoginPage from '../pages/LoginPage';
import SignUpPage from '../pages/SignUpPage';
import DashboardPage from '../pages/DashboardPage';
import PortfolioPage from '../pages/PortfolioPage';
import RebalancePage from '../pages/RebalancePage';
import AnalysisPage from '../pages/AnalysisPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Auth check function
const authCheck = () => {
  const token = window.localStorage.getItem('cola.finance.authToken');
  if (!token) {
    throw redirect({
      to: '/login',
    });
  }
};

// Define routes with lazy loading
const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </QueryClientProvider>
  ),
});

const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analysis',
  component: AnalysisPage,
  beforeLoad: authCheck,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  component: NotificationsPage,
  beforeLoad: authCheck,
});

const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/welcome',
  component: WelcomePage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRedirect,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
  beforeLoad: authCheck,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: PortfolioPage,
  beforeLoad: authCheck,
});

const rebalanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rebalance',
  component: RebalancePage,
  beforeLoad: authCheck,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
  beforeLoad: authCheck,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignUpPage,
});

// Add routes to the router
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  portfolioRoute,
  rebalanceRoute,
  analysisRoute,
  notificationsRoute,
  settingsRoute,
  loginRoute,
  signupRoute,
  welcomeRoute,
]);

// Create the router
const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export { router };
