// src/components/admin/UserManager/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, 
  Space, Popconfirm, message, Card, Typography, Tag 
} from 'antd';
import { Plus, Edit, Trash2, ArrowLeft, Users, History, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllUsers, createUser, updateUser, deleteUser, getAllGroups 
} from '../../../firebase/userService';
import gradesData from '../../../data/system/grades.json';
import UserFilter from './UserFilter';
import UserMissionsModal from './UserMissionsModal';
import UpdateUserIdsButton from './UpdateUserIdsButton';
import RecalculateCoinsButton from './RecalculateCoinsButton';

const { Title } = Typography;
const { Option } = Select;

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Missions modal state
  const [selectedUserForMissions, setSelectedUserForMissions] = useState(null);
  const [isMissionsModalVisible, setIsMissionsModalVisible] = useState(false);

  const [form] = Form.useForm();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, groupsData] = await Promise.all([
        getAllUsers(),
        getAllGroups()
      ]);
      setUsers(usersData);
      setFilteredUsers(usersData);
      setGroups(groupsData);
    } catch (error) {
      message.error("Failed to load users or groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'Student',
      grade: 'Lớp 9',
      groupIds: []
    });
    setIsModalVisible(true);
  };

  const showEditModal = (record) => {
    setEditingUser(record);
    // Find all groups the user currently belongs to
    const userGroupIds = groups
      .filter(g => g.studentIds && g.studentIds.includes(record.id))
      .map(g => g.id);

    form.setFieldsValue({
      username: record.username || record.id,
      name: record.name,
      password: record.password,
      role: record.role || 'Student',
      grade: record.grade || 'Lớp 9',
      groupIds: userGroupIds
    });
    setIsModalVisible(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success("User updated successfully");
      } else {
        await createUser(values);
        message.success("User created successfully");
      }
      setIsModalVisible(false);
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error.message || "Failed to save user");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      message.success("User deleted successfully");
      loadData();
    } catch (error) {
      message.error("Failed to delete user");
    }
  };

  const handleOpenMissions = (user) => {
    setSelectedUserForMissions(user);
    setIsMissionsModalVisible(true);
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => text || record.id,
    },
    {
      title: 'Full Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'Admin' ? 'red' : 'blue'}>
          {role || 'Student'}
        </Tag>
      ),
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade) => <Tag color="geekblue">{grade || 'N/A'}</Tag>,
    },
    {
      title: 'Level / Title',
      key: 'level_title',
      render: (_, record) => (
        <span>
          Lvl {record.level || 1} - <b>{record.title || 'Noob'}</b>
        </span>
      ),
    },
    {
      title: 'Coins',
      dataIndex: 'personal_coins',
      key: 'personal_coins',
      render: (coins) => <b style={{ color: '#fa8c16' }}>{coins || 0}</b>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<Target size={16} />} 
            onClick={() => handleOpenMissions(record)}
            title="Manage Missions"
          >
            Missions
          </Button>
          <Button 
            type="link" 
            icon={<Edit size={16} />} 
            onClick={() => showEditModal(record)} 
          />
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin')}>
            Admin Dashboard
          </Button>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="#1890ff" /> User Management
          </Title>
        </Space>
        
        <Space>
          <UpdateUserIdsButton onComplete={loadData} />
          <RecalculateCoinsButton onComplete={loadData} />
          <Button 
            type="default" 
            icon={<History size={16} />} 
            onClick={() => navigate('/admin/user-history')}
          >
            User History
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            onClick={showCreateModal}
          >
            Add User
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 20, borderRadius: 12 }}>
        <UserFilter users={users} onFilter={setFilteredUsers} />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* User Create/Edit Modal */}
      <Modal
        title={editingUser ? "Edit User" : "Create New Student / User"}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
        destroyOnClose
        okText={editingUser ? "Update" : "Create"}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: 'Student',
            grade: 'Lớp 9',
            groupIds: []
          }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter a username' },
              { pattern: /^[a-zA-Z0-9_.-]+$/, message: 'Username cannot contain special characters or spaces' }
            ]}
          >
            <Input placeholder="e.g. lop9thinhlh" disabled={Boolean(editingUser)} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter the user full name' }]}
          >
            <Input placeholder="e.g. Le Hung Thinh" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter a password' }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select role">
              <Option value="Student">Student</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="grade"
            label="Grade"
            rules={[{ required: true, message: 'Please select a grade' }]}
          >
            <Select placeholder="Select grade">
              {gradesData.map((grade) => (
                <Option key={grade} value={grade}>
                  {grade}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {groups && groups.length > 0 && (
            <Form.Item name="groupIds" label="Assign Groups">
              <Select mode="multiple" placeholder="Select groups" allowClear>
                {groups.map((group) => (
                  <Option key={group.id} value={group.id}>
                    {group.name || group.title || group.id}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* User Missions Modal */}
      {selectedUserForMissions && (
        <UserMissionsModal
          visible={isMissionsModalVisible}
          user={selectedUserForMissions}
          onClose={() => {
            setIsMissionsModalVisible(false);
            setSelectedUserForMissions(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManager;