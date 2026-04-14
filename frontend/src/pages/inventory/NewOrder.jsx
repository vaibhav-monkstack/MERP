import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import TopHeader from "../../components/TopHeader";
import { ArrowLeft, PackagePlus, AlertCircle } from "lucide-react";

export default function NewOrder() {
  const navigate = useNavigate();
  
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    supplier: "",
    material: "",
    quantity: "",
    delivery_date: new Date().toISOString().split('T')[0] // default today
  });

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoading(true);
        const [sRes, mRes] = await Promise.all([
          API.get("/suppliers"),
          API.get("/materials")
        ]);
        setSuppliers(sRes.data);
        setMaterials(mRes.data);
      } catch (err) {
        console.error("Error loading form dependencies:", err);
        setError("Could not load suppliers or materials data.");
      } finally {
        setLoading(false);
      }
    };
    loadFormData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier || !form.material || !form.quantity) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // Generate a Simple Order ID
      const orderId = `PO-${Math.floor(1000 + Math.random() * 9000)}`;

      await API.post("/inv-orders", {
        order_id: orderId,
        product: form.material,
        customer: form.supplier, // Maps to Supplier in DB table structure
        quantity: parseInt(form.quantity),
        delivery_date: form.delivery_date,
        inventory_status: "Pending"
      });

      navigate("/inventory/orders");
    } catch (err) {
      console.error("Failed to place order:", err);
      setError("An error occurred while saving the order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 font-bold animate-pulse">Initializing Procurement Form...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container-custom py-8">
        
        {/* BACK & HEADER */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate("/inventory/suppliers")}
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <TopHeader 
            title="Place Purchase Order" 
            subtitle="Request raw materials and components from authorized suppliers"
          />
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-sm border border-slate-100 p-10 flex flex-col gap-8 relative overflow-hidden">
            {/* ACCENT */}
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>

            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-50 p-2.5 rounded-2xl">
                <PackagePlus className="text-indigo-600" size={24} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Details</h2>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* SUPPLIER DROPDOWN */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Target Supplier</label>
              <select 
                value={form.supplier}
                onChange={(e) => setForm({...form, supplier: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option value="">Select a supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name} ({s.location})</option>)}
              </select>
            </div>

            {/* MATERIAL DROPDOWN */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Material / Component</label>
              <select 
                value={form.material}
                onChange={(e) => setForm({...form, material: e.target.value})}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option value="">Select material...</option>
                {materials.map(m => <option key={m.id} value={m.name}>{m.name} - Current: {m.quantity} units</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QUANTITY */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Quantity Required</label>
                <input 
                  type="number"
                  placeholder="Enter amount"
                  value={form.quantity}
                  onChange={(e) => setForm({...form, quantity: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                  min="1"
                />
              </div>

              {/* DATE */}
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Expected Delivery</label>
                <input 
                  type="date"
                  value={form.delivery_date}
                  onChange={(e) => setForm({...form, delivery_date: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-slate-600"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-4 pt-4">
              <button 
                type="button"
                onClick={() => navigate("/inventory/suppliers")}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-sm font-extrabold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Placing Order..." : "Confirm & Place Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
