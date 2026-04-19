import React from 'react';

/**
 * StatCard Component
 * A reusable card for displaying dashboard metrics with an icon and description.
 * Standardized on the Job Management "Master Theme".
 * 
 * @param {string} title - The label for the statistic (e.g., "Total Jobs")
 * @param {string|number} value - The main number/value to display
 * @param {string} description - Small text description below the value
 * @param {React.ElementType} icon - Lucide-react icon component
 * @param {string} iconColor - Hex or Tailwind color class for the icon (default: #6b7280)
 */
const StatCard = ({ title, value, description, icon: Icon, iconColor = "#6b7280" }) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider" data-testid={`stat-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</span>
        {Icon && <Icon size={22} color={iconColor} className="opacity-80" />}
      </div>
      <div className="text-3xl font-extrabold text-gray-900 mb-1" data-testid={`stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
      {description && <div className="text-xs font-medium text-gray-400" data-testid={`stat-description-${title.toLowerCase().replace(/\s+/g, '-')}`}>{description}</div>}
      <label htmlFor={`stat-input-${title.toLowerCase().replace(/\s+/g, '-')}`} className="sr-only">{title}</label>
    </div>
  );
};

export default StatCard;
