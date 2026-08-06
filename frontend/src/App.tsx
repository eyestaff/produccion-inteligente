import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './ui/AppRoutes';
import './styles.css';

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
