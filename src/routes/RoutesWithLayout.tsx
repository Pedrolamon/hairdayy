
import React from 'react';
import { Outlet } from 'react-router-dom'; 
import { Layout } from '../components/ui/sidebar.tsx';

const BarberRoutesWithLayout = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default BarberRoutesWithLayout;