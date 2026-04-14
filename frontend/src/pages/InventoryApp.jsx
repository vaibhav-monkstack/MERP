import { Routes, Route } from "react-router-dom";
import Dashboard from "./inventory/Dashboard";
import Materials from "./inventory/Materials";
import Requests from "./inventory/Requests";
import Suppliers from "./inventory/Suppliers";
import NewOrder from "./inventory/NewOrder";
import Orders from "./inventory/Orders";

function InventoryApp() {
  // Strict siloing is handled in App.jsx via ProtectedRoute.
  // This app is now exclusively for Inventory Managers handling internal stock and procurement.

  return (
    <div className="w-full bg-slate-50 min-h-screen">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/suppliers" element={<Suppliers />} />
        
        {/* PROCUREMENT (Purchase Orders from Suppliers) */}
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/new" element={<NewOrder />} />
      </Routes>
    </div>
  );
}

export default InventoryApp;