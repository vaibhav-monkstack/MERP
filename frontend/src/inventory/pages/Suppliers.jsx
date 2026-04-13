import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import {
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";

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

  // ✅ FETCH DATA
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

  // ✅ SUBMIT
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

  // ✅ EDIT
  const handleEdit = (s) => {
    setForm(s);
    setEditId(s.id);
    setShowModal(true);
  };

  // ✅ DELETE
  const handleDelete = async (id) => {
    if (window.confirm("Delete supplier?")) {
      await API.delete(`/suppliers/${id}`);
      fetchData();
    }
  };

  // ✅ FILTER
  const filtered = data.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex gap-6">

      {/* LEFT SECTION */}
      <div className="w-2/3">

        {/* 🔥 TOP CARDS */}
        <div className="grid grid-cols-3 gap-4 mb-6">

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-gray-500 text-sm">Total Suppliers</p>
            <h2 className="text-xl font-semibold">{data.length}</h2>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-gray-500 text-sm">Active Orders</p>
            <h2 className="text-xl font-semibold">
              {data.reduce((sum, s) => sum + (s.active_orders || 0), 0)}
            </h2>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <p className="text-gray-500 text-sm">On-Time Rate</p>
            <h2 className="text-xl font-semibold">
              {data.length > 0
                ? Math.round(
                    (data.filter((s) => s.status === "On Time").length /
                      data.length) *
                      100
                  )
                : 0}
              %
            </h2>
          </div>

        </div>

        {/* HEADER */}
        <div className="bg-white p-4 rounded-lg border flex justify-between mb-4">
          <input
            type="text"
            placeholder="Search suppliers..."
            className="border p-2 rounded w-1/2"
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            + Add Supplier
          </button>
        </div>

        {/* SUPPLIERS LIST */}
        <div className="flex flex-col gap-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-lg border flex justify-between"
            >

              {/* LEFT INFO */}
              <div>
                <h2 className="font-semibold">{s.name}</h2>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaEnvelope /> {s.contact_email}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaPhone /> {s.contact_phone}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaMapMarkerAlt /> {s.location}
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex flex-col items-end gap-2">

                <span
                  className={`px-2 py-1 text-xs rounded ${
                    s.status === "On Time"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {s.status}
                </span>

                <p className="text-sm text-gray-500">
                  Rating: {s.rating}
                </p>

                <div className="flex gap-3 text-gray-500">
                  <button onClick={() => handleEdit(s)}>
                    <FaEdit  />
                  </button>

                  <button onClick={() => handleDelete(s.id)}>
                    <FaTrash className="hover:text-red-600" />
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/3">

        {/* 🔥 RECENT ORDERS */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Recent Orders</h2>

            <button
              onClick={() => navigate("/inventory/orders")}
              className="text-blue-600 text-sm hover:underline"
            >
              View All
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{o.order_id}</p>
                  <p className="text-sm text-gray-600">{o.product}</p>
                  <p className="text-sm text-gray-400">
                    {o.quantity} units
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(o.delivery_date).toDateString()}
                  </p>
                </div>

                <span
                  className={`px-2 py-1 text-xs rounded ${
                    o.inventory_status === "Available"
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {o.inventory_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white p-4 rounded-lg border mt-4">
          <h2 className="font-semibold mb-2">Quick Actions</h2>

          <button
            onClick={() => navigate("/inventory/orders/new")}
            className="bg-gray-200 hover:bg-blue-700 hover:text-white p-2 rounded w-full mb-2"
          >
            Place New Order
          </button>

          <button
            onClick={() => navigate("/inventory/orders")}
            className="border bg-gray-200 hover:bg-blue-700 hover:text-white p-2 rounded w-full"
          >
            View All Orders
          </button>
        </div>

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">

          <div className="bg-white p-6 rounded-lg w-96">

            <h2 className="text-lg font-semibold mb-4">
              {editId ? "Edit Supplier" : "Add Supplier"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

              <input placeholder="Name" className="border p-2 rounded"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <input placeholder="Email" className="border p-2 rounded"
                value={form.contact_email}
                onChange={(e) =>
                  setForm({ ...form, contact_email: e.target.value })
                }
              />

              <input placeholder="Phone" className="border p-2 rounded"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({ ...form, contact_phone: e.target.value })
                }
              />

              <input placeholder="Location" className="border p-2 rounded"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
              />

              <input type="number" placeholder="Rating" className="border p-2 rounded"
                value={form.rating}
                onChange={(e) =>
                  setForm({ ...form, rating: e.target.value })
                }
              />

              <select className="border p-2 rounded"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option>On Time</option>
                <option>Delayed</option>
              </select>

              <div className="flex justify-end gap-2">
                <button type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-3 py-1 rounded"
                >
                  Cancel
                </button>

                <button className="bg-blue-600 text-white px-3 py-1 rounded">
                  Save
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}