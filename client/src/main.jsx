import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AppProvider } from "./context/AppContext";
import { ChatProvider } from "./context/ChatContext";


// Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

// Render root app with Clerk auth, Organization support, BrowserRouter, and global AppProvider
createRoot(document.getElementById("root")).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    afterSignInUrl="/"
    afterSignUpUrl="/"
  >
    <BrowserRouter>
      <AppProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </AppProvider>
    </BrowserRouter>
  </ClerkProvider>
);
