import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NavBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // TODO: Replace this with your actual authentication logic to check if the user is an admin
  const isAdmin = true; 

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
        {isAdmin && (
          <Link
            to="/admin"
            className="pointer-events-auto bg-blue-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-blue-600 transition"
          >
            Admin
          </Link>
        )}
        <Link
          to="/profile"
          className="pointer-events-auto bg-white/80 backdrop-blur-md text-black px-4 py-1.5 rounded-full text-sm font-medium shadow-md hover:bg-white transition"
        >
          Profile
        </Link>
      </div>
    </nav>
  );
}