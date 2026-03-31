// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import ProfileInfo from '../components/profile/ProfileInfo';
import ProfileMissions from '../components/profile/ProfileMissions';
import ProfileHistory from '../components/profile/ProfileHistory'; // <-- Add this import

const Profile = ({ currentUser }) => {
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
    // Ensure we load the user object if currentUser prop is undefined on hard refresh
    if (!user) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('userSession'));
        if (storedUser) setUser(storedUser);
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, [user, currentUser]);

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1100, margin: '0 auto', marginTop: 20 }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <ProfileInfo user={user} />
        <ProfileMissions currentUser={user} />
      </div>
      
      {/* --- ADD THIS DIV BLOCK FOR THE HISTORY --- */}
      <div style={{ display: 'flex', marginTop: '20px' }}>
        <ProfileHistory user={user} />
      </div>
      {/* ------------------------------------------ */}
    </div>
  );
};

export default Profile;