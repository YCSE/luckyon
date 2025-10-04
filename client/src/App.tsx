import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Pages
import { HomePage } from './pages/Home/HomePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { MyPage } from './pages/MyPage/MyPage';
import { TodayFortunePage } from './pages/Fortune/TodayFortunePage';
import { SajuPage } from './pages/Fortune/SajuPage';
import { TojungPage } from './pages/Fortune/TojungPage';
import { CompatibilityPage } from './pages/Fortune/CompatibilityPage';
import { WealthPage } from './pages/Fortune/WealthPage';
import { LovePage } from './pages/Fortune/LovePage';
import { PricingPage } from './pages/Pricing/PricingPage';
import { PaymentRedirectPage } from './pages/Payment/PaymentRedirectPage';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const routes = (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      {/* Fortune Routes */}
      <Route
        path="/fortune/today"
        element={
          <ProtectedRoute>
            <TodayFortunePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fortune/saju"
        element={
          <ProtectedRoute>
            <SajuPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fortune/tojung"
        element={
          <ProtectedRoute>
            <TojungPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fortune/compatibility"
        element={
          <ProtectedRoute>
            <CompatibilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fortune/wealth"
        element={
          <ProtectedRoute>
            <WealthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fortune/love"
        element={
          <ProtectedRoute>
            <LovePage />
          </ProtectedRoute>
        }
      />

      {/* Pricing Route */}
      <Route
        path="/pricing"
        element={
          <ProtectedRoute>
            <PricingPage />
          </ProtectedRoute>
        }
      />

      {/* Payment Redirect Route */}
      <Route
        path="/payment/redirect"
        element={
          <ProtectedRoute>
            <PaymentRedirectPage />
          </ProtectedRoute>
        }
      />

      {/* MyPage Route */}
      <Route
        path="/mypage"
        element={
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );

  return isLoginPage ? routes : <Layout>{routes}</Layout>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
};