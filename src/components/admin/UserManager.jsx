// src/components/admin/UserManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, message, Popconfirm, Modal, Form, Input, Select, Tag } from 'antd';
import { ArrowLeft, UserPlus, Edit, Trash2 } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../firebase/userService';

const { Title } = Typography;
const { Option } = Select;

const UserManager = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    // Sort by createdAt descending if it exists
    data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setUsers(data);
    setLoading(false);
  };

  const showModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ role: 'Student' }); // Default values
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleSave = async (values) => {
    setLoading(true);
    try {
      if (editingId) {
        await updateUser(editingId, values);
        message.success("User updated successfully");
      } else {
        await createUser(values);
        message.success("User created successfully");
      }
      setIsModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error("Error saving user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
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

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Password', dataIndex: 'password', key: 'password' },
    { 
      title: 'Role', 
      dataIndex: 'role', 
      key: 'role',
      render: (role) => (
        <Tag color={role === 'Admin' ? 'red' : 'blue'}>{role}</Tag>
      )
    },
    { title: 'Grade', dataIndex: 'grade', key: 'grade' },
    { title: 'Phone', dataIndex: 'parentPhone', key: 'parentPhone' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="text" icon={<Edit size={16} />} onClick={() => showModal(record)} />
          <Popconfirm title="Delete this user?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin')}>Back to Admin</Button>
          <Title level={2} style={{ margin: 0 }}>User Management</Title>
        </div>
        <Button type="primary" icon={<UserPlus size={16} />} onClick={() => showModal()}>
          Add New User
        </Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={users} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={editingId ? "Edit User" : "Add New User"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please input full name!' }]}>
            <Input />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="username" label="Username" style={{ flex: 1 }} rules={[{ required: true, message: 'Required!' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="password" label="Password" style={{ flex: 1 }} rules={[{ required: true, message: 'Required!' }]}>
              <Input.Password />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="role" label="Role" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select>
                <Option value="Student">Student</Option>
                <Option value="Admin">Admin</Option>
              </Select>
            </Form.Item>
            <Form.Item name="grade" label="Grade" style={{ flex: 1 }}>
              <Input placeholder="e.g. Lớp 10" />
            </Form.Item>
          </div>

          <Form.Item name="officialSchool" label="Official School">
            <Input />
          </Form.Item>

          <Form.Item name="address" label="Address">
            <Input />
          </Form.Item>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="parentName" label="Parent's Name" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="parentPhone" label="Parent's Phone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingId ? "Update User" : "Create User"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManager;