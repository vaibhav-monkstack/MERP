import React from 'react';
import ComingSoon from '../components/ComingSoon';
import TopHeader from '../components/TopHeader';

// This is the top-level entry for the "Customer Orders" module (restricted to Order Managers)
export default function OrderApp() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container-custom py-8">
        <TopHeader 
          title="Order Management System" 
          subtitle="Manage customer orders, track fulfillment, and view shipment analytics"
        />
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center mt-10">
          <ComingSoon title="Customer Order Dashboard" />
          <p className="text-slate-500 mt-4 font-medium">
            This module is strictly for Order Managers to handle customer-facing shipments.
          </p>
        </div>
      </div>
    </div>
  );
}
