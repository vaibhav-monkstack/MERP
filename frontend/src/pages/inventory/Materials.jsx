import React from "react";
import { useEffect, useState } from "react";
import API from "../../api/api";
import TopHeader from "../../components/TopHeader";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import { Edit2, Trash2, Plus, Search, X, RefreshCw } from "lucide-react";

export default function Materials() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [scanLoading, setScanLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "", type: "", quantity: "", min_stock: "20", supplier: ""
  });

  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    const res = await API.get("/materials");
    setData(res.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editId) {
      await API.put(`/materials/${editId}`, form);
    } else {
      await API.post("/materials", form);
    }

    setForm({ name: "", type: "", quantity: "", min_stock: "20", supplier: "" });
    setEditId(null);
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    await API.delete(`/materials/${id}`);
    fetchData();
  };

  const handleReorderScan = async () => {
    try {
      setScanLoading(true);
      const res = await API.post('/materials/reorder-scan');
      alert(`${res.data.count || 0} auto reorder request(s) created.`);
      fetchData();
    } catch (err) {
      console.error('Failed to run reorder scan:', err);
      alert('Unable to run reorder automation.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleEdit = (m) => {
    setForm({
      name: m.name || "",
      type: m.type || "",
      quantity: m.quantity != null ? String(m.quantity) : "",
      min_stock: m.min_stock != null ? String(m.min_stock) : "20",
      supplier: m.supplier || ""
    });
    setEditId(m.id);
    setShowModal(true);
  };

  // 🔍 FILTER LOGIC
  const lowStockMaterials = data.filter(m => Number(m.quantity) < Number(m.min_stock || 20));

  const filtered = data
    .filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter(m => {
      if (statusFilter === "Low") return Number(m.quantity) < Number(m.min_stock || 20);
      if (statusFilter === "In") return Number(m.quantity) >= Number(m.min_stock || 20);
      return true;
    });

  const tableHeaders = [
    { key: 'name', label: 'Material', sortable: false },
    { key: 'type', label: 'Type', sortable: false },
    { key: 'quantity', label: 'Quantity', sortable: false },
    { key: 'min_stock', label: 'Min Stock', sortable: false },
    { key: 'supplier', label: 'Supplier', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false, align: 'right' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container-custom py-8">

        {/* HEADER */}
        <TopHeader 
          title="Material Management" 
          subtitle="Track and manage all materials in your inventory"
        />

        {/* MAIN CONTENT CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">All Materials</h2>
                {lowStockMaterials.length > 0 && (
                  <p className="text-sm text-rose-600 mt-1">
                    {lowStockMaterials.length} item(s) below minimum stock threshold.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => { setEditId(null); setForm({ name: "", type: "", quantity: "", min_stock: "20", supplier: "" }); setShowModal(true); }}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={18} strokeWidth={3} />
                  <span>Add Material</span>
                </button>
                <button
                  onClick={handleReorderScan}
                  disabled={scanLoading}
                  className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={18} />
                  {scanLoading ? 'Scanning...' : 'Run Auto-Reorder Scan'}
                </button>
              </div>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:border-indigo-500 focus:bg-white transition-all font-medium outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="bg-slate-50 border-2 border-transparent rounded-2xl text-sm py-3 px-4 font-bold text-slate-600 focus:border-indigo-500 focus:bg-white outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="In">In Stock</option>
                <option value="Low">Low Stock</option>
              </select>
            </div>
          </div>

          <DataTable
            headers={tableHeaders}
            data={filtered}
            renderRow={(m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-none">
                <td className="px-6 py-5 text-sm font-bold text-slate-900">{m.name}</td>
                <td className="px-6 py-5 text-sm font-medium text-slate-500">{m.type}</td>
                <td className="px-6 py-5 text-sm font-bold text-slate-600">{m.quantity}</td>
                <td className="px-6 py-5 text-sm font-bold text-slate-600">{m.min_stock ?? 20}</td>
                <td className="px-6 py-5 text-sm font-medium text-slate-500">{m.supplier}</td>
                <td className="px-6 py-5">
                  <StatusBadge status={Number(m.quantity) < Number(m.min_stock ?? 20) ? "Low Stock" : "Active"} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(m)}
                      className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-rose-600 border border-transparent hover:border-slate-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-8 duration-300">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editId ? "Edit Material" : "Add Material"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
                <input
                  className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Material name"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type</label>
                <input
                  className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Material type"
                  value={form.type}
                  onChange={(e) => setForm({...form, type: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
                <input
                  type="number"
                  className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm({...form, quantity: e.target.value})}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Minimum Stock</label>
                <input
                  type="number"
                  className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Min stock threshold"
                  value={form.min_stock}
                  onChange={(e) => setForm({...form, min_stock: e.target.value})}
                  min="0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</label>
                <input
                  className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Supplier name"
                  value={form.supplier}
                  onChange={(e) => setForm({...form, supplier: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {editId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
