import React from "react";
import ComingSoon from "../../components/ComingSoon";
import TopHeader from "../../components/TopHeader";

export default function Orders() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <TopHeader 
        title="Order Management Dashboard" 
        subtitle="Process sales orders and track shipment statuses"
      />
      <ComingSoon title="Order Management Dashboard" />
    </div>
  );
}
