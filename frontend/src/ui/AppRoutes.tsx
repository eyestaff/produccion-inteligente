import { Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ConfigurationPage, DashboardPage, InventoryPage, ProductsPage, ProductionPage, RecipesPage } from './pages';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />
      </Route>
    </Routes>
  );
}
