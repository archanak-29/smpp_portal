import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  // Simple logic to set title based on route
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    const firstSegment = path.split('/')[0];
    return firstSegment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleLogout = async () => {
    try {
      // Could add API call here to invalidate session on server
      logout();
    } catch (error) {
      console.error('Logout error', error);
      logout();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 z-10">
      <h1 className="text-xl font-semibold text-surface-900 tracking-tight">
        {getPageTitle()}
      </h1>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-50 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="h-6 w-px bg-surface-200"></div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-surface-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
