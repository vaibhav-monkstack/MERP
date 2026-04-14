import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import TopHeader from "../../components/TopHeader";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { 
  Edit2, Trash2, Plus, Search, X, 
  Truck, ShoppingCart, Timer,
  Mail, Phone, MapPin, Star,
  ExternalLink, PackagePlus
} from "lucide-react";

export default function Suppliers() {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    location: "",
    rating: "",
    status: "On Time",
  });

  const [editId, setEditId] = useState(null);

  // FETCH DATA
  const fetchData = async () => {
    try {
      const res = await API.get("/suppliers");
      setData(res.data);

      const orderRes = await API.get("/inv-orders");
      const ordersArray = orderRes.data;
      setOrders(Array.isArray(ordersArray) ? ordersArray.slice(0, 3) : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editId) {
        await API.put(`/suppliers/${editId}`, form);
      } else {
        await API.post("/suppliers", form);
      }

      setForm({
        name: "",
        contact_email: "",
        contact_phone: "",
        location: "",
        rating: "",
        status: "On Time",
      });

      setEditId(null);
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // EDIT
  const handleEdit = (s) => {
    setForm(s);
    setEditId(s.id);
    setShowModal(true);
  };

  // DELETE
  const handleDelete = async (id) => {
    if (window.confirm("Delete supplier?")) {
      await API.delete(`/suppliers/${id}`);
      fetchData();
    }
  };

  // FILTER
  const filtered = data.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const onTimeRate = data.length > 0
    ? Math.round((data.filter((s) => s.status === "On Time").length / data.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container-custom py-8">

        {/* HEADER */}
        <TopHeader 
          title="Supplier Management" 
          subtitle="Manage suppliers, track orders, and monitor delivery performance"
        />

        {/* STATS */}
        <div className="stat-grid mb-10">
          <StatCard 
            title="Total Suppliers" 
            value={data.length} 
            description="Registered partners" 
            icon={Truck} 
            iconColor="#6366f1"
          />
          <StatCard 
            title="Active Procurement" 
            value={orders.length} 
            description="Recent supply orders" 
            icon={ShoppingCart} 
            iconColor="#3b82f6"
          />
          <StatCard 
            title="On-Time Rate" 
            value={`${onTimeRate}%`} 
            description="Delivery reliability" 
            icon={Timer} 
            iconColor="#10b981"
          />
          <StatCard 
            title="Inventory Value" 
            value="--" 
            description="Current stock value" 
            icon={PackagePlus} 
            iconColor="#f59e0b"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — SUPPLIERS LIST */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* SEARCH & ADD */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative flex-1 group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:border-indigo-500 focus:bg-white transition-all font-medium outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => { setEditId(null); setForm({ name: "", contact_email: "", contact_phone: "", location: "", rating: "", status: "On Time" }); setShowModal(true); }}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Add Supplier</span>
              </button>
            </div>

            {/* SUPPLIERS CARDS */}
            <div className="flex flex-col gap-4">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    {/* LEFT INFO */}
                    <div className="flex flex-col gap-2 min-w-0">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">{s.name}</h3>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-500 overflow-hidden">
                          <Mail size={14} className="text-slate-400 shrink-0" /> 
                          <span className="font-medium truncate">{s.contact_email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Phone size={14} className="text-slate-400 shrink-0" /> 
                          <span className="font-medium truncate">{s.contact_phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin size={14} className="text-slate-400 shrink-0" /> 
                          <span className="font-medium truncate">{s.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto">
                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={s.status === "On Time" ? "Active" : "Critical"} />
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                          <span className="font-bold">{s.rating}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(s)}
                          className="p-2 bg-slate-50 sm:bg-transparent hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-slate-100 sm:border-transparent hover:border-slate-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="p-2 bg-slate-50 sm:bg-transparent hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-rose-600 border border-slate-100 sm:border-transparent hover:border-slate-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-8 py-16 text-center">
                  <div className="text-4xl mb-3">🏭</div>
                  <p className="text-lg font-bold text-slate-300">No Suppliers Found</p>
                  <p className="text-sm text-slate-400 mt-1">Try a different search or add a new supplier.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL — RESTORED FOR PROCUREMENT */}
          <div className="flex flex-col gap-6">
            {/* RECENT ORDERS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Orders</h2>
                <button
                  onClick={() => navigate("/inventory/orders")}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View All <ExternalLink size={12} />
                </button>
              </div>

              <div className="flex flex-col">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="px-6 py-4 border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-slate-800">{o.order_id}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{o.product}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">
                          {o.quantity} units · {o.customer}
                        </p>
                      </div>
                      <StatusBadge status={o.inventory_status === "Available" ? "Active" : "Pending"} />
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="px-6 py-10 text-center text-sm text-slate-400 font-medium">
                    No recent orders
                  </div>
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/inventory/orders/new")}
                  className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PackagePlus size={16} />
                  Place New Order
                </button>
                <button
                  onClick={() => navigate("/inventory/orders")}
                  className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  <ExternalLink size={16} />
                  View All Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-8 duration-300">
            <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editId ? "Edit Supplier" : "Add Supplier"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
                <input placeholder="Supplier name" className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                <input placeholder="email@example.com" className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</label>
                <input placeholder="+91 XXXXX XXXXX" className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</label>
                <input placeholder="City, State" className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating</label>
                  <input type="number" placeholder="0-5" className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option>On Time</option>
                    <option>Delayed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button type="submit"
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
