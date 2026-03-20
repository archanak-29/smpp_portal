import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const storedSession = localStorage.getItem('SESSIONID');
        const storedIsAdmin = localStorage.getItem('isAdmin');
        const storedUsername = localStorage.getItem('username');
        
        if (storedSession) {
          setIsAuthenticated(true);
          setSessionInfo({
            sessionId: storedSession,
            isAdmin: storedIsAdmin === 'true',
            username: storedUsername
          });
        }
      } catch (error) {
        console.error('Auth verification failed', error);
        localStorage.removeItem('SESSIONID');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = (sessionData, username) => {
    localStorage.setItem('SESSIONID', sessionData.SessionId);
    localStorage.setItem('isAdmin', sessionData.isAdmin);
    localStorage.setItem('username', username);
    
    setIsAuthenticated(true);
    setSessionInfo({
      sessionId: sessionData.SessionId,
      isAdmin: sessionData.isAdmin,
      username: username
    });
  };

  const logout = () => {
    localStorage.removeItem('SESSIONID');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setSessionInfo(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, sessionInfo, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
