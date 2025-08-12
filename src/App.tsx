// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import RegisterForm from "./components/Register";
import UnitSelector from './components/UnitSelector';

// Importe os componentes do barbeiro
import BarberRoutesWithLayout from './components/BarberRoutesWithLayout';
import BarberAgenda from "./components/BarberAgenda";
import BarberDashboard from './components/BarberDashboard'; 
import BarberAvailability from './components/BarberAvailability';
import BarberClients from './components/BarberClients';
import BarberFinancial from './components/BarberFinancial';
import BarberProducts from './components/BarberProducts';
import BarberServices from './components/BarberServices';


const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/UnitSelector" element={<UnitSelector />} />
      
      {}
      <Route
        path="/barber"
        element={
          <PrivateRoute>
            <BarberRoutesWithLayout />
          </PrivateRoute>
        }
      >
        {}
        <Route index element={<BarberDashboard />} /> {/* Rota padrão para /barber */}
        <Route path="dashboard" element={<BarberDashboard />} />
        <Route path="agenda" element={<BarberAgenda />} />
        <Route path="availability" element={<BarberAvailability />} />
        <Route path="clients" element={<BarberClients />} />
        <Route path="financial" element={<BarberFinancial />} />
        <Route path="products" element={<BarberProducts />} />
        <Route path="services" element={<BarberServices />} />
      </Route>

      {/* Se a rota não for encontrada, redireciona para a página de login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;