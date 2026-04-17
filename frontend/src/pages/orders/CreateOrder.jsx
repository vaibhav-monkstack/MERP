import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Package, Layers, Hash, DollarSign, AlertTriangle, Save, X, Info, Calendar } from 'lucide-react';
import API from '../../api/api';
import TopHeader from '../../components/TopHeader';
import FormLayout from '../../components/common/FormLayout';
import { ORDER_STATUS, PRIORITY } from '../../utils/constants';

const PRIORITIES = Object.values(PRIORITY);
const STATUSES = Object.values(ORDER_STATUS);
const SHIPPING_METHODS = ['Standard Delivery', 'Express Shipping', 'Self-Pickup', 'Factory Delivery'];

const InputField = ({ label, icon: Icon, placeholder, value, onChange, type = "text", required = false }) => (
  <div className="flex-1 min-w-[200px]">
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label} {required && '*'}</label>
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
        {Icon && <Icon size={16} />}
      </span>
      <input 
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm hover:border-slate-200"
      />
    </div>
  </div>
);

export default function CreateOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingOrder = location.state?.editing;
  
  const [customers, setCustomers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    item_name: '',
    date: new Date().toISOString().split('T')[0],
    quantity: 1,
    price: '',
    priority: 'Medium',
    status: 'New',
    shipping_method: 'Standard Delivery',
    deadline: '',
    remarks: ''
  });

  useEffect(() => {
    API.get('/customers').then(res => setCustomers(res.data.data)).catch(console.error);
    API.get('/templates').then(res => setTemplates(res.data.data)).catch(console.error);
    
    if (editingOrder) {
      setForm({
        ...editingOrder,
        date: editingOrder.created_at ? new Date(editingOrder.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        priority: editingOrder.priority?.charAt(0).toUpperCase() + editingOrder.priority?.slice(1) || 'Medium',
        status: editingOrder.status?.charAt(0).toUpperCase() + editingOrder.status?.slice(1) || 'New',
        deadline: editingOrder.deadline ? new Date(editingOrder.deadline).toISOString().split('T')[0] : ''
      });
    }
  }, [editingOrder]);

  const handleCustomerSelect = (e) => {
    const cid = e.target.value;
    if (cid) {
      const c = customers.find(x => x.id === parseInt(cid));
      setForm({ ...form, customer_id: cid, customer_name: c.name, email: c.email, phone: c.phone, address: c.address });
    } else {
      setForm({ ...form, customer_id: '', customer_name: '', email: '', phone: '', address: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        priority: form.priority.toLowerCase(),
        status: form.status.toLowerCase()
      };
      
      if (editingOrder) {
        await API.put(`/orders/${editingOrder.id}`, payload);
      } else {
        await API.post('/orders', payload);
      }
      navigate('/orders');
    } catch (err) {
      alert('Error saving order: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <TopHeader 
        title={editingOrder ? "Edit Order" : "Create New Order"}
        subtitle="Manage manufacturing jobs and customer delivery schedules"
        extraActions={
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => navigate('/orders')}
              className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 transition-all flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <button 
              type="submit" 
              form="orderForm"
              disabled={saving}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Order'}
            </button>
          </div>
        }
      />

      <form id="orderForm" onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Customer Selection Card */}
          <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="text-indigo-600" size={18} />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Customer Information</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Existing Customer (Option)</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm" 
                  onChange={handleCustomerSelect} 
                  value={form.customer_id}
                >
                  <option value="">Manual Entry / Walk-in</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <InputField 
                label="Full Name" 
                icon={User} 
                placeholder="e.g. Michael Corleone" 
                required 
                value={form.customer_name} 
                onChange={e => setForm({...form, customer_name: e.target.value})} 
              />

              <div className="flex flex-col md:flex-row gap-6">
                <InputField 
                  label="Email" 
                  icon={Mail} 
                  type="email" 
                  placeholder="michael@vito.com" 
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                />
                <InputField 
                  label="Mobile Phone" 
                  icon={Phone} 
                  placeholder="+1 234 567 890" 
                  value={form.phone} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Delivery Address</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-4 text-gray-400" size={16} />
                  <textarea 
                    rows="3" 
                    placeholder="Street address, city, and zip code..."
                    value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Product Info Card */}
          <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-indigo-600" size={18} />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Product Details</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Item Name / Product Template *</label>
                <div className="relative group">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  <select 
                    required
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm hover:border-slate-200 cursor-pointer"
                    value={form.item_name}
                    onChange={e => setForm({...form, item_name: e.target.value})}
                  >
                    <option value="">Select a Product Template</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Order Date" 
                  icon={Calendar} 
                  type="date" 
                  required 
                  value={form.date} 
                  onChange={e => setForm({...form, date: e.target.value})} 
                />
                <InputField 
                  label="Production Deadline" 
                  icon={Calendar} 
                  type="date" 
                  required 
                  value={form.deadline} 
                  onChange={e => setForm({...form, deadline: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Quantity" 
                  icon={Hash} 
                  type="number" 
                  placeholder="1" 
                  required 
                  value={form.quantity} 
                  onChange={e => setForm({...form, quantity: e.target.value})} 
                />
                <InputField 
                  label="Unit Price (₹)" 
                  icon={DollarSign} 
                  type="number" 
                  placeholder="0.00" 
                  required 
                  value={form.price} 
                  onChange={e => setForm({...form, price: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Priority Level</label>
                  <div className="relative group">
                    <AlertTriangle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                      value={form.priority}
                      onChange={e => setForm({...form, priority: e.target.value})}
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Production Status</label>
                  <div className="relative group">
                    <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <select 
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-indigo-600 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                      value={form.status}
                      onChange={e => setForm({...form, status: e.target.value})}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Shipping Info Card (Full Width) */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 mb-2">
            <MapPin className="text-indigo-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Shipping & Logistics</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Shipping Method</label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                  value={form.shipping_method}
                  onChange={e => setForm({...form, shipping_method: e.target.value})}
                >
                  {SHIPPING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Production Remarks</label>
                <input 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                  placeholder="e.g. Custom packaging required"
                  value={form.remarks}
                  onChange={e => setForm({...form, remarks: e.target.value})}
                />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
