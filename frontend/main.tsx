import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { LayoutModeProvider } from "./contexts/LayoutModeContext";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";

import "./styles/global.css";
import "./styles/internal.css";
import "./styles/traditional.css"; 

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LayoutModeProvider>
          <App />
        </LayoutModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);