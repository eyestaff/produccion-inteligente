import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { DashboardPage, ConfigurationPage } from './pages';
import { RecipesPage } from '../pages/RecipesPage';
import { LoginPage } from '../pages/Login';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { ToastProvider } from './ToastProvider';
import { ProductionDashboard } from '../pages/ProductionDashboard';
import { InventoryDashboard } from '../pages/InventoryDashboard';
import { InventoryLedger } from '../pages/InventoryLedger';
import { PurchasingPage } from '../pages/PurchasingPage';
import { ForecastDashboard } from '../pages/ForecastDashboard';
import { WasteDashboard } from '../pages/WasteDashboard';
import { ProductsPage } from '../pages/ProductsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ExecutiveReportPage } from '../pages/ExecutiveReportPage';
import { getAuthToken, getMustChangePassword } from '../services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getAuthToken()) {
    if (typeof window === 'undefined') {
      return <LoginPage />;
    }
    return <Navigate to="/login" replace />;
  }
  // If the user must change their password, redirect them to the change screen
  if (getMustChangePassword()) {
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Change password — accessible only with a valid token, no AppShell */}
        <Route
          path="/change-password"
          element={
            getAuthToken() ? (
              <ChangePasswordPage forced={getMustChangePassword()} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/forecast" element={<ForecastDashboard />} />
          <Route path="/production" element={<ProductionDashboard />} />
          <Route path="/inventory" element={<InventoryDashboard />} />
          <Route path="/inventory/:storeId/product/:productId" element={<InventoryLedger />} />
          <Route path="/purchasing" element={<PurchasingPage />} />
          <Route path="/waste" element={<WasteDashboard />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/reports/executive" element={<ExecutiveReportPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/configuration" element={<ConfigurationPage />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
