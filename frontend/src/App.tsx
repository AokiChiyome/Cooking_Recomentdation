import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "./components/ToastContainer";
import { AuthModals } from "./components/AuthModals";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { HomePage } from "./pages/Home/HomePage";
import { AdminPage } from "./pages/Admin/AdminPage";
import { DashboardPage } from "./pages/Admin/DashboardPage";

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ToastContainer />
          <AuthModals />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="admin">
              <Route index element={<AdminPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
