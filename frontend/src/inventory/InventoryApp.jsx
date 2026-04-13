import { Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import Requests from "./pages/Requests";
import Suppliers from "./pages/Suppliers";
import NewOrder from "./pages/NewOrder";
import Orders from "./pages/Orders";

function InventoryApp() {
  const location = useLocation();
  const showSidebar = !location.pathname.startsWith("/inventory/orders") || location.pathname === "/inventory/orders/new";

  return (
      <div className="flex">
        {showSidebar && <Layout />}

        <div className="flex-1 bg-gray-100 min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/suppliers" element={<Suppliers />} />
            {/* /orders/new MUST come before /orders to avoid premature match */}
            <Route path="/orders/new" element={<NewOrder />} />
            <Route path="/orders" element={<Orders />} />

          </Routes>
        </div>
      </div>
  );
}

export default InventoryApp;