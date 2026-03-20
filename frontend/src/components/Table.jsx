const Table = ({ columns, data, keyField = 'id', onRowClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-200">
          <thead className="bg-surface-50">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 bg-white">
            {data.length > 0 ? (
              data.map((row) => (
                <tr 
                  key={row[keyField] || Math.random().toString()}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-primary-50' : 'hover:bg-surface-50'}`}
                >
                  {columns.map((col, i) => (
                    <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-surface-900">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-surface-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-10 h-10 text-surface-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span>No data available</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
