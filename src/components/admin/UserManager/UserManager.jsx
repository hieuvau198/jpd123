// src/components/admin/UserManager/UserManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Popconfirm,
  message,
  Card,
  Typography,
  Tooltip
} from 'antd';
import { UserPlus, Edit2, Trash2, Users, Coins, Search, History } from 'lucide-react';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllGroups
} from '../../../firebase/userService';
import gradesData from '../../../data/system/grades.json';
import UserModal from './UserModal';
import UserHistoryModal from './UserHistoryModal';

const { Title, Text } = Typography;

const normalizeVietnamese = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersList, groupsList] = await Promise.all([
        getAllUsers(),
        getAllGroups()
      ]);
      setUsers(usersList);
      setGroups(groupsList);
    } catch (error) {
      message.error('Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for User Modal
  const handleOpenUserModal = (user = null) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const handleSaveUser = async (values) => {
    setLoading(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await createUser(values);
        message.success('User created successfully');
      }
      setUserModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      message.error(error.message || 'Error saving user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteUser(id);
      message.success('User deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const cleanSearch = normalizeVietnamese(searchTerm);
    return users.filter((u) => {
      const normalizedName = normalizeVietnamese(u.name);
      const normalizedUsername = normalizeVietnamese(u.username);
      return normalizedName.includes(cleanSearch) || normalizedUsername.includes(cleanSearch);
    });
  }, [users, searchTerm]);

  const columns = useMemo(() => {
    const cols = [
      {
        title: 'User Details',
        key: 'name',
        sorter: (a, b) => (a.name || '').localeCompare(b.name || '', 'vi', { sensitivity: 'base' }),
        sortDirections: ['ascend', 'descend'],
        render: (_, record) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Text strong style={{ fontSize: 15, color: '#262626' }}>
              {record.name || 'Unnamed'}
            </Text>
            {isMobile && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>@{record.username}</span>
                <Tag color={record.role === 'Admin' ? 'geekblue' : 'green'} style={{ margin: 0, fontSize: 11 }}>
                  {record.role || 'Student'}
                </Tag>
                {record.grade && (
                  <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>{record.grade}</Tag>
                )}
                <Tag color="gold" style={{ margin: 0, fontSize: 11 }}>
                  Lvl {record.level || 1} • {record.title || 'Noob'}
                </Tag>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#fa8c16', fontWeight: 600 }}>
                  <Coins size={12} /> {record.personal_coins || 0}
                </span>
              </div>
            )}
          </div>
        )
      }
    ];

    if (!isMobile) {
      cols.push(
        {
          title: 'Username',
          dataIndex: 'username',
          key: 'username',
          sorter: (a, b) => (a.username || '').localeCompare(b.username || ''),
          sortDirections: ['ascend', 'descend']
        },
        {
          title: 'Role',
          dataIndex: 'role',
          key: 'role',
          sorter: (a, b) => (a.role || 'Student').localeCompare(b.role || 'Student'),
          sortDirections: ['ascend', 'descend'],
          render: (role) => <Tag color={role === 'Admin' ? 'geekblue' : 'green'}>{role || 'Student'}</Tag>
        },
        {
          title: 'Grade',
          dataIndex: 'grade',
          key: 'grade',
          sorter: (a, b) => {
            const indexA = gradesData.indexOf(a.grade);
            const indexB = gradesData.indexOf(b.grade);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
          },
          sortDirections: ['ascend', 'descend'],
          render: (grade) => <Tag color="purple">{grade || 'N/A'}</Tag>,
          filters: gradesData.map((grade) => ({ text: grade, value: grade })),
          onFilter: (value, record) => record.grade === value
        },
        {
          title: 'Level / Title',
          key: 'level_title',
          sorter: (a, b) => (a.level || 1) - (b.level || 1),
          sortDirections: ['ascend', 'descend'],
          render: (_, record) => <span>Lvl {record.level || 1} - {record.title || 'Noob'}</span>
        },
        {
          title: 'Coins',
          dataIndex: 'personal_coins',
          key: 'coins',
          sorter: (a, b) => (a.personal_coins || 0) - (b.personal_coins || 0),
          sortDirections: ['ascend', 'descend'],
          render: (coins) => <span style={{ fontWeight: 600, color: '#fa8c16' }}>{coins || 0}</span>
        }
      );
    }

    cols.push({
      title: 'Action',
      key: 'action',
      width: 110,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem lịch sử bài làm">
            <Button
              type="text"
              icon={<History size={16} color="#1890ff" />}
              onClick={() => {
                setSelectedUserForHistory(record);
                setHistoryModalOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              icon={<Edit2 size={16} />}
              onClick={() => handleOpenUserModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      )
    });

    return cols;
  }, [isMobile]);

  return (
    <div style={{ maxWidth: 1100, margin: '20px auto', padding: '0 16px' }}>
      <Card styles={{ body: { padding: '16px' } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 'clamp(18px, 4vw, 24px)' }}>
            <Users size={22} color="#1890ff" /> User Management
          </Title>
          <Button type="primary" icon={<UserPlus size={16} />} onClick={() => handleOpenUserModal()}>
            Add User
          </Button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by name or username"
            prefix={<Search size={16} style={{ color: '#8c8c8c', marginRight: 4 }} />}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ borderRadius: 8 }}
            size="middle"
          />
        </div>

        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, size: 'small' }}
        />
      </Card>

      {/* User Create / Edit Modal */}
      <UserModal
        open={userModalOpen}
        user={editingUser}
        groups={groups}
        loading={loading}
        onCancel={() => {
          setUserModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleSaveUser}
      />

      {/* User History Modal */}
      <UserHistoryModal
        open={historyModalOpen}
        user={selectedUserForHistory}
        onClose={() => {
          setHistoryModalOpen(false);
          setSelectedUserForHistory(null);
        }}
      />
    </div>
  );
};

export default UserManager;