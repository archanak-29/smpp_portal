import { useState } from 'react';
import Table from '../components/Table';
import { useAuth } from '../context/AuthContext';

const Ports = () => {
  const { sessionInfo } = useAuth();
  
  // Dummy data
  const [ports] = useState([
    { id: 1, port_number: 8081, protocol: 'SMPP v3.4', status: 'Active', load: '45%' },
    { id: 2, port_number: 8082, protocol: 'SMPP v3.4', status: 'Active', load: '72%' },
    { id: 3, port_number: 8083, protocol: 'SMPP v3.4', status: 'Inactive', load: '0%' },
    { id: 4, port_number: 8084, protocol: 'HTTP API', status: 'Active', load: '12%' },
  ]);

  const columns = [
    { header: 'Port Number', accessor: 'port_number' },
    { header: 'Protocol', accessor: 'protocol' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
          row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-surface-100 text-surface-800'
        }`}>
          {row.status}
        </span>
      )
    },
    { 
      header: 'Current Load', 
      accessor: 'load',
      render: (row) => {
        const loadNum = parseInt(row.load);
        let colorClass = 'bg-green-500';
        if (loadNum > 60) colorClass = 'bg-amber-500';
        if (loadNum > 85) colorClass = 'bg-red-500';

        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-surface-200 rounded-full h-2">
              <div className={`h-2 rounded-full ${colorClass}`} style={{ width: row.load }}></div>
            </div>
            <span className="text-xs text-surface-500">{row.load}</span>
          </div>
        );
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Ports Management</h2>
          <p className="mt-1 text-sm text-surface-500">Monitor active listener ports and connection loads.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Allocate Port
          </button>
        </div>
      </div>

      <Table columns={columns} data={ports} />
    </div>
  );
};

export default Ports;
