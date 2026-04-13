import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function NewOrder() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [form, setForm] = useState({
    supplier_id: "",
    material_id: "",
    quantity: "",
  });

  // ✅ FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supRes = await API.get("/suppliers");
        setSuppliers(supRes.data);

        const matRes = await API.get("/materials");
        setMaterials(matRes.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, []);

  // ✅ SUBMIT ORDER
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔥 FIX: use Number() + ===
    const selectedSupplier = suppliers.find(
      (s) => s.id === Number(form.supplier_id)
    );

    const selectedMaterial = materials.find(
      (m) => m.id === Number(form.material_id)
    );

    if (!selectedSupplier || !selectedMaterial) {
      alert("Please select supplier and material");
      return;
    }

    const payload = {
      order_id: `PO-${Date.now()}`,
      product: selectedMaterial.name,
      customer: selectedSupplier.name,
      quantity: Number(form.quantity),
      delivery_date: new Date().toISOString().split("T")[0],
      inventory_status: "Available",
    };

    console.log("Sending:", payload);

    try {
      await API.post("/inv-orders", payload);

      alert("Order placed successfully");

      // ✅ Update supplier active orders
      await API.put(`/suppliers/${selectedSupplier.id}`, {
        ...selectedSupplier,
        active_orders: (selectedSupplier.active_orders || 0) + 1,
      });

      navigate("/suppliers");
    } catch (err) {
      console.error("Order error:", err.response?.data || err.message);
      alert("Error placing order");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg border">

        <h2 className="text-xl font-semibold mb-4">
          Place New Order
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* SUPPLIER */}
          <div>
            <label className="text-sm text-gray-600">Supplier</label>
            <select
              className="border p-2 rounded w-full"
              value={form.supplier_id}
              onChange={(e) =>
                setForm({ ...form, supplier_id: e.target.value })
              }
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* MATERIAL */}
          <div>
            <label className="text-sm text-gray-600">Material</label>
            <select
              className="border p-2 rounded w-full"
              value={form.material_id}
              onChange={(e) =>
                setForm({ ...form, material_id: e.target.value })
              }
            >
              <option value="">Select Material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* QUANTITY */}
          <div>
            <label className="text-sm text-gray-600">Quantity</label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: e.target.value })
              }
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-2 mt-4">

            <button
              type="button"
              onClick={() => navigate("/suppliers")}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>

            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Place Order
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

