import { AppErrorBoundary } from '@/components/common/app-error-boundary';
import { AppProviders } from '@/app/providers/app-providers';
import { AppRouter } from '@/app/router/app-router';

export function App() { return <AppErrorBoundary><AppProviders><AppRouter /></AppProviders></AppErrorBoundary>; }
