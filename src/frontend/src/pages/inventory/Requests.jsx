import { useEffect, useState } from "react";
import API from "../../api/api";
import toast from "react-hot-toast";
import TopHeader from "../../components/TopHeader";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/common/DataTable";
import StatusBadge from "../../components/common/StatusBadge";
import RequestForm from "./RequestForm";
import { ClipboardList, Clock, CheckCircle, Loader, Search, CheckCheck, XCircle } from "lucide-react";

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

  // COUNTS
  const safeData = Array.isArray(data) ? data : [];
  const total = safeData.length;
  const pending = safeData.filter(r => r.status === "Pending").length;
  const approved = safeData.filter(r => r.status === "Approved").length;
  const inProgress = safeData.filter(r => r.status === "In Progress").length;

  // SELECT
  const handleSelect = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // UPDATE SINGLE
  const update = async (id, status) => {
    try {
      const res = await API.put(`/requests/${id}`, { status });
      
      // ✅ Check for validation errors from backend
      if (!res.data.success && res.data.error) {
        toast.error(res.data.error);
        return;
      }
      
      if (status === 'Approved') {
        toast.success(res.data.message || 'Request approved successfully');
      } else if (status === 'Rejected') {
        toast.error(res.data.message || 'Request rejected');
      } else {
        toast(res.data.message);
      }
      fetchData();
    } catch (err) {
      // ✅ Show backend error message if available
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update request';
      toast.error(errorMsg);
      console.error('Update error:', err);
    }
  };

  // BULK UPDATE
  const bulkUpdate = async (status) => {
    try {
      for (let id of selected) {
        const res = await API.put(`/requests/${id}`, { status });
        
        // ✅ Check for errors on each request
        if (!res.data.success && res.data.error) {
          toast.error(`Request #${id}: ${res.data.error}`);
        }
      }
      if (status === 'Approved') {
        toast.success(`${selected.length} request(s) processed`);
      } else {
        toast.error(`${selected.length} request(s) rejected`);
      }
      setSelected([]);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Bulk update failed';
      toast.error(errorMsg);
      console.error('Bulk update error:', err);
    }
  };

  // FILTER + SEARCH
  const filtered = safeData
    .filter(r => {
      if (filter === "Pending")     return r.status === "Pending";
      if (filter === "Approved")    return r.status === "Approved";
      if (filter === "Rejected")    return r.status === "Rejected";
      if (filter === "In Progress") return r.status === "In Progress";
      return true;
    })
    .filter(r =>
      r.material && r.material.toLowerCase().includes(search.toLowerCase())
    );

  const tableHeaders = [
    { key: 'checkbox', label: '', sortable: false },
    { key: 'request_id', label: 'ID', sortable: false },
    { key: 'source', label: 'Reference', sortable: false },
    { key: 'material', label: 'Material', sortable: false },
    { key: 'quantity', label: 'Qty', sortable: false },
    { key: 'requested_by', label: 'Requested By', sortable: false },
    { key: 'date', label: 'Date', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false, align: 'right' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container-custom py-8">

        {/* HEADER */}
        <TopHeader 
          title="Material Requests" 
          subtitle="Manage and track all material requisitions"
        />

        {/* REQUEST FORM */}
        <RequestForm fetchData={fetchData} />

        {/* STATS */}
        <div className="stat-grid mb-10">
          <StatCard 
            title="Total Requests" 
            value={total} 
            description="Lifetime requests" 
            icon={ClipboardList} 
            iconColor="#6366f1"
          />
          <StatCard 
            title="Pending" 
            value={pending} 
            description="Awaiting review" 
            icon={Clock} 
            iconColor="#f59e0b"
          />
          <StatCard 
            title="Approved" 
            value={approved} 
            description="Ready to fulfill" 
            icon={CheckCircle} 
            iconColor="#10b981"
          />
          <StatCard 
            title="In Progress" 
            value={inProgress} 
            description="Being processed" 
            icon={Loader} 
            iconColor="#3b82f6"
          />
        </div>

        {/* MAIN CONTENT CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Request Queue</h2>
              {selected.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400">{selected.length} selected</span>
                  <button
                    onClick={() => bulkUpdate("Approved")}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-all"
                  >
                    <CheckCheck size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => bulkUpdate("Rejected")}
                    className="flex items-center gap-1.5 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-rose-700 transition-all"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              )}
            </div>

            {/* SEARCH */}
            <div className="controls-responsive">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by material name..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="bg-slate-50 border-none rounded-2xl text-sm py-3 px-4 font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          {/* EMPTY STATE */}
          {data.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-lg font-bold text-slate-300">No Requests Yet</p>
              <p className="text-sm text-slate-400 mt-1">Use the form above to create your first request.</p>
            </div>
          ) : (
            <DataTable
              headers={tableHeaders}
              data={filtered}
              renderRow={(r) => (
                <tr key={r.id} data-testid={`request-row-${r.job_id}`} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-none">
                  <td className="px-6 py-5">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => handleSelect(r.id)}
                      className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-5 text-xs font-black text-slate-400 font-mono">{r.request_id}</td>
                  <td className="px-6 py-5">
                    {r.order_id ? (
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-black uppercase">Order #{r.order_id}</span>
                    ) : r.job_id ? (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-black uppercase">Job {r.job_id.split('-').pop()}</span>
                    ) : (
                      <span className="text-slate-300 text-[10px] font-bold italic tracking-widest">NO REF</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-900">{r.material}</td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-600">{r.quantity}</td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-500">{r.requested_by}</td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-400">
                    {new Date(r.requested_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                        <button
                          onClick={() => update(r.id, "Approved")}
                          className="p-2 hover:bg-emerald-50 hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-emerald-600 border border-transparent hover:border-emerald-100"
                          title="Approve"
                          data-testid="approve-request-btn"
                        >
                        <CheckCircle size={16} />
                      </button>
                        <button
                          onClick={() => update(r.id, "Rejected")}
                          className="p-2 hover:bg-rose-50 hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100"
                          title="Reject"
                          data-testid="reject-request-btn"
                        >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
