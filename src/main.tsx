/**
 * Application entry point
 * Renders the main App component wrapped in React StrictMode
 */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;

const startApp = () => {
  createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// In preview/development, ensure no stale Service Worker caches break module loading.
// (Stale cached modules can cause context/provider mismatches and invalid hook calls.)
const shouldDisableServiceWorker =
  import.meta.env.DEV ||
  /(^|\.)lovableproject\.com$/.test(window.location.hostname) ||
  /(^|\.)lovable\.app$/.test(window.location.hostname);

if (shouldDisableServiceWorker && "serviceWorker" in navigator) {
  const flag = "glam-sw-cleared-v1";

  try {
    if (!sessionStorage.getItem(flag)) {
      sessionStorage.setItem(flag, "1");

      Promise.resolve()
        .then(() => navigator.serviceWorker.getRegistrations())
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => {
          if ("caches" in window) {
            return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
          }
        })
        .finally(() => {
          // If an SW was controlling this tab, reload once for a clean, uncached load.
          if (navigator.serviceWorker.controller) {
            window.location.reload();
            return;
          }
          startApp();
        });
    } else {
      startApp();
    }
  } catch {
    startApp();
  }
} else {
  startApp();
}

