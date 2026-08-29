import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Space, 
  Popconfirm, 
  message, 
  Card, 
  Input, 
  Form, 
  Typography,
  Tooltip 
} from 'antd';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  History as HistoryIcon, 
  CheckSquare, 
  Search,
  Users,
  Coins
} from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../../firebase/userService';
import ProfileHistory from '../../profile/ProfileHistory';

const { Title, Text } = Typography;

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Form Modal State (Create / Edit)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // User History Modal State
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      message.error("Failed to load user management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers for Create/Edit ---
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      username: user.username,
      password: user.password,
    });
    setIsModalVisible(true);
  };

  const handleSaveUser = async (values) => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success("User updated successfully!");
      } else {
        await createUser(values);
        message.success("User created successfully!");
      }
      setIsModalVisible(false);
      fetchData();
    } catch (error) {
      message.error("Operation failed. Please try again.");
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await deleteUser(id);
      message.success("User deleted successfully!");
      fetchData();
    } catch (error) {
      message.error("Failed to delete user.");
    }
  };

  // --- Handlers for History Modal ---
  const handleOpenHistory = (user) => {
    setSelectedUserForHistory(user);
    setIsHistoryModalVisible(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryModalVisible(false);
    setSelectedUserForHistory(null);
  };

  // Assign task handler
  const handleAssignTasks = (user) => {
    message.info(`Assigning tasks for ${user.name || user.username}`);
  };

  // Filter list by Name or ID
  const filteredUsers = users.filter(user => {
    const q = searchText.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(q);
    const idMatch = user.id?.toLowerCase().includes(q);
    return nameMatch || idMatch;
  });

  const columns = [
    {
      title: 'Student',
      key: 'student_info',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text strong style={{ fontSize: '15px', color: '#1f1f1f' }}>
            {record.name || 'Unnamed Student'}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fa8c16' }}>
            <Coins size={15} />
            <Text style={{ color: '#fa8c16', fontWeight: 600, fontSize: '13px' }}>
              {record.personal_coins || 0} coins
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          {/* Assign Tasks Button (Icon Only) */}
          <Tooltip title="Assign Tasks">
            <Button 
              type="primary" 
              size="middle"
              icon={<CheckSquare size={16} />} 
              onClick={() => handleAssignTasks(record)}
            />
          </Tooltip>

          {/* User History Button (Icon Only) */}
          <Tooltip title="View Practice History">
            <Button 
              size="middle"
              icon={<HistoryIcon size={16} />} 
              onClick={() => handleOpenHistory(record)}
            />
          </Tooltip>

          {/* Edit Button (Icon Only) */}
          <Tooltip title="Edit Student">
            <Button 
              size="middle"
              icon={<Edit size={16} />} 
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>

          {/* Delete Button (Icon Only) */}
          <Tooltip title="Delete Student">
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDeleteUser(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                size="middle" 
                danger 
                icon={<Trash2 size={16} />} 
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={22} color="#1890ff" /> Students
          </Title>
          <Space>
            <Input
              placeholder="Search student..."
              prefix={<Search size={16} style={{ color: '#aaa' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 180 }}
              allowClear
            />
            <Tooltip title="Add New Student">
              <Button 
                type="primary" 
                icon={<UserPlus size={16} />} 
                onClick={handleOpenCreateModal}
              />
            </Tooltip>
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* --- ADD / EDIT USER MODAL --- */}
      <Modal
        title={editingUser ? "Edit Student" : "Create New Student"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveUser}>
          <Form.Item 
            name="name" 
            label="Full Name" 
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item 
            name="username" 
            label="Username / ID" 
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input placeholder="johndoe" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item 
            name="password" 
            label="Password" 
            rules={[{ required: true, message: 'Please enter password' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- USER PRACTICE HISTORY MODAL --- */}
      <Modal
        title={
          selectedUserForHistory 
            ? `History: ${selectedUserForHistory.name || selectedUserForHistory.username}` 
            : 'Practice History'
        }
        open={isHistoryModalVisible}
        onCancel={handleCloseHistory}
        footer={[
          <Button key="close" type="primary" onClick={handleCloseHistory}>
            Close
          </Button>
        ]}
        width={900}
        centered
        destroyOnClose
      >
        {selectedUserForHistory && (
          <div style={{ marginTop: 12 }}>
            <ProfileHistory user={selectedUserForHistory} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManager;