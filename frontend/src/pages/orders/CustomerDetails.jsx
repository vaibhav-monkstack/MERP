import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, User, Mail, Phone, MapPin, CreditCard, Calendar, ArrowLeft, Clock } from 'lucide-react';
import API from '../../api/api';
import TopHeader from '../../components/TopHeader';
import StatusBadge from '../../components/common/StatusBadge';

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

  if (loading) return (
    <div className="max-w-screen-xl mx-auto px-6 py-20 text-center text-slate-400">
      <div className="animate-spin mb-4 inline-block">⏳</div>
      <p className="font-bold">Syncing customer profile...</p>
    </div>
  );
  
  if (!data) return (
    <div className="max-w-screen-xl mx-auto px-6 py-20 text-center text-rose-500 font-bold underline">
      Customer profile not found in directory.
    </div>
  );

  const totalSpent = data.orders.reduce((sum, o) => sum + (o.price * o.quantity), 0);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link to="/orders/customers" className="text-indigo-600 hover:text-indigo-800 text-sm font-bold flex items-center gap-2 transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Directory
        </Link>
      </div>

      <TopHeader 
        title={data.name}
        subtitle="Global customer view, historical spending, and manufacturing order track"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Profile Insight */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 sticky top-24">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-4xl mb-4 shadow-inner border-4 border-white">
                {data.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{data.name}</h2>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
                <Calendar size={12} /> Joined {new Date(data.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-slate-50">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Primary Email</div>
                  <div className="text-sm text-slate-900 font-bold">{data.email || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Mobile Contact</div>
                  <div className="text-sm text-slate-900 font-bold">{data.phone || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Shipping/Billing Address</div>
                  <div className="text-sm text-slate-900 font-medium leading-relaxed">{data.address || '—'}</div>
                </div>
              </div>
            </div>

            <div className="mt-10 bg-indigo-600 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-lg shadow-indigo-100">
              <div className="text-center text-white border-r border-indigo-500/50">
                <div className="text-2xl font-black">{data.orders.length}</div>
                <div className="text-[9px] font-black uppercase tracking-tighter opacity-70">Jobs Placed</div>
              </div>
              <div className="text-center text-white">
                <div className="text-2xl font-black">₹{totalSpent.toLocaleString('en-IN')}</div>
                <div className="text-[9px] font-black uppercase tracking-tighter opacity-70">Lifetime Value</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Historical Ledger */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 min-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <CreditCard className="text-indigo-600" size={20} /> Manufacturing Ledger
              </h3>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {data.orders.length} events
              </div>
            </div>
            
            {!data.orders.length ? (
              <div className="text-center py-20 text-slate-300 flex flex-col items-center">
                 <Package size={48} className="mb-4 opacity-20" />
                 <p className="font-bold">No historical data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.orders.map(o => (
                  <div key={o.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[24px] border border-slate-50 hover:border-indigo-100 hover:bg-slate-50/50 transition-all group gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 group-hover:bg-white transition-colors shadow-sm">
                        <Package size={22} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base">{o.item_name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                          <span className="text-indigo-600">ORD-{String(o.id).padStart(3, '0')}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {new Date(o.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 sm:gap-10 mt-2 sm:mt-0">
                       <div className="text-left sm:text-right">
                         <div className="font-black text-slate-900 text-lg">₹{(o.price * o.quantity).toLocaleString('en-IN')}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{o.quantity} UNIT{o.quantity > 1 ? 'S' : ''}</div>
                       </div>
                       <StatusBadge status={o.status || 'pending'} />
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
