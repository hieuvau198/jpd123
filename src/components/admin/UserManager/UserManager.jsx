// src/components/admin/UserManager/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, message, Popconfirm, Tag } from 'antd';
import { ArrowLeft, UserPlus, Edit, Trash2, Target, Trophy } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../../firebase/userService';
import { getUserMissions, createMission, updateMission, deleteMission } from '../../../firebase/missionService';

// Import child components
import UserModal from './UserModal';
import UserMissionsModal from './UserMissionsModal';
import MissionFormModal from './MissionFormModal';
import UpdateUserIdsButton from './UpdateUserIdsButton'; 
import UserFilter from './UserFilter'; // <-- Import the new filter component

// Import grades from JSON
import gradesData from '../../../data/system/grades.json';

const { Title } = Typography;

// Helper to remove Vietnamese diacritics for searching
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const UserManager = () => {
  const navigate = useNavigate();
  
  // User states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Filter & Search & Sort states
  const [searchText, setSearchText] = useState('');
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [sortBy, setSortBy] = useState('date'); // <-- New state for sorting

  // Missions logic states
  const [selectedUser, setSelectedUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [missionLoading, setMissionLoading] = useState(false);
  const [isMissionsModalVisible, setIsMissionsModalVisible] = useState(false);
  
  // Mission Form states
  const [isMissionFormVisible, setIsMissionFormVisible] = useState(false);
  const [editingMission, setEditingMission] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  // --- Filter and Sort Logic ---
  const getProcessedUsers = () => {
    // 1. Filter
    let processed = users.filter((user) => {
      const matchesGrade = selectedGrades.length === 0 || selectedGrades.includes(user.grade);
      const normalizedSearchText = normalizeString(searchText).toLowerCase();
      const normalizedUserName = normalizeString(user.name).toLowerCase();
      const matchesName = normalizedSearchText === '' || normalizedUserName.includes(normalizedSearchText);
      return matchesGrade && matchesName;
    });

    // 2. Sort
    processed.sort((a, b) => {
      if (sortBy === 'name') {
        return normalizeString(a.name || '').localeCompare(normalizeString(b.name || ''));
      } else if (sortBy === 'coin') {
        return (b.personal_coins || 0) - (a.personal_coins || 0);
      } else { // default to 'date'
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }
    });

    return processed;
  };

  const processedUsers = getProcessedUsers();

  // --- User Handlers ---
  const handleShowUserModal = (record = null) => {
    setEditingUser(record);
    setIsUserModalVisible(true);
  };

  const handleSaveUser = async (values) => {
    setLoading(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success("User updated successfully");
      } else {
        await createUser(values);
        message.success("User created successfully");
      }
      setIsUserModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error("Error saving user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setLoading(true);
    try {
      await deleteUser(id);
      message.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      message.error("Error deleting user");
    } finally {
      setLoading(false);
    }
  };

  // --- Mission List Handlers ---
  const openMissionsList = async (user) => {
    setSelectedUser(user);
    setIsMissionsModalVisible(true);
    await loadUserMissions(user.id);
  };

  const loadUserMissions = async (userId) => {
    setMissionLoading(true);
    const data = await getUserMissions(userId);
    setMissions(data);
    setMissionLoading(false);
  };

  const handleDeleteMission = async (id) => {
    setMissionLoading(true);
    try {
      await deleteMission(id);
      message.success("Mission deleted!");
      loadUserMissions(selectedUser.id);
    } catch (error) {
      message.error("Error deleting mission");
    } finally {
      setMissionLoading(false);
    }
  };

  // --- Mission Form Handlers ---
  const handleShowMissionForm = (record = null) => {
    setEditingMission(record);
    setIsMissionFormVisible(true);
  };

  const handleSaveMission = async (values) => {
    setMissionLoading(true);
    try {
      const percentage = values.percentage || 0;
      const maxCoins = values.max_coins || 0;
      
      const payload = {
        ...values,
        userId: selectedUser.id,
        earning_coins: Math.floor((percentage / 100) * maxCoins),
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      if (editingMission) {
        await updateMission(editingMission.id, payload);
        message.success("Mission updated!");
      } else {
        await createMission(payload);
        message.success("Mission added!");
      }
      setIsMissionFormVisible(false);
      loadUserMissions(selectedUser.id);
    } catch (error) {
      message.error("Error saving mission");
    } finally {
      setMissionLoading(false);
    }
  };

  const userColumns = [
    { 
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div>
          <Typography.Text strong>{record.name}</Typography.Text>
          <div style={{ marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
            <Tag color={record.role === "Admin" ? "red" : "blue"}>{record.role}</Tag>
            <Tag color='green'>{record.grade}</Tag>
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trophy size={16} style={{ color: '#faad14' }} />
            <Typography.Text type="secondary">
              <span style={{ color: '#faad14', fontWeight: 'bold' }}>
                {record.personal_coins || 0}
              </span>
            </Typography.Text>
          </div>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {record.role === 'Student' && (
            <Button
              type="primary"
              size="small"
              icon={<Target size={14} />}
              onClick={() => openMissionsList(record)}
            >
            </Button>
          )}

          <Button
            type="text"
            icon={<Edit size={16} />}
            onClick={() => handleShowUserModal(record)}
          />

          <Popconfirm
            title="Delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin')}></Button>
          <Title level={4} style={{ margin: 0 }}>User Management</Title>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <UpdateUserIdsButton onComplete={loadUsers} />
          <Button type="primary" icon={<UserPlus size={16} />} onClick={() => handleShowUserModal()}>
            New User
          </Button>
        </div>
      </div>

      {/* Extracted Filters & Sort Component */}
      <UserFilter 
        searchText={searchText}
        setSearchText={setSearchText}
        selectedGrades={selectedGrades}
        setSelectedGrades={setSelectedGrades}
        sortBy={sortBy}
        setSortBy={setSortBy}
        gradesData={gradesData}
      />

      {/* Table */}
      <Card>
        <Table 
          columns={userColumns} 
          dataSource={processedUsers} 
          rowKey="id" 
          loading={loading} 
          scroll={{ x: true }} 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Child Modal Components */}
      <UserModal 
        visible={isUserModalVisible}
        onCancel={() => setIsUserModalVisible(false)}
        onSave={handleSaveUser}
        editingRecord={editingUser}
        loading={loading}
      />

      <UserMissionsModal 
        visible={isMissionsModalVisible}
        onCancel={() => setIsMissionsModalVisible(false)}
        user={selectedUser}
        missions={missions}
        loading={missionLoading}
        onAssignNew={() => handleShowMissionForm()}
        onEdit={handleShowMissionForm}
        onDelete={handleDeleteMission}
        onRefresh={() => loadUserMissions(selectedUser.id)} 
      />

      <MissionFormModal 
        visible={isMissionFormVisible}
        onCancel={() => setIsMissionFormVisible(false)}
        onSave={handleSaveMission}
        editingRecord={editingMission}
        loading={missionLoading}
      />
    </div>
  );
};

export default UserManager;