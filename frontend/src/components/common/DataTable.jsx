import React from 'react';

/**
 * DataTable Component
 * A consistent, responsive table for displaying data across all modules.
 * Standardized on the Job Management "Master Theme".
 * 
 * @param {Array} headers - Array of header objects: { key, label, sortable, align }
 * @param {Array} data - Array of data objects to display
 * @param {Function} onSort - Callback function for sorting (receives key)
 * @param {Object} sortConfig - Current sort state: { key, direction }
 * @param {Function} renderRow - Custom render function for each row (optional)
 */
const DataTable = ({ 
  headers, 
  data, 
  onSort, 
  sortConfig = { key: '', direction: '' },
  renderRow 
}) => {
  return (
    <div className="w-full relative group">
      <div className="w-full overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100 no-scrollbar touch-pan-x">
        <table className="w-full border-collapse text-left min-w-[600px]">
          <thead>
            <tr className="bg-gray-50/50">
              {headers.map((header) => (
                <th 
                  key={header.key}
                  onClick={() => header.sortable && onSort && onSort(header.key)}
                  className={`px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 ${header.sortable ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''} ${header.align === 'right' ? 'text-right' : ''}`}
                >
                  <div className={`flex items-center gap-1 ${header.align === 'right' ? 'justify-end' : ''}`}>
                    {header.label}
                    {header.sortable && sortConfig.key === header.key && (
                      <span className="text-indigo-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.length > 0 ? (
              data.map((item, index) => (
                renderRow ? renderRow(item, index) : (
                  <tr key={item.id || index} className="hover:bg-gray-50/50 transition-colors">
                    {headers.map((header) => (
                      <td key={header.key} className="px-4 sm:px-6 py-4 text-sm text-gray-600">
                        {item[header.key]}
                      </td>
                    ))}
                  </tr>
                )
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} className="px-6 py-10 text-center text-gray-400 font-medium">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Subtle indicator for horizontal scroll on mobile */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-l from-white/80 to-transparent pointer-events-none sm:hidden"></div>
    </div>
  );
};

export default DataTable;
