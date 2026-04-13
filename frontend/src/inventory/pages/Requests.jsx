import { useEffect, useState } from "react";
import API from "../api/api";
import { FaCheck, FaTimes } from "react-icons/fa";
import RequestForm from "./RequestForm";

export default function Requests() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get("/requests");
      const requestsData = res.data.data || res.data;
      setData(Array.isArray(requestsData) ? requestsData : []);
    } catch (err) {
      console.error("Requests error:", err);
      setData([]);
    }
  };

  // 🔥 COUNTS
  const safeData = Array.isArray(data) ? data : [];
  const total = safeData.length;
  const pending = safeData.filter(r => r.status === "Pending").length;
  const approved = safeData.filter(r => r.status === "Approved").length;
  const inProgress = safeData.filter(r => r.status === "In Progress").length;

  // 🔥 SELECT
  const handleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // 🔥 UPDATE SINGLE
  const update = async (id, status) => {
    const res = await API.put(`/requests/${id}`, { status });
    alert(res.data.message);
    fetchData();
  };

  // 🔥 BULK UPDATE
  const bulkUpdate = async (status) => {
    for (let id of selected) {
      await API.put(`/requests/${id}`, { status });
    }
    alert(`${status} Done`);
    setSelected([]);
    fetchData();
  };

  // 🔍 FILTER + SEARCH
  const filtered = safeData
    .filter(r => {
      if (filter === "Pending") return r.status === "Pending";
      if (filter === "Approved") return r.status === "Approved";
      if (filter === "In Progress") return r.status === "In Progress";
      return true;
    })
    .filter(r =>
      r.material && r.material.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* 🔥 REQUEST FORM */}
      <RequestForm fetchData={fetchData} />

      <h1 className="text-2xl font-bold mb-4">Material Requests</h1>

      {/* 🔥 CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">

        <div onClick={()=>setFilter("All")}
          className="bg-white p-4 rounded-xl shadow cursor-pointer">
          <p>Total</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>

        <div onClick={()=>setFilter("Pending")}
          className="bg-white p-4 rounded-xl shadow cursor-pointer">
          <p>Pending</p>
          <h2 className="text-2xl font-bold text-yellow-500">{pending}</h2>
        </div>

        <div onClick={()=>setFilter("Approved")}
          className="bg-white p-4 rounded-xl shadow cursor-pointer">
          <p>Approved</p>
          <h2 className="text-2xl font-bold text-green-500">{approved}</h2>
        </div>

        <div onClick={()=>setFilter("In Progress")}
          className="bg-white p-4 rounded-xl shadow cursor-pointer">
          <p>In Progress</p>
          <h2 className="text-2xl font-bold text-blue-500">{inProgress}</h2>
        </div>

      </div>

      {/* 🔥 SHOW ACTION BAR ONLY IF DATA EXISTS */}
      {data.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow mb-4 flex justify-between">

          <div className="flex gap-2">
            <button
              onClick={() => bulkUpdate("Approved")}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Approve Selected
            </button>

            <button
              onClick={() => bulkUpdate("Rejected")}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Reject Selected
            </button>
          </div>

          <input
            type="text"
            placeholder="Search requests..."
            className="border p-2 rounded"
            onChange={(e)=>setSearch(e.target.value)}
          />

        </div>
      )}

      {/* 🔥 EMPTY STATE */}
      {data.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">
          🚫 No Requests Yet
        </div>
      ) : (

        <div className="bg-white rounded-xl shadow overflow-hidden">

          <table className="w-full text-left">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3"></th>
                <th>Request ID</th>
                <th>Job ID</th>
                <th>Material</th>
                <th>Quantity</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">

                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => handleSelect(r.id)}
                    />
                  </td>

                  <td>{r.request_id}</td>
                  <td>{r.job_id}</td>
                  <td>{r.material}</td>
                  <td>{r.quantity}</td>
                  <td>{r.requested_by}</td>

                  <td>
                    {new Date(r.requested_at).toLocaleDateString()}
                  </td>

                  <td>
                    <span className={`px-2 py-1 rounded text-sm ${
                      r.status === "Approved"
                        ? "bg-green-100 text-green-600"
                        : r.status === "Rejected"
                        ? "bg-red-100 text-red-600"
                        : r.status === "In Progress"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}>
                      {r.status}
                    </span>
                  </td>

                  <td className="flex gap-2 p-2">

                    <button
                      onClick={()=>update(r.id, "Approved")}
                      className="bg-green-500 text-white p-2 rounded"
                    >
                      <FaCheck size={12} />
                    </button>

                    <button
                      onClick={()=>update(r.id, "Rejected")}
                      className="bg-red-500 text-white p-2 rounded"
                    >
                      <FaTimes size={12} />
                    </button>

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