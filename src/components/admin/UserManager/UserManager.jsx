import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Space, 
  Tag, 
  Popconfirm, 
  message, 
  Card, 
  Input, 
  Select, 
  Form, 
  Typography 
} from 'antd';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  History as HistoryIcon, 
  CheckSquare, 
  Search,
  Users
} from 'lucide-react';
import { getAllUsers, getAllGroups, createUser, updateUser, deleteUser } from '../../../firebase/userService';
import ProfileHistory from '../../profile/ProfileHistory';

const { Title } = Typography;
const { Option } = Select;

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
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
      const [usersData, groupsData] = await Promise.all([
        getAllUsers(),
        getAllGroups()
      ]);
      setUsers(usersData);
      setGroups(groupsData);
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
    const userGroupIds = groups
      .filter(g => g.studentIds && g.studentIds.includes(user.id))
      .map(g => g.id);

    form.setFieldsValue({
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role || 'Student',
      groupIds: userGroupIds,
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

  // Assign task placeholder/handler
  const handleAssignTasks = (user) => {
    message.info(`Assigning tasks for ${user.name || user.username}`);
  };

  // --- Filtering ---
  const filteredUsers = users.filter(user => {
    const q = searchText.toLowerCase();
    const nameMatch = user.name?.toLowerCase().includes(q);
    const usernameMatch = user.username?.toLowerCase().includes(q);
    return nameMatch || usernameMatch;
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'Admin' ? 'geekblue' : 'green'}>
          {role || 'Student'}
        </Tag>
      ),
    },
    {
      title: 'Groups',
      key: 'groups',
      render: (_, record) => {
        const userGroups = groups.filter(g => g.studentIds && g.studentIds.includes(record.id));
        return (
          <Space wrap size={[0, 4]}>
            {userGroups.length > 0 ? (
              userGroups.map(g => (
                <Tag color="cyan" key={g.id}>
                  {g.name}
                </Tag>
              ))
            ) : (
              <span style={{ color: '#aaa', fontSize: 12 }}>No group</span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Coins',
      dataIndex: 'personal_coins',
      key: 'personal_coins',
      render: (coins) => <span style={{ color: '#fa8c16', fontWeight: 600 }}>{coins || 0}</span>,
    },
    {
      title: 'Level / Title',
      key: 'level_title',
      render: (_, record) => (
        <span>
          Lvl {record.level || 1} {record.title ? `(${record.title})` : ''}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" wrap>
          {/* Assign Tasks Button */}
          <Button 
            type="primary" 
            size="small"
            icon={<CheckSquare size={14} />} 
            onClick={() => handleAssignTasks(record)}
          >
            Assign Tasks
          </Button>

          {/* User History Button */}
          <Button 
            size="small"
            icon={<HistoryIcon size={14} />} 
            onClick={() => handleOpenHistory(record)}
          >
            History
          </Button>

          {/* Edit */}
          <Button 
            size="small"
            icon={<Edit size={14} />} 
            onClick={() => handleOpenEditModal(record)}
          />

          {/* Delete */}
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              size="small" 
              danger 
              icon={<Trash2 size={14} />} 
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>
      <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={24} color="#1890ff" /> User Management
          </Title>
          <Space>
            <Input
              placeholder="Search by name or username"
              prefix={<Search size={16} style={{ color: '#aaa' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Button 
              type="primary" 
              icon={<UserPlus size={16} />} 
              onClick={handleOpenCreateModal}
            >
              Add User
            </Button>
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredUsers} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>

      {/* --- ADD / EDIT USER MODAL --- */}
      <Modal
        title={editingUser ? "Edit User" : "Create New User"}
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
            label="Username" 
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

          <Form.Item name="role" label="Role" initialValue="Student">
            <Select>
              <Option value="Student">Student</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item name="groupIds" label="Groups">
            <Select mode="multiple" placeholder="Select groups" allowClear>
              {groups.map(group => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* --- USER PRACTICE HISTORY MODAL --- */}
      <Modal
        title={
          selectedUserForHistory 
            ? `Practice History: ${selectedUserForHistory.name || selectedUserForHistory.username}` 
            : 'User History'
        }
        open={isHistoryModalVisible}
        onCancel={handleCloseHistory}
        footer={[
          <Button key="close" type="primary" onClick={handleCloseHistory}>
            Close
          </Button>
        ]}
        width={950}
        centered
        destroyOnClose
      >
        {selectedUserForHistory && (
          <div style={{ marginTop: 16 }}>
            <ProfileHistory user={selectedUserForHistory} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManager;