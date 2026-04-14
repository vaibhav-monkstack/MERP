import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/api';
import TopHeader from '../../components/TopHeader';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

function StatusBadge({ status }) {
  const map = {
    pending:    'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100   text-blue-800',
    shipped:    'bg-purple-100 text-purple-800',
    delivered:  'bg-green-100  text-green-800',
    cancelled:  'bg-red-100    text-red-800',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    urgent: 'bg-red-50 text-red-700 border-red-100',
    high:   'bg-gray-900 text-white border-transparent',
    medium: 'bg-gray-50 text-gray-700 border-gray-200',
    low:    'bg-green-50 text-green-700 border-green-100',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${map[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority}
    </span>
  );
}

function StatCard({ label, value, sub, icon, bg }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-start">
      <div>
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">{label}</div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-400 mt-2">{sub}</div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bg}`}>{icon}</div>
    </div>
  );
}

export default function Orders() {
  const navigate                        = useNavigate();
  const [orders, setOrders]             = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterStatus !== 'all') params.status = filterStatus;
    if (search) params.search = search;

    Promise.all([
      API.get('/orders', { params }),
      API.get('/customers')
    ]).then(([ordersRes, customersRes]) => {
      setOrders(ordersRes.data.data);
      setCustomers(customersRes.data.data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [search, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this order?')) return;
    await API.delete(`/orders/${id}`);
    fetchData();
  };

  const handleStatusChange = async (id, status) => {
    await API.patch(`/orders/${id}/status`, { status });
    fetchData();
  };

  const openEdit = o => {
    navigate('/orders/new', { state: { editing: o } });
  };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 text-gray-900">
      <TopHeader 
        title="Order Overview"
        subtitle="Real-time tracking of manufacturing orders"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Orders" value={orders.length} sub="Cataloged items" icon="📦" bg="bg-blue-50 text-blue-600" />
        <StatCard label="In Production" value={orders.filter(o => o.status === 'processing').length} sub="Processing now" icon="🔄" bg="bg-orange-50 text-orange-600" />
        <StatCard label="Delivered" value={orders.filter(o => o.status === 'delivered').length} sub="Lifetime completed" icon="✅" bg="bg-green-50 text-green-600" />
        <StatCard label="Urgent" value={orders.filter(o => o.priority === 'urgent').length} sub="Requires attention" icon="⚡" bg="bg-purple-50 text-purple-600" />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
          <div className="relative w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-100" 
              placeholder="Search by product, customer..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <select 
              className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-semibold text-gray-600 focus:outline-none"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button 
              onClick={() => navigate('/orders/new')}
              className="bg-[#0f1021] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#1e204a] transition-all focus:ring-2 focus:ring-blue-500/50"
            >
              <span>+</span> New Order
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f8f9fc]">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Order Details</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="py-20 text-center text-gray-400">Loading production queue...</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-5">
                    <div className="font-bold text-gray-900">{o.item_name}</div>
                    <div className="text-[11px] text-gray-400 font-medium">ORD-{String(o.id).padStart(3, '0')} • {new Date(o.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-gray-700">{o.linked_customer_name || o.customer_name || 'Walk-in'}</div>
                    <div className="text-[10px] text-gray-400">{o.linked_customer_email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <select 
                      value={o.status} 
                      onChange={e => handleStatusChange(o.id, e.target.value)}
                      className="bg-transparent border-none text-xs font-bold cursor-pointer focus:outline-none"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-5"><PriorityBadge priority={o.priority} /></td>
                  <td className="px-6 py-5 text-right font-bold text-gray-900">₹{(o.price * o.quantity).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-5 text-right flex gap-2 justify-end">
                    <button onClick={() => openEdit(o)} className="w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-white">✏️</button>
                    <button onClick={() => handleDelete(o.id)} className="w-8 h-8 rounded-lg border flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-white">🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
