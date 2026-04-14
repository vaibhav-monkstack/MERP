import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/api';
import TopHeader from '../../components/TopHeader';




function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-start">
      <div>
        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-2">{label}</div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-400 mt-2">{sub}</div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-${color}-50 text-${color}-600`}>{icon}</div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

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



  const totalSpent = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <TopHeader 
        title="Customers Directory"
        subtitle="Manage and monitor customer relationships and spend"
      />




      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Customers" value={customers.length} sub="Active in database" icon="👥" color="blue" />
        <StatCard label="Revenue Share" value={`₹${totalSpent.toLocaleString('en-IN')}`} sub="Cumulative lifetime value" icon="💰" color="green" />
        <StatCard label="Average LTV" value={`₹${(totalSpent / (customers.length || 1)).toLocaleString('en-IN')}`} sub="Per unique customer" icon="📈" color="purple" />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#f8f9fc] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Orders</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Lifetime Value</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading directory...</td></tr>
            ) : !customers.length ? (
              <tr>
                <td colSpan="5" className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-[#f8f9fc] rounded-full flex items-center justify-center text-gray-300 text-3xl mb-4">👤</div>
                    <h3 className="text-lg font-bold text-gray-900">No customer profiles found</h3>
                    <p className="text-gray-400 text-sm mt-1">Add your first customer to start tracking history</p>
                    <button className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                      + Add Customer
                    </button>
                  </div>
                </td>
              </tr>
            ) : customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">{c.name.charAt(0)}</div>
                    <Link to={`/orders/customers/${c.id}`} className="font-bold text-gray-900 hover:text-blue-600">{c.name}</Link>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-sm text-gray-700">{c.email || '—'}</div>
                  <div className="text-[11px] text-gray-400">{c.phone || '—'}</div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{c.order_count}</span>
                </td>
                <td className="px-6 py-5 font-bold text-gray-900">
                  ₹{Number(c.total_spent || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-5 text-right flex items-center justify-end gap-3">
                  <Link to={`/orders/customers/${c.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider underline">View Profile</Link>

                  <button onClick={() => handleDelete(c.id)} className="w-8 h-8 rounded-lg border border-red-50 text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors">🗑</button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
