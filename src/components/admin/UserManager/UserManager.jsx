// src/components/admin/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, message, Popconfirm, Tag, Input, Space } from 'antd';
import { ArrowLeft, UserPlus, Edit, Trash2, Target, Trophy, Search } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../../firebase/userService';
import { getUserMissions, createMission, updateMission, deleteMission } from '../../../firebase/missionService';

// Import child components
import UserModal from './UserModal';
import UserMissionsModal from './UserMissionsModal';
import MissionFormModal from './MissionFormModal';
import UpdateUserIdsButton from './UpdateUserIdsButton'; 

// Import grades from JSON
import gradesData from '../../../data/system/grades.json';

const { Title } = Typography;
const { CheckableTag } = Tag;

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

  // Filter & Search states
  const [searchText, setSearchText] = useState('');
  const [selectedGrades, setSelectedGrades] = useState([]);

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
    data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setUsers(data);
    setLoading(false);
  };

  // --- Filter Logic ---
  const handleGradeToggle = (grade, checked) => {
    const nextSelectedTags = checked
      ? [...selectedGrades, grade]
      : selectedGrades.filter((t) => t !== grade);
    setSelectedGrades(nextSelectedTags);
  };

  const filteredUsers = users.filter((user) => {
    // 1. Grade Filter Check
    // If no grades selected, pass check. Otherwise, ensure user.grade is in selected list
    const matchesGrade = selectedGrades.length === 0 || selectedGrades.includes(user.grade);

    // 2. Name Filter Check (Vietnamese Normalization)
    const normalizedSearchText = normalizeString(searchText).toLowerCase();
    const normalizedUserName = normalizeString(user.name).toLowerCase();
    const matchesName = normalizedSearchText === '' || normalizedUserName.includes(normalizedSearchText);

    return matchesGrade && matchesName;
  });

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
        // Calculate earning_coins based on percentage
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
          {/* Display personal_coins */}
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

      {/* Filters & Search Section */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Search Bar */}
          <Input 
            prefix={<Search size={16} style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ maxWidth: 400 }}
          />

          {/* Grade Tags Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {gradesData.map((grade) => (
              <CheckableTag
                key={grade}
                checked={selectedGrades.includes(grade)}
                onChange={(checked) => handleGradeToggle(grade, checked)}
                style={{
                  border: '1px solid #d9d9d9',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '14px'
                }}
              >
                {grade}
              </CheckableTag>
            ))}
            
            {/* Clear Filters Button */}
            {selectedGrades.length > 0 && (
              <Button type="link" size="small" onClick={() => setSelectedGrades([])}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table - Replaced 'users' with 'filteredUsers' */}
      <Card>
        <Table 
          columns={userColumns} 
          dataSource={filteredUsers} 
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