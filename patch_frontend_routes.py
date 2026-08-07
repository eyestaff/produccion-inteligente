with open('frontend/src/ui/AppRoutes.tsx', 'r') as f:
    content = f.read()

imports = """
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ConfigurationPage, DashboardPage, InventoryPage, ProductsPage, RecipesPage } from './pages';
import { LoginPage } from '../pages/Login';
import { ProductionDashboard } from '../pages/ProductionDashboard';
import { getAuthToken } from '../services/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getAuthToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
"""

content = content.replace("import { Route, Routes } from 'react-router-dom';\nimport { AppShell } from './AppShell';\nimport { ConfigurationPage, DashboardPage, InventoryPage, ProductsPage, ProductionPage, RecipesPage } from './pages';", imports.strip())

routes = """
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/production" element={<ProductionDashboard />} />
"""

if "<Route path=\"/login\"" not in content:
    content = content.replace("<Routes>\n      <Route element={<AppShell />}>\n        <Route path=\"/\" element={<DashboardPage />} />\n        <Route path=\"/dashboard\" element={<DashboardPage />} />\n        <Route path=\"/production\" element={<ProductionPage />} />", routes.strip())

with open('frontend/src/ui/AppRoutes.tsx', 'w') as f:
    f.write(content)
