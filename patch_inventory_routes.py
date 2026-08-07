with open('frontend/src/ui/AppRoutes.tsx', 'r') as f:
    content = f.read()

imports = """
import { Route, Routes, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ConfigurationPage, DashboardPage, ProductsPage, RecipesPage } from './pages';
import { LoginPage } from '../pages/Login';
import { ProductionDashboard } from '../pages/ProductionDashboard';
import { InventoryDashboard } from '../pages/InventoryDashboard';
import { InventoryLedger } from '../pages/InventoryLedger';
import { getAuthToken } from '../services/api';
import { ToastProvider } from './ToastProvider';
"""

content = content.replace("import { Route, Routes, Navigate } from 'react-router-dom';\nimport { AppShell } from './AppShell';\nimport { ConfigurationPage, DashboardPage, InventoryPage, ProductsPage, RecipesPage } from './pages';\nimport { LoginPage } from '../pages/Login';\nimport { ProductionDashboard } from '../pages/ProductionDashboard';\nimport { getAuthToken } from '../services/api';\nimport { ToastProvider } from './ToastProvider';", imports.strip())

routes = """
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/production" element={<ProductionDashboard />} />
        <Route path="/inventory" element={<InventoryDashboard />} />
        <Route path="/inventory/:storeId/product/:productId" element={<InventoryLedger />} />
"""

if "<Route path=\"/inventory\"" not in content:
    content = content.replace("<Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>\n        <Route path=\"/\" element={<DashboardPage />} />\n        <Route path=\"/dashboard\" element={<DashboardPage />} />\n        <Route path=\"/production\" element={<ProductionDashboard />} />", routes.strip())

with open('frontend/src/ui/AppRoutes.tsx', 'w') as f:
    f.write(content)
