import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, RotateCw, CheckCircle, Zap, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import API from '../../api/api';
import TopHeader from '../../components/TopHeader';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import { ORDER_STATUS, PRIORITY } from '../../utils/constants';

const STATUS_LIST = Object.entries(ORDER_STATUS).map(([key, value]) => ({
  label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  value: value
}));

export default function Orders() {
  const navigate                        = useNavigate();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterStatus !== 'all') params.status = filterStatus.toLowerCase();
    if (search) params.search = search;

    API.get('/orders', { params })
      .then(res => {
        setOrders(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async id => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await API.delete(`/orders/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await API.patch(`/orders/${id}/status`, { status: status.toLowerCase() });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = o => {
    navigate('/orders/new', { state: { editing: o } });
  };

  const tableHeaders = [
    { key: 'details', label: 'Order Details' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'total', label: 'Total', align: 'right' },
    { key: 'actions', label: 'Actions', align: 'right' },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 text-gray-900">
      <TopHeader 
        title="Order Overview"
        subtitle="Real-time tracking of manufacturing orders"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Orders" 
          value={orders.length} 
          description="Cataloged items" 
          icon={Package} 
          iconColor="#3b82f6" 
        />
        <StatCard 
          title="In Production" 
          value={orders.filter(o => o.status?.toLowerCase() === 'processing').length} 
          description="Processing now" 
          icon={RotateCw} 
          iconColor="#f97316" 
        />
        <StatCard 
          title="Delivered" 
          value={orders.filter(o => o.status?.toLowerCase() === 'delivered').length} 
          description="Lifetime completed" 
          icon={CheckCircle} 
          iconColor="#10b981" 
        />
        <StatCard 
          title="Urgent" 
          value={orders.filter(o => o.priority?.toLowerCase() === 'urgent').length} 
          description="Requires attention" 
          icon={Zap} 
          iconColor="#a855f7" 
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-100" 
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
              {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button 
              onClick={() => navigate('/orders/new')}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Plus size={18} /> New Order
            </button>
          </div>
        </div>

        <DataTable 
          headers={tableHeaders}
          data={orders}
          loading={loading}
          renderRow={(o) => (
            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-5">
                <div className="font-bold text-gray-900">{o.item_name}</div>
                <div className="text-[11px] text-gray-400 font-medium tracking-tighter">ORD-{String(o.id).padStart(3, '0')} • {new Date(o.created_at).toLocaleDateString()}</div>
              </td>
              <td className="px-6 py-5">
                <div className="text-sm font-bold text-gray-800">{o.customer_name || 'Walk-in'}</div>
                <div className="text-[10px] text-gray-400 font-medium">{o.email || 'No email'}</div>
              </td>
              <td className="px-6 py-5">
                <select 
                  value={o.status} 
                  onChange={e => handleStatusChange(o.id, e.target.value)}
                  className={`bg-transparent border-none text-[11px] font-black cursor-pointer focus:outline-none hover:text-indigo-600 transition-colors uppercase tracking-tight ${
                    o.status === 'ready_to_approve' ? 'text-emerald-500' : 
                    o.status === 'awaiting_materials' ? 'text-orange-500' : 'text-gray-600'
                  }`}
                >
                  {STATUS_LIST.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </td>
              <td className="px-6 py-5">
                <StatusBadge status={o.priority} />
              </td>
              <td className="px-6 py-5 text-right font-black text-gray-900">₹{(o.price * o.quantity).toLocaleString('en-IN')}</td>
              <td className="px-6 py-5 text-right">
                <div className="flex gap-2 justify-end items-center">
                  {/* Approval Gate Actions */}
                  {o.status === 'new' && (
                    <button 
                      onClick={() => handleStatusChange(o.id, 'awaiting_materials')}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                    >
                      Verify Stock
                    </button>
                  )}
                  {o.status === 'ready_to_approve' && (
                    <button 
                      onClick={() => handleStatusChange(o.id, 'confirmed')}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold uppercase hover:bg-green-600 hover:text-white transition-all border border-green-100 flex items-center gap-1 shadow-sm"
                    >
                      <Zap size={10} /> Approve Production
                    </button>
                  )}

                  <button onClick={() => openEdit(o)} className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(o.id)} className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
