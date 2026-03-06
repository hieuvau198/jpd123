import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, message, Popconfirm, Modal, Form, Input, Select, Tag, DatePicker, InputNumber } from 'antd';
import { ArrowLeft, UserPlus, Edit, Trash2, Target } from 'lucide-react';
import { getAllUsers, createUser, updateUser, deleteUser } from '../../firebase/userService';
import { getUserMissions, createMission, updateMission, deleteMission } from '../../firebase/missionService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManager = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // User Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  // Missions Modal states
  const [isMissionsModalVisible, setIsMissionsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [missions, setMissions] = useState([]);
  const [missionLoading, setMissionLoading] = useState(false);
  
  // Mission Form states
  const [isMissionFormVisible, setIsMissionFormVisible] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState(null);
  const [missionForm] = Form.useForm();

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

  // --- User CRUD Handlers ---
  const showModal = (record = null) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({ role: 'Student' });
    }
    setIsModalVisible(true);
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

  // --- Missions CRUD Handlers ---
  const openMissions = async (user) => {
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

  const showMissionForm = (record = null) => {
    if (record) {
      setEditingMissionId(record.id);
      missionForm.setFieldsValue({
        ...record,
        startDate: record.startDate ? dayjs(record.startDate) : null,
        endDate: record.endDate ? dayjs(record.endDate) : null,
      });
    } else {
      setEditingMissionId(null);
      missionForm.resetFields();
      missionForm.setFieldsValue({ status: 'Chưa làm', percentage: 0 });
    }
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

      if (editingMissionId) {
        await updateMission(editingMissionId, payload);
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

  // --- Tables Columns ---
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
          <Button type="primary" size="small" icon={<Target size={14} />} onClick={() => openMissions(record)}>
            Missions
          </Button>
          <Button type="text" icon={<Edit size={16} />} onClick={() => showModal(record)} />
          <Popconfirm title="Delete this user?" onConfirm={() => handleDelete(record.id)} okText="Yes">
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const missionColumns = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: 'Practice ID / Name', dataIndex: 'practiceId', key: 'practiceId' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const color = status === 'Đã chinh phục' ? 'green' : (status === 'Đang làm' ? 'orange' : 'default');
        return <Tag color={color}>{status}</Tag>;
      }
    },
    { title: 'Progress (%)', dataIndex: 'percentage', key: 'percentage' },
    { 
      title: 'Deadline', 
      dataIndex: 'endDate', 
      key: 'endDate', 
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A' 
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="text" size="small" icon={<Edit size={14} />} onClick={() => showMissionForm(record)} />
          <Popconfirm title="Delete this mission?" onConfirm={() => handleDeleteMission(record.id)}>
            <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
          </Popconfirm>
        </div>
      ),
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin')}>Back</Button>
          <Title level={2} style={{ margin: 0 }}>User Management</Title>
        </div>
        <Button type="primary" icon={<UserPlus size={16} />} onClick={() => showModal()}>
          Add New User
        </Button>
      </div>

      <Card>
        <Table columns={userColumns} dataSource={users} rowKey="id" loading={loading} scroll={{ x: true }} />
      </Card>

      {/* USER MODAL */}
      <Modal title={editingId ? "Edit User" : "Add New User"} open={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="username" label="Username" style={{ flex: 1 }} rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="password" label="Password" style={{ flex: 1 }} rules={[{ required: true }]}><Input.Password /></Form.Item>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="role" label="Role" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select><Option value="Student">Student</Option><Option value="Admin">Admin</Option></Select>
            </Form.Item>
            <Form.Item name="grade" label="Grade" style={{ flex: 1 }}><Input /></Form.Item>
          </div>
          <Button type="primary" htmlType="submit" loading={loading} block>{editingId ? "Update" : "Create"}</Button>
        </Form>
      </Modal>

      {/* MISSIONS LIST MODAL */}
      <Modal 
        title={`Missions for ${selectedUser?.name}`} 
        open={isMissionsModalVisible} 
        onCancel={() => setIsMissionsModalVisible(false)} 
        width={800}
        footer={null}
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">Manage assignments and track progress.</Text>
          <Button type="primary" onClick={() => showMissionForm()}>Assign New Mission</Button>
        </div>
        <Table columns={missionColumns} dataSource={missions} rowKey="id" loading={missionLoading} size="small" />
      </Modal>

      {/* ADD/EDIT MISSION MODAL */}
      <Modal 
        title={editingMissionId ? "Edit Mission" : "Assign Mission"} 
        open={isMissionFormVisible} 
        onCancel={() => setIsMissionFormVisible(false)} 
        footer={null}
      >
        <Form form={missionForm} layout="vertical" onFinish={handleSaveMission}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="type" label="Mission Type" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select>
                <Option value="Flashcard">Flashcard</Option>
                <Option value="Quiz">Quiz</Option>
                <Option value="Phonetic">Phonetic</Option>
                <Option value="Repair">Repair</Option>
                <Option value="Speak">Speak</Option>
                <Option value="Defense">Defense</Option>
              </Select>
            </Form.Item>
            <Form.Item name="practiceId" label="Practice Source ID/Name" style={{ flex: 2 }} rules={[{ required: true }]}>
              <Input placeholder="e.g. Unit 1 Flashcards" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="startDate" label="Start Date" style={{ flex: 1 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Form.Item name="status" label="Status" style={{ flex: 2 }} rules={[{ required: true }]}>
              <Select>
                <Option value="Chưa làm">Chưa làm</Option>
                <Option value="Đang làm">Đang làm</Option>
                <Option value="Đã chinh phục">Đã chinh phục</Option>
              </Select>
            </Form.Item>
            <Form.Item name="percentage" label="Progress (%)" style={{ flex: 1 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Extra Notes">
            <Input.TextArea rows={2} placeholder="Optional instructions..." />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={missionLoading} block>
            {editingMissionId ? "Update Mission" : "Assign Mission"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManager;