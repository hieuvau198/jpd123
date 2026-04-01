import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  let isAuthenticated = false;

  // Retrieve the session data saved during login
  const sessionString = localStorage.getItem('userSession');

  if (sessionString) {
    try {
      // Parse the JSON string to an object
      const sessionData = JSON.parse(sessionString);
      
      // Check if the user is explicitly marked as logged in
      isAuthenticated = sessionData && sessionData.isLoggedIn === true;
    } catch (error) {
      console.error("Failed to parse user session from localStorage:", error);
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated) {
    // If not logged in, redirect them to the login page.
    // We also pass the current location in state so you can optionally 
    // redirect them back to the page they originally tried to visit after logging in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If they are logged in, render the child component
  return children;
};

export default ProtectedRoute;