import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import * as Sentry from "@sentry/react";
import "./index.css";

// Initialize Sentry for production error tracking
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, 
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    beforeSend(event, _hint) {
      // Don't send errors in development unless explicitly configured
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_FORCE_DEV) {
        return null;
      }
      return event;
    },
  });
}

// Register PWA service worker only in browser (not inside Capacitor native)
const isCapacitor = typeof (window as Window & { Capacitor?: unknown }).Capacitor !== "undefined";
if (!isCapacitor) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);

