import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { ToastProvider } from '@/shared/components/Toast';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

import { queryClient } from './queryClient';
import { router } from './router';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
