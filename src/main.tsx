import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "simplebar-react/dist/simplebar.min.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { LoadingProvider } from "./context/LoadingContext.tsx";
import { CartProvider } from "./context/CartContext.tsx";
import { ProspectsProvider } from "./context/ProspectsContext.tsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <LoadingProvider>
          <BrowserRouter>
            <AuthProvider>
              <CartProvider>
                <ProspectsProvider>
                  <AppWrapper>
                    <App />
                  </AppWrapper>
                </ProspectsProvider>
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
        </LoadingProvider>
      </NotificationProvider>
    </ThemeProvider>
  </StrictMode>
);
