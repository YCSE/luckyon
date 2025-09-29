import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';
import { LoginPage } from './pages/Auth/LoginPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
};