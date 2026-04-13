import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await API.get("/inv-orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders.filter(
    (o) =>
      o.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      o.product?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Orders</h1>
          <p className="text-gray-500 text-sm">All purchase orders placed with suppliers</p>
        </div>
        <button
          onClick={() => navigate("/inventory/orders/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
        >
          + Place New Order
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <input
          type="text"
          placeholder="Search by Order ID, Product or Supplier..."
          className="border p-2 rounded w-full md:w-1/2"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="bg-white p-10 rounded-xl shadow text-center text-gray-400">
          Loading orders...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">
          📦 No orders found. <button onClick={() => navigate("/inventory/orders/new")} className="text-blue-600 underline ml-1">Place one now</button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="p-3">Order ID</th>
                <th>Product</th>
                <th>Supplier</th>
                <th>Quantity</th>
                <th>Delivery Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm text-blue-700">{o.order_id}</td>
                  <td>{o.product}</td>
                  <td>{o.customer}</td>
                  <td>{o.quantity}</td>
                  <td className="text-sm text-gray-500">
                    {o.delivery_date
                      ? new Date(o.delivery_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        o.inventory_status === "Available"
                          ? "bg-green-100 text-green-600"
                          : o.inventory_status === "Pending"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.inventory_status || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
