import React from 'react';

/**
 * FormLayout Component
 * A reusable container for forms to ensure consistent spacing, sizing, and styling.
 */
const FormLayout = ({ title, subtitle, children, footerActions }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 bg-slate-50/50">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        
        {/* Body */}
        <div className="px-8 py-8 space-y-6">
          {children}
        </div>
        
        {/* Footer */}
        {footerActions && (
          <div className="px-8 py-5 bg-slate-50/50 border-t border-gray-50 flex justify-end gap-3">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormLayout;
