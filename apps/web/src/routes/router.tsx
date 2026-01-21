import React from 'react';
import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';

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

// Define lazy-loaded components
const DashboardPageLazy = React.lazy(() => import('../pages/DashboardPage'));
const PortfolioPageLazy = React.lazy(() => import('../pages/PortfolioPage'));
const RebalancePageLazy = React.lazy(() => import('../pages/RebalancePage'));
const AnalysisPageLazy = React.lazy(() => import('../pages/AnalysisPage'));
const NotificationsPageLazy = React.lazy(() => import('../pages/NotificationsPage'));
const WelcomePageLazy = React.lazy(() => import('../pages/WelcomePage'));
const LoginPageLazy = React.lazy(() => import('../pages/LoginPage'));
const SignUpPageLazy = React.lazy(() => import('../pages/SignUpPage'));
// Placeholder for SettingsPage which will be implemented later
const SettingsPageLazy = React.lazy(() => import('../pages/SettingsPage'));

// Loading component for lazy-loaded routes
const LoadingComponent = () => (
  <div className="flex justify-center items-center h-screen">
    <p>Loading...</p>
  </div>
);

// Define routes with lazy loading
const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <React.Suspense fallback={<LoadingComponent />}>
          <Outlet />
        </React.Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  ),
});

const analysisRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analysis',
  component: AnalysisPageLazy,
  beforeLoad: authCheck,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  component: NotificationsPageLazy,
  beforeLoad: authCheck,
});

const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/welcome',
  component: WelcomePageLazy,
});

function IndexComponent() {
    const navigate = React.useCallback(() => {
         // Check if user is logged in (mock check for now)
         const token = window.localStorage.getItem('cola.finance.authToken');
         if (token) {
             router.navigate({ to: '/dashboard' });
         } else {
             router.navigate({ to: '/welcome' });
         }
    }, []);
    
    React.useEffect(() => {
        navigate();
    }, [navigate]);

    return <LoadingComponent />;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPageLazy,
  beforeLoad: authCheck,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: PortfolioPageLazy,
  beforeLoad: authCheck,
});

const rebalanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rebalance',
  component: RebalancePageLazy,
  beforeLoad: authCheck,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPageLazy,
  beforeLoad: authCheck,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPageLazy,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignUpPageLazy,
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
