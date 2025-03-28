import * as Sentry from "@sentry/bun";
// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://8d50011c16fef8a0eee7a9e92439541f@o4508130833793024.ingest.us.sentry.io/4509037283573760",
  tracesSampleRate: 1.0,
  _experiments: {
    enableLogs: true
  }
});