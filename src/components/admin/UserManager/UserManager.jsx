// src/components/admin/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, message, Popconfirm, Tag } from 'antd';
import { ArrowLeft, UserPlus, Edit, Trash2, Target } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../../firebase/userService';
import { getUserMissions, createMission, updateMission, deleteMission } from '../../../firebase/missionService';

// Import child components
import UserModal from './UserModal';
import UserMissionsModal from './UserMissionsModal';
import MissionFormModal from './MissionFormModal';

const { Title } = Typography;

const UserManager = () => {
  const navigate = useNavigate();
  
  // User states
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

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
      const payload = {
        ...values,
        userId: selectedUser.id,
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
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => <Tag color={role === 'Admin' ? 'red' : 'blue'}>{role}</Tag>
    },
    { title: 'Grade', dataIndex: 'grade', key: 'grade' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Conditionally render this button only if role is Student */}
          {record.role === 'Student' && (
            <Button type="primary" size="small" icon={<Target size={14} />} onClick={() => openMissionsList(record)}>
              Missions
            </Button>
          )}
          <Button type="text" icon={<Edit size={16} />} onClick={() => handleShowUserModal(record)} />
          <Popconfirm title="Delete this user?" onConfirm={() => handleDeleteUser(record.id)} okText="Yes">
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin')}>Back</Button>
          <Title level={2} style={{ margin: 0 }}>User Management</Title>
        </div>
        <Button type="primary" icon={<UserPlus size={16} />} onClick={() => handleShowUserModal()}>
          Add New User
        </Button>
      </div>

      <Card>
        <Table columns={userColumns} dataSource={users} rowKey="id" loading={loading} scroll={{ x: true }} />
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