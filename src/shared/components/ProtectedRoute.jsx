import React from 'react';
import { useAuth } from '../../core/AuthContext';
import LoginView from '../../features/auth/LoginView';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) return null; // Ou um loading spinner

  if (!session) {
    return <LoginView />;
  }

  return children;
};

export default ProtectedRoute;
