import React from "react";
import { useEffect, useState } from "react";
import API from "../../api/api";
import TopHeader from "../../components/TopHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { Box, AlertTriangle, ClipboardList, Clock, Layers, RefreshCw } from "lucide-react";

// 🔥 CHART IMPORTS
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
  const [scanLoading, setScanLoading] = useState(false);

  const handleReorderScan = async () => {
    try {
      setScanLoading(true);
      const res = await API.post('/materials/reorder-scan');
      alert(`${res.data.count || 0} auto reorder request(s) created.`);
      fetchData();
    } catch (error) {
      console.error('Dashboard reorder scan error:', error);
      alert('Unable to run auto-reorder scan.');
    } finally {
      setScanLoading(false);
    }
  };

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

  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeRequests = Array.isArray(requests) ? requests : [];
  const lowStock = safeMaterials.filter(m => Number(m.quantity) < Number(m.min_stock || 20));

  // 📊 CHART DATA
  const chartData = {
    labels: safeMaterials.map(m => m.name),
    datasets: [
      {
        label: "Stock Quantity",
        data: safeMaterials.map(m => m.quantity),
        backgroundColor: "rgba(99, 102, 241, 0.6)", // Indigo
        borderRadius: 8,
      },
    ],
  };

  const tableHeaders = [
    { key: 'name', label: 'Material', sortable: false },
    { key: 'quantity', label: 'Quantity', sortable: false },
    { key: 'status', label: 'Alert', sortable: false, align: 'right' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container-custom py-8 px-6">

        {/* HEADER */}
        <TopHeader 
          title="Inventory Overview" 
          subtitle="Real-time stock monitoring and material tracking"
        />

        {/* 🔥 LOW STOCK ALERT */}
        {lowStock.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-pulse">
            <AlertTriangle size={20} />
            <span className="font-bold">{lowStock.length} materials are currently below minimum stock levels!</span>
            <button
              onClick={handleReorderScan}
              disabled={scanLoading}
              className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} />
              {scanLoading ? 'Scanning...' : 'Run Auto-Reorder'}
            </button>
          </div>
        )}

        {/* 📊 STATS CARDS */}
        <div className="stat-grid mb-10">
          <StatCard 
            title="Total Materials" 
            value={safeMaterials.length} 
            description="Cataloged items" 
            icon={Box} 
            iconColor="#6366f1"
          />
          <StatCard 
            title="Low Stock" 
            value={lowStock.length} 
            description="Restock required" 
            icon={AlertTriangle} 
            iconColor="#f43f5e"
          />
          <StatCard 
            title="Total Requests" 
            value={safeRequests.length} 
            description="Lifetime requests" 
            icon={ClipboardList} 
            iconColor="#3b82f6"
          />
          <StatCard 
            title="Pending Requests" 
            value={safeRequests.filter(r => r.status === "Pending").length} 
            description="Awaiting approval" 
            icon={Clock} 
            iconColor="#f59e0b"
          />
        </div>

        {/* 📊 CHART & TABLE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* CHART */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6 text-slate-900 font-black tracking-tight">
              <Layers size={18} className="text-indigo-600" />
              <h2 className="text-lg">Stock Level Distribution</h2>
            </div>
            <div className="h-[300px]">
              <Bar
                data={chartData}
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                  }
                }}
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-2 text-slate-900 font-black tracking-tight">
              <AlertTriangle size={18} className="text-rose-500" />
              <h2 className="text-lg">Critical Low Stock</h2>
            </div>
            <DataTable 
              headers={tableHeaders}
              data={lowStock}
              renderRow={(m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{m.name}</td>
                  <td className="px-6 py-4 text-sm font-black text-rose-600">{m.quantity}</td>
                  <td className="px-6 py-4 text-right">
                    <StatusBadge status="Low Stock" />
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
