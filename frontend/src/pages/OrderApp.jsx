import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderDashboard from './orders/OrderDashboard';
import CreateOrder from './orders/CreateOrder';
import Customers from './orders/Customers';
import CustomerDetails from './orders/CustomerDetails';
import { LayoutDashboard, Plus, Users } from 'lucide-react';


export default function OrderApp() {
  const location = useLocation();

  const subLinks = [
    { name: 'Dashboard', path: '/orders', icon: LayoutDashboard },
    { name: 'New Order', path: '/orders/new', icon: Plus },
    { name: 'Customers', path: '/orders/customers', icon: Users },
  ];


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="py-8 px-6">
        <Routes>
          <Route index element={<OrderDashboard />} />
          <Route path="new" element={<CreateOrder />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
        </Routes>
      </div>
    </div>
  );
}


