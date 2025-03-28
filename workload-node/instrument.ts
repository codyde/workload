import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry for Node.js
Sentry.init({
  dsn: "https://8d50011c16fef8a0eee7a9e92439541f@o4508130833793024.ingest.us.sentry.io/4509037283573760",
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  integrations: [new ProfilingIntegration()],
});
