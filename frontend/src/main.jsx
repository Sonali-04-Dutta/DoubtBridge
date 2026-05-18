import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3200,
            className:
              "glass !rounded-2xl !border !border-white/70 !bg-white/90 !px-4 !py-3 !text-sm !font-semibold !text-slate-800 !shadow-card",
            success: {
              iconTheme: {
                primary: "#7b35f0",
                secondary: "#ffffff"
              }
            },
            error: {
              iconTheme: {
                primary: "#e11d48",
                secondary: "#ffffff"
              }
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
