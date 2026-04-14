import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/api';


const STATUSES = ['new', 'pending', 'processing', 'shipped', 'delivered'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const SHIPPING_METHODS = ['Standard Delivery', 'Express Shipping', 'Self-Pickup', 'Factory Delivery'];

const InputField = ({ label, icon, placeholder, value, onChange, type = "text", required = false }) => (
  <div className="flex-1">
    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label} {required && '*'}</label>
    <div className="relative group">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">{icon}</span>
      <input 
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-2.5 bg-[#f8f9fc] border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm group-hover:border-gray-200"
      />
    </div>
  </div>
);

export default function CreateOrder() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    customer_id: '',
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    item_name: '',
    quantity: 1,
    price: '',
    priority: 'medium',
    status: 'new',
    shipping_method: 'Standard Delivery',
    remarks: ''
  });

  useEffect(() => {
    API.get('/customers').then(res => setCustomers(res.data.data)).catch(console.error);
  }, []);

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
      await API.post('/orders', form);
      navigate('/orders');


    } catch (err) {
      alert('Error creating order: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 animate-in fade-in zoom-in duration-300">
      {/* Header section */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition mb-3">
            <span>←</span> Back
          </button>
          <h1 className="text-3xl font-bold text-[#0f1021]">Create New Order</h1>
          <p className="text-gray-500 mt-1">Enter complete details to manually register an order</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/orders')}

            className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-400 hover:text-gray-900 shadow-sm flex items-center gap-2"
          >
            <span>×</span> Cancel
          </button>
          <button 
            type="submit" 
            form="orderForm"
            disabled={saving}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.45)] transition-all disabled:opacity-50"
          >
            <span>💾</span> {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </div>

      <form id="orderForm" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Customer Details */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-blue-600 text-lg">👤</span>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Customer Details</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Existing (Option)</label>
              <select className="w-full px-4 py-2.5 bg-[#f8f9fc] border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600" onChange={handleCustomerSelect} value={form.customer_id}>
                <option value="">Manual Entry / Walk-in</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <InputField 
              label="Full Name" 
              icon="👤" 
              placeholder="e.g. Michael Corleone" 
              required 
              value={form.customer_name} 
              onChange={e => setForm({...form, customer_name: e.target.value})} 
            />

            <div className="flex gap-4">
              <InputField 
                label="Email" 
                icon="✉️" 
                type="email" 
                placeholder="michael@vito.com" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
              />
              <InputField 
                label="Mobile" 
                icon="📱" 
                placeholder="+1 234..." 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Delivery Address</label>
              <div className="relative group">
                <span className="absolute left-4 top-4 text-gray-400">📍</span>
                <textarea 
                  rows="3" 
                  placeholder="Full shipping address..."
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full pl-11 pr-4 py-3 bg-[#f8f9fc] border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Product & Order */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-8">
            <span className="text-blue-600 text-lg">📦</span>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Product & Order</h2>
          </div>

          <div className="space-y-6">
            <InputField 
              label="Item Name" 
              icon="📦" 
              placeholder="e.g. Classic Watch" 
              required 
              value={form.item_name} 
              onChange={e => setForm({...form, item_name: e.target.value})} 
            />


            <div className="flex gap-4">
              <InputField 
                label="Quantity" 
                icon="🔢" 
                type="number" 
                placeholder="1" 
                required 
                value={form.quantity} 
                onChange={e => setForm({...form, quantity: e.target.value})} 
              />
              <InputField 
                label="Price (₹)" 
                icon="💰" 
                type="number" 
                placeholder="0.00" 
                required 
                value={form.price} 
                onChange={e => setForm({...form, price: e.target.value})} 
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Priority</label>
                <select 
                  className="w-full px-4 py-2.5 bg-[#f8f9fc] border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                  value={form.priority}
                  onChange={e => setForm({...form, priority: e.target.value})}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Initial Status</label>
                <select 
                  className="w-full px-4 py-2.5 bg-[#f8f9fc] border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600 underline"
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Shipping & Remarks */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 lg:col-span-2">
           <div className="flex items-center gap-2 mb-6">
            <span className="text-blue-600 text-lg">📄</span>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Shipping & Remarks</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
               <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Shipping Method</label>
               <select 
                  className="w-full px-4 py-2.5 bg-[#f8f9fc] border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all font-medium text-gray-600"
                  value={form.shipping_method}
                  onChange={e => setForm({...form, shipping_method: e.target.value})}
                >
                  {SHIPPING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div className="flex-[2]">
               <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Order Remarks / Internal Notes</label>
               <input 
                  className="w-full px-4 py-2.5 bg-[#f8f9fc] border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                  placeholder="Any special instructions..."
                  value={form.remarks}
                  onChange={e => setForm({...form, remarks: e.target.value})}
               />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
