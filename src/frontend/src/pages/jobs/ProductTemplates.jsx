import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Edit2, ChevronDown, ChevronUp, Save, X, Layers } from 'lucide-react';
import TopHeader from '../../components/TopHeader';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ProductTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formParts, setFormParts] = useState([{ part_name: '', qty_per_unit: 1 }]);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/templates`, { headers });
      const data = await res.json();
      setTemplates(data.data || []);
    } catch (err) {
      console.error('fetchTemplates error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormDesc('');
    setFormParts([{ part_name: '', qty_per_unit: 1 }]);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormDesc(t.description || '');
    setFormParts(t.parts.length > 0 ? t.parts.map(p => ({ part_name: p.part_name, qty_per_unit: p.qty_per_unit })) : [{ part_name: '', qty_per_unit: 1 }]);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return alert('Template name is required');
    const validParts = formParts.filter(p => p.part_name.trim());
    setSaving(true);
    try {
      if (editingTemplate) {
        await fetch(`${API_BASE}/templates/${editingTemplate.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ name: formName, description: formDesc })
        });
        // Re-seed parts: delete all and re-add via the parts endpoint
        for (const p of editingTemplate.parts) {
          await fetch(`${API_BASE}/templates/${editingTemplate.id}/parts/${p.id}`, { method: 'DELETE', headers });
        }
        for (const p of validParts) {
          await fetch(`${API_BASE}/templates/${editingTemplate.id}/parts`, {
            method: 'POST', headers,
            body: JSON.stringify({ part_name: p.part_name, qty_per_unit: p.qty_per_unit, unit: 'pcs' })
          });
        }
      } else {
        await fetch(`${API_BASE}/templates`, {
          method: 'POST', headers,
          body: JSON.stringify({ name: formName, description: formDesc, parts: validParts })
        });
      }
      setShowModal(false);
      await fetchTemplates();
    } catch (err) {
      alert('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE', headers });
    fetchTemplates();
  };

  const addPartRow = () => setFormParts([...formParts, { part_name: '', qty_per_unit: 1 }]);
  const removePartRow = (i) => setFormParts(formParts.filter((_, idx) => idx !== i));
  const updatePart = (i, field, val) => {
    const updated = [...formParts];
    updated[i][field] = val;
    setFormParts(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container-custom py-8">
        <TopHeader
          title="Product Templates"
          subtitle="Define the Bill of Materials for each lock product — parts auto-fill when releasing orders to production"
          extraActions={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-[1.02]"
            >
              <Plus size={18} strokeWidth={3} /> New Template
            </button>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates.map(t => (
              <div key={t.id} className="bg-white rounded-[28px] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Card Header */}
                <div className="p-6 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Package size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base leading-tight">{t.name}</h3>
                      {t.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.description}</p>
                      )}
                      <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        {t.parts.length} Components
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(t)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(t.id, t.name)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Toggle Parts List */}
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="w-full px-6 py-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <span>View Components (× 1 unit)</span>
                  {expandedId === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedId === t.id && (
                  <div className="px-6 pb-5 space-y-2">
                    {t.parts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-none">
                        <span className="text-sm font-semibold text-slate-700">{p.part_name}</span>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                          × {p.qty_per_unit} {p.unit || 'pcs'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {templates.length === 0 && !loading && (
              <div className="col-span-3 text-center py-20 text-slate-300">
                <Layers size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-bold text-lg">No templates yet</p>
                <p className="text-sm mt-1">Click "New Template" to define your first product BOM</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === MODAL === */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  {editingTemplate ? 'Edit Template' : 'New Product Template'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Deadbolt Lock"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Short description of the product"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Parts */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Components (per 1 unit)</label>
                  <button onClick={addPartRow} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <Plus size={13} /> Add Row
                  </button>
                </div>
                <div className="space-y-2">
                  {formParts.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p.part_name}
                        onChange={e => updatePart(i, 'part_name', e.target.value)}
                        placeholder="Component name"
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={p.qty_per_unit}
                        onChange={e => updatePart(i, 'qty_per_unit', e.target.value)}
                        className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:border-indigo-500 transition-all"
                      />
                      <button onClick={() => removePartRow(i)} className="p-2 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-60 shadow-lg shadow-indigo-100"
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
