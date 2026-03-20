import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { sessionInfo } = useAuth();
  
  const stats = [
    { name: 'Active Users', stat: '71,897', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Messages Sent (Today)', stat: '1.2M', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Avg. Delivery Time', stat: '2.4s', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-purple-600', bg: 'bg-purple-100' },
    { name: 'Active Ports', stat: '12', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Welcome back, {sessionInfo?.username}!</h2>
        <p className="mt-1 text-sm text-surface-500">Here's what's happening with your SMPP instances today.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow-card rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl ${item.bg}`}>
                  <svg className={`h-6 w-6 ${item.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-surface-500 truncate">{item.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-bold text-surface-900">{item.stat}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-surface-50 px-5 py-3">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-700">
                  View full report
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-card rounded-xl p-6">
        <h3 className="text-lg font-medium leading-6 text-surface-900 mb-4">System Overview</h3>
        <div className="h-64 border-2 border-dashed border-surface-200 rounded-xl flex items-center justify-center">
          <p className="text-surface-400">Chart rendering area placeholder</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
