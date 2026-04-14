import { useEffect, useState } from "react";
import API from "../../api/api";
import { Send, ChevronDown } from "lucide-react";

export default function RequestForm({ fetchData }) {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  const [form, setForm] = useState({
    job_id: "",
    material: "",
    quantity: "",
    requested_by: ""
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    const res = await API.get("/materials");
    setMaterials(res.data);
  };

  // 🔥 HANDLE MATERIAL SELECT
  const handleMaterialChange = (e) => {
    const selected = materials.find(m => m.name === e.target.value);
    setSelectedMaterial(selected);

    setForm({
      ...form,
      material: e.target.value
    });
  };

  // 🔥 SUBMIT WITH VALIDATION
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMaterial) {
      return alert("Select material");
    }

    if (form.quantity > selectedMaterial.quantity) {
      return alert("❌ Not enough stock available");
    }

    await API.post("/requests", form);

    alert("✅ Request Created");

    setForm({
      job_id: "",
      material: "",
      quantity: "",
      requested_by: ""
    });

    setSelectedMaterial(null);
    fetchData();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-8">

      <h2 className="text-lg font-black text-slate-900 tracking-tight mb-6">Create New Request</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Job ID</label>
          <input
            placeholder="e.g. JOB-001"
            value={form.job_id}
            onChange={(e) => setForm({...form, job_id: e.target.value})}
            className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>

        {/* DROPDOWN */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Material</label>
          <div className="relative">
            <select
              value={form.material}
              onChange={handleMaterialChange}
              className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 pr-10 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
              required
            >
              <option value="">Select Material</option>
              {materials.map(m => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* SHOW AVAILABLE STOCK */}
          {selectedMaterial && (
            <p className="text-[11px] font-bold text-indigo-500 mt-0.5">
              Available: {selectedMaterial.quantity} units
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quantity</label>
          <input
            type="number"
            placeholder="0"
            value={form.quantity}
            onChange={(e) => setForm({...form, quantity: e.target.value})}
            className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requested By</label>
          <input
            placeholder="Your name"
            value={form.requested_by}
            onChange={(e) => setForm({...form, requested_by: e.target.value})}
            className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>

        <button 
          type="submit"
          className="lg:col-span-4 md:col-span-2 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Send size={16} />
          Submit Request
        </button>

      </form>

    </div>
  );
}
