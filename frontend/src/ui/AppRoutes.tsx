import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { DashboardPage, ProductsPage, RecipesPage, ConfigurationPage } from './pages';
import { LoginPage } from '../pages/Login';
import { ToastProvider } from './ToastProvider';
import { ProductionDashboard } from '../pages/ProductionDashboard';
import { InventoryDashboard } from '../pages/InventoryDashboard';
import { InventoryLedger } from '../pages/InventoryLedger';
import { getAuthToken } from '../services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getAuthToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <ToastProvider>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/production" element={<ProductionDashboard />} />
        <Route path="/inventory" element={<InventoryDashboard />} />
        <Route path="/inventory/:storeId/product/:productId" element={<InventoryLedger />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
      </Route>
    </Routes>
    </ToastProvider>
  );
}

