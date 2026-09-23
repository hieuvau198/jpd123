// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import ProfileInfo from '../components/profile/ProfileInfo';
import ProfileMissions from '../components/profile/ProfileMissions';
import ProfileHistory from '../components/profile/ProfileHistory';
import ProfileSchedule from '../components/profile/ProfileSchedule';

const Profile = ({ currentUser }) => {
  const [user, setUser] = useState(currentUser);

  useEffect(() => {
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
    <div style={{ 
      padding: '24px 12px', 
      maxWidth: 1100, 
      margin: '0 auto', 
      marginTop: 20,
      boxSizing: 'border-box',
      width: '100%',
      overflowX: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        flexWrap: 'wrap',
        width: '100%'
      }}>
        <ProfileInfo user={user} />

        {/* Khối chứa Lịch học + Nhiệm vụ: Thêm minWidth: 0 và width: 100% để triệt tiêu overflow */}
        <div style={{ 
          flex: '1 1 500px', 
          minWidth: 0, 
          maxWidth: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px' 
        }}>
          <ProfileSchedule user={user} />
          <div style={{ width: '100%', minWidth: 0 }}>
            <ProfileMissions currentUser={user} />
          </div>
        </div>
      </div>
      
      {/* Khối Lịch sử làm bài */}
      <div style={{ display: 'flex', marginTop: '16px', width: '100%', minWidth: 0 }}>
        <ProfileHistory user={user} />
      </div>
    </div>
  );
};

export default Profile;