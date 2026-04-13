import { useEffect, useState } from "react";
import API from "../api/api";
import TopHeader from "../../components/TopHeader";

// 🔥 CHART IMPORTS (PUT AT TOP)
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

// 🔥 REGISTER CHART
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard() {
  const [materials, setMaterials] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const mat = await API.get("/materials");
      const req = await API.get("/requests");

      // materials API returns a plain array
      setMaterials(Array.isArray(mat.data) ? mat.data : []);
      // requests API returns { success, data: [...] }
      const reqData = req.data.data || req.data;
      setRequests(Array.isArray(reqData) ? reqData : []);
    } catch (error) {
      console.error("Dashboard API Error:", error);
      setMaterials([]);
      setRequests([]);
    }
  };

  // 🔴 LOW STOCK
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeRequests = Array.isArray(requests) ? requests : [];
  const lowStock = safeMaterials.filter(m => m.quantity < 20);

  // 📊 CHART DATA
  const chartData = {
    labels: safeMaterials.map(m => m.name),
    datasets: [
      {
        label: "Stock Quantity",
        data: safeMaterials.map(m => m.quantity),
        backgroundColor: "rgba(59,130,246,0.6)",
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <TopHeader 
        title="Inventory Management Dashboard" 
        subtitle="Manage stock levels, materials, and warehouse requests"
      />

      {/* 🔥 LOW STOCK ALERT */}
      {lowStock.length > 0 && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          ⚠ {lowStock.length} materials are low in stock!
        </div>
      )}

      {/* 📊 CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500">Total Materials</p>
          <h2 className="text-2xl font-bold">{materials.length}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500">Low Stock</p>
          <h2 className="text-2xl font-bold text-red-500">
            {lowStock.length}
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500">Total Requests</p>
          <h2 className="text-2xl font-bold">{safeRequests.length}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500">Pending Requests</p>
          <h2 className="text-2xl font-bold">
            {safeRequests.filter(r => r.status === "Pending").length}
          </h2>
        </div>

      </div>

      {/* 📊 CHART */}
      <div className="grid grid-cols-2 gap-4 mb-6">

  <div className="bg-white p-4 rounded-xl shadow">
    <h2 className="font-bold mb-3">Stock Overview</h2>

    <div style={{ height: "250px" }}>
      <Bar
        data={chartData}
        options={{ maintainAspectRatio: false }}
      />
    </div>
  </div>
  <div className="bg-white p-4 rounded-xl shadow">

        <h2 className="font-bold mb-3">Low Stock Materials</h2>

        <table className="w-full text-left">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Material</th>
              <th>Quantity</th>
            </tr>
          </thead>

          <tbody>
            {lowStock.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-2">{m.name}</td>
                <td className="text-red-500">{m.quantity}</td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>

</div>

      {/* 📋 LOW STOCK TABLE */}
    

    </div>
  );
}