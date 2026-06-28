import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { queryClient } from './queryClient';
import { router } from './router';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
