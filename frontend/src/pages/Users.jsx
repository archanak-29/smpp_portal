import { useState, useEffect } from 'react';
import Table from '../components/Table';
import Modal from '../components/Modal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { sessionInfo } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/all_smpp_clients/');
      if (response.data.status === 'success') {
        setUsers(response.data.smppClients || []);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
      // Fallback placeholder data if API fails or backend not linked
      setUsers([
        { user_id: '1', user_name: 'test_user1', email: 'test1@example.com', sms_limit: 1000, port: 8081, is_active: true },
        { user_id: '2', user_name: 'test_user2', email: 'test2@example.com', sms_limit: 5000, port: 8082, is_active: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Username', accessor: 'user_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'SMS Limit', accessor: 'sms_limit' },
    { header: 'Port', accessor: 'port' },
    { 
      header: 'Status', 
      accessor: 'is_active',
      render: (row) => (
        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Users</h2>
          <p className="mt-1 text-sm text-surface-500">Manage your SMPP client users, their limits, and access.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {sessionInfo?.isAdmin && (
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add User
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <Table columns={columns} data={users} keyField="user_id" />
      )}

      <Modal 
        isOpen={isAddUserModalOpen} 
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New User"
      >
        <p className="text-sm text-surface-500 mb-6">Create a new SMPP client account. The user will receive their credentials via email.</p>
        {/* Form placeholder */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700">Username</label>
            <input type="text" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700">Email</label>
            <input type="email" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700">Port</label>
              <input type="number" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700">SMS Limit</label>
              <input type="number" className="mt-1 block w-full border border-surface-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button 
              onClick={() => setIsAddUserModalOpen(false)}
              className="bg-white py-2 px-4 border border-surface-300 rounded-lg shadow-sm text-sm font-medium text-surface-700 hover:bg-surface-50"
            >
              Cancel
            </button>
            <button className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700">
              Save User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
