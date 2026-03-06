import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // New state to track if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Retrieve the session from localStorage
    const sessionData = localStorage.getItem('userSession');
    
    if (sessionData) {
      try {
        const user = JSON.parse(sessionData);
        
        // 2. Check if the session indicates the user is logged in
        if (user && user.isLoggedIn) {
          setIsLoggedIn(true);
          
          // 3. Check if the user role is Admin
          if (user.role === 'Admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Failed to parse user session in NavBar", error);
      }
    }
  }, []); // Empty dependency array means this runs once when the NavBar mounts

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide if scrolling down, show if scrolling up or at the very top
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
            className="pointer-events-auto bg-yellow-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-green-600 transition"
          >
            Login
          </Link>
        ) : isAdmin ? (
          /* Show Admin if user is logged in AND is an Admin */
          <Link
            to="/admin"
            className="pointer-events-auto bg-blue-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-blue-600 transition"
          >
            Admin
          </Link>
        ) : (
          /* Show Profile if user is logged in but is NOT an Admin */
          <Link
            to="/profile"
            className="pointer-events-auto bg-white/80 backdrop-blur-md text-black px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-white transition"
          >
            Profile
          </Link>
        )}
      </div>
    </nav>
  );
}