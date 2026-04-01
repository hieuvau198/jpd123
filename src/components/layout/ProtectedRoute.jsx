import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Replace this with your actual authentication check.
  // For example, checking Firebase auth state, context, or localStorage
  const isAuthenticated = true; // Hardcoded for demonstration

  if (!isAuthenticated) {
    // If not logged in, redirect them to the login page
    return <Navigate to="/login" replace />;
  }

  // If they are logged in, render the child component
  return children;
};

export default ProtectedRoute;