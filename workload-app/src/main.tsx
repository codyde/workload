import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { Toaster } from './components/ui/toaster';
import './index.css';
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: "https://c86b3fde568ba8f44186ad54e473be2e@o4508130833793024.ingest.us.sentry.io/4509037269483520",
  integrations: [Sentry.browserTracingIntegration(),
    Sentry.replayIntegration()
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost"],
  replaysSessionSampleRate: 1.0, 
  replaysOnErrorSampleRate: 1.0 
});

createRoot(document.getElementById('root')!).render(
<>
    <App />
    <Toaster />
</>
);
