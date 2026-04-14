import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, DollarSign, TrendingUp, Search, Plus, Eye, Trash2 } from 'lucide-react';
import API from '../../api/api';
import TopHeader from '../../components/TopHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    API.get('/customers')
      .then(res => setCustomers(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer profile? This will not delete their orders.')) return;
    try {
      await API.delete(`/customers/${id}`);
      fetchData();
    } catch {
      alert('Failed to delete customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);

  const tableHeaders = [
    { key: 'customer', label: 'Customer' },
    { key: 'contact', label: 'Contact Information' },
    { key: 'orders', label: 'Orders', align: 'center' },
    { key: 'ltv', label: 'Lifetime Value' },
    { key: 'actions', label: 'Actions', align: 'right' },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <TopHeader 
        title="Customers Directory"
        subtitle="Manage and monitor customer relationships and lifetime spend analytics"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Customers" 
          value={customers.length} 
          description="Active in database" 
          icon={Users} 
          iconColor="#3b82f6" 
        />
        <StatCard 
          title="Revenue Share" 
          value={`₹${totalSpent.toLocaleString('en-IN')}`} 
          description="Cumulative lifetime value" 
          icon={DollarSign} 
          iconColor="#10b981" 
        />
        <StatCard 
          title="Average LTV" 
          value={`₹${(totalSpent / (customers.length || 1)).toLocaleString('en-IN')}`} 
          description="Per unique customer" 
          icon={TrendingUp} 
          iconColor="#a855f7" 
        />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
          <div className="relative w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-100" 
              placeholder="Filter by name or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <DataTable 
          headers={tableHeaders}
          data={filteredCustomers}
          loading={loading}
          renderRow={(c) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-xs shadow-inner">
                    {c.name.charAt(0)}
                  </div>
                  <Link to={`/orders/customers/${c.id}`} className="font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                    {c.name}
                  </Link>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="text-sm font-medium text-gray-700">{c.email || '—'}</div>
                <div className="text-[11px] text-gray-400 font-semibold">{c.phone || '—'}</div>
              </td>
              <td className="px-6 py-5 text-center">
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black tracking-tight">
                  {c.order_count} ORDERS
                </span>
              </td>
              <td className="px-6 py-5 font-black text-gray-900">
                ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link 
                    to={`/orders/customers/${c.id}`} 
                    className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <Eye size={18} />
                  </Link>
                  <button 
                    onClick={() => handleDelete(c.id)} 
                    className="p-2 rounded-lg border border-gray-100 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
        
        {!loading && filteredCustomers.length === 0 && search && (
          <div className="px-6 py-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Search size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-800">No customers match your search</h3>
             <p className="text-slate-400 text-sm mt-1">Try searching for a different name or email address</p>
          </div>
        )}
      </div>
    </div>
  );
}
