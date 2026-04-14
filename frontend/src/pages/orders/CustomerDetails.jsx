import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/api';
import TopHeader from '../../components/TopHeader';




function StatusBadge({ status }) {
  const map = {
    pending:    'bg-yellow-50 text-yellow-700 border-yellow-100',
    processing: 'bg-blue-50   text-blue-700   border-blue-100',
    shipped:    'bg-purple-50 text-purple-700 border-purple-100',
    delivered:  'bg-green-50  text-green-700  border-green-100',
    cancelled:  'bg-red-50    text-red-700    border-red-100',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || 'bg-gray-50 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function CustomerDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/customers/${id}`)
      .then(res => setData(res.data.data))

      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-20 text-center text-gray-400">Loading profile...</div>;
  if (!data) return <div className="p-20 text-center text-red-500">Customer not found</div>;

  const totalSpent = data.orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <TopHeader 
        title={data ? data.name : 'Customer Details'}
        subtitle="Detailed view of customer history and spend analytics"
      />

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-24">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-3xl mb-4 shadow-inner">{data.name.charAt(0)}</div>
              <h2 className="text-2xl font-bold text-gray-900">{data.name}</h2>
              <p className="text-gray-400 text-sm">Customer Since {new Date(data.created_at).toLocaleDateString()}</p>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-50">
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Email Address</div>
                <div className="text-sm text-gray-900 font-medium">{data.email || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Phone Number</div>
                <div className="text-sm text-gray-900 font-medium">{data.phone || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Billing Address</div>
                <div className="text-sm text-gray-900 font-medium leading-relaxed">{data.address || '—'}</div>
              </div>
            </div>

            <div className="mt-8 bg-[#f8f9fc] rounded-2xl p-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{data.orders.length}</div>
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Orders</div>
              </div>
              <div className="text-center border-l border-gray-200">
                <div className="text-xl font-bold text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</div>
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">LTV</div>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Order History</h3>
            
            {!data.orders.length ? (
              <div className="text-center py-20 text-gray-400">No orders placed yet.</div>
            ) : (
              <div className="space-y-4">
                {data.orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-white transition-colors">📦</div>
                      <div>
                        <div className="font-bold text-gray-900">{o.item_name}</div>
                        <div className="text-[11px] text-gray-400">ORD-{String(o.id).padStart(3, '0')} • {new Date(o.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="text-right">
                         <div className="font-bold text-gray-900">₹{(o.price * o.quantity).toLocaleString('en-IN')}</div>
                         <div className="text-[10px] text-gray-400 font-medium">{o.quantity} unit{o.quantity > 1 ? 's' : ''}</div>
                       </div>
                       <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
