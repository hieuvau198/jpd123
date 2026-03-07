import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function NavBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const navigate = useNavigate();

  // Function to check session and update state
  const checkAuth = () => {
    const sessionData = localStorage.getItem('userSession');
    if (sessionData) {
      try {
        const user = JSON.parse(sessionData);
        if (user && user.isLoggedIn) {
          setIsLoggedIn(true);
          setIsAdmin(user.role === 'Admin');
        } else {
          setIsLoggedIn(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Failed to parse user session in NavBar", error);
        setIsLoggedIn(false);
        setIsAdmin(false);
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // 1. Initial check when component mounts
    checkAuth();

    // 2. Listen for custom auth events (triggered from Login/Logout)
    window.addEventListener('authChange', checkAuth);
    
    // Optional: Listen for localStorage changes across multiple tabs
    window.addEventListener('storage', checkAuth);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('authChange', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = () => {
    // Remove session
    localStorage.removeItem('userSession');
    
    // Update state directly or let the event handle it
    setIsLoggedIn(false);
    setIsAdmin(false);
    
    // Dispatch event to notify any other components
    window.dispatchEvent(new Event('authChange'));
    
    // Redirect to login or home
    navigate('/login');
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full p-3 z-50 flex justify-between items-center transition-transform duration-300 pointer-events-none ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* HOME BUTTON (Top Left) */}
      <Link
        to="/"
        className="pointer-events-auto bg-white/80 backdrop-blur-md text-black px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-white transition"
      >
        Home
      </Link>

      {/* RIGHT SIDE BUTTONS (Top Right) */}
      <div className="flex gap-2">
        {!isLoggedIn ? (
          /* Show Login if no user is found */
          <Link
            to="/login"
            className="pointer-events-auto bg-yellow-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-yellow-500 transition"
          >
            Login
          </Link>
        ) : (
          /* Show Profile/Admin + Logout if user is logged in */
          <>
            {isAdmin ? (
              <Link
                to="/admin"
                className="pointer-events-auto bg-blue-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-blue-500 transition"
              >
                Admin
              </Link>
            ) : (
              <Link
                to="/profile"
                className="pointer-events-auto bg-white/80 backdrop-blur-md text-black px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-white transition"
              >
                Profile
              </Link>
            )}
            
            <button
              onClick={handleLogout}
              className="pointer-events-auto bg-red-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-red-500 transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}