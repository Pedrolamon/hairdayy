// src/components/BarberRoutesWithLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom'; // Importe o Outlet para renderizar as rotas filhas
import { Layout } from './ui/sidebar.tsx';

const BarberRoutesWithLayout = () => {
  return (
    <Layout>
      {/* O Outlet renderiza o componente da rota aninhada (ex: BarberDashboard, BarberAgenda) */}
      <Outlet />
    </Layout>
  );
};

export default BarberRoutesWithLayout;