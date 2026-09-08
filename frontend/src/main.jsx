import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppProvider } from "./context/AppContext";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";

if (!clerkPublishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY — set it in frontend/.env and restart the dev server (Vite only reads .env at startup).");
}

// Fix for bfcache ghosting: reload when page is restored from Back-Forward Cache.
// Google OAuth redirects cause the page to enter bfcache; on restoration React's
// DOM nodes are stale, leading to "Node cannot be found" errors and blank screens.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    window.location.reload();
  }
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <AppProvider>
        <App />
      </AppProvider>
    </ClerkProvider>
  </BrowserRouter>
);
