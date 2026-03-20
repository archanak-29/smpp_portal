import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { sessionInfo } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Users', href: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'SMPP Config', href: '/smpp-config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', adminOnly: true },
    { name: 'Ports', href: '/ports', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', adminOnly: true },
  ];

  return (
    <div className="flex flex-col w-64 border-r border-surface-200 bg-white">
      <div className="flex items-center justify-center h-16 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-surface-900 tracking-tight">SMPP<span className="text-primary-600">Dash</span></span>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navigation.map((item) => {
            // Hide admin routes if user is not admin
            if (item.adminOnly && sessionInfo && !sessionInfo.isAdmin) {
              return null;
            }

            const isActive = location.pathname.startsWith(item.href);
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }`}
              >
                <svg
                  className={`flex-shrink-0 w-5 h-5 mr-3 ${
                    isActive ? 'text-primary-600' : 'text-surface-400'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile section */}
      <div className="p-4 border-t border-surface-200 bg-surface-50/50">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-surface-200 text-surface-600 font-semibold">
            {sessionInfo?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-surface-900 truncate">
              {sessionInfo?.username || 'User'}
            </p>
            <p className="text-xs font-medium text-surface-500 truncate">
              {sessionInfo?.isAdmin ? 'Administrator' : 'Client'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
