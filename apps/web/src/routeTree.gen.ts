import React from 'react';
import { Outlet, createRootRoute, createRoute } from '@tanstack/react-router';

const rootRoute = createRootRoute({
  component: () => React.createElement(Outlet),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () =>
    React.createElement('div', { className: 'p-6' }, 'Cola Finance'),
});

export const routeTree = rootRoute.addChildren([indexRoute]);
