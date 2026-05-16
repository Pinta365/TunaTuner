// Import CSS files here for hot module reloading to work.
import "./assets/styles.css";
import "./assets/tuna-tuner.css";

// Register the offline service worker — production only, so it never
// interferes with Vite's dev HMR.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  globalThis.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
