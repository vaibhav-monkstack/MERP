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
    <div className="w-full relative group responsive-table">
      <style>{`
        @media (max-width: 639px) {
          .responsive-table table, 
          .responsive-table thead, 
          .responsive-table tbody, 
          .responsive-table th, 
          .responsive-table td, 
          .responsive-table tr {
            display: block; width: 100%;
          }
          .responsive-table thead {
            display: none;
          }
          .responsive-table tr {
            margin-bottom: 1rem;
            border: 1px solid #f1f5f9;
            border-radius: 1rem;
            background: #fff;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
            overflow: hidden;
          }
          .responsive-table td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem !important;
            border-bottom: 1px solid #f8fafc;
            text-align: right;
          }
          .responsive-table td:last-child {
            border-bottom: 0;
            background-color: #f8fafc;
            justify-content: flex-end;
            gap: 1rem;
          }
          /* Dynamic Generated Headers */
          ${headers.map((h, i) => `
            .responsive-table td:nth-child(${i + 1})::before {
              content: "${h.label}";
              display: block;
              font-weight: 800;
              color: #94a3b8;
              text-transform: uppercase;
              font-size: 0.65rem;
              letter-spacing: 0.05em;
              text-align: left;
            }
          `).join('\n')}
        }
      `}</style>

      <div className="w-full overflow-x-hidden sm:overflow-x-auto bg-transparent sm:bg-white sm:rounded-2xl sm:shadow-sm sm:border border-gray-100 no-scrollbar touch-pan-x">
        <table className="w-full border-collapse text-left sm:min-w-[600px]">
          <thead className="hidden sm:table-header-group">
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
          <tbody className="divide-y divide-gray-50 sm:divide-gray-100 block sm:table-row-group">
            {data.length > 0 ? (
              data.map((item, index) => (
                renderRow ? renderRow(item, index) : (
                  <tr key={item.id || index} className="hover:bg-transparent sm:hover:bg-gray-50/50 transition-colors">
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
                <td colSpan={headers.length} className="px-6 py-10 text-center text-gray-400 font-medium w-full block sm:table-cell">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
