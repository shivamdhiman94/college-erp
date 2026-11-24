import React from 'react';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

export const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found',
  onRowClick,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <Spinner size="lg" label="Loading records..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 ${className}`}>
      <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
        <thead className="bg-slate-950/60">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={`px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                  col.className || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-medium">
          {data.map((row, rowIdx) => (
            <tr
              key={row.id || rowIdx}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer hover:bg-slate-800/60' : 'hover:bg-slate-800/30'
              }`}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={`px-4 py-3.5 whitespace-nowrap text-slate-300 text-sm ${
                    col.cellClassName || ''
                  }`}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
