import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { DashboardPage, ConfigurationPage } from './pages';
import { RecipesPage } from '../pages/RecipesPage';
import { LoginPage } from '../pages/Login';
import { ToastProvider } from './ToastProvider';
import { ProductionDashboard } from '../pages/ProductionDashboard';
import { InventoryDashboard } from '../pages/InventoryDashboard';
import { InventoryLedger } from '../pages/InventoryLedger';
import { PurchasingPage } from '../pages/PurchasingPage';
import { ForecastDashboard } from '../pages/ForecastDashboard';
import { WasteDashboard } from '../pages/WasteDashboard';
import { ProductsPage } from '../pages/ProductsPage';
import { getAuthToken } from '../services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getAuthToken()) {
    if (typeof window === 'undefined') {
      return <LoginPage />;
    }
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <ToastProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
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
        <Route path="/configuration" element={<ConfigurationPage />} />
      </Route>
    </Routes>
    </ToastProvider>
  );
}

