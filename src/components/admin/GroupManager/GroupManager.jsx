// src/components/admin/GroupManager/GroupManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, message, Tag, Space, Popconfirm } from 'antd';
import { ArrowLeft, Plus, Edit, Trash2, Users } from 'lucide-react';
// Note: Ensure createGroup, updateGroup, and deleteGroup are implemented in your userService!
import { getAllGroups, createGroup, updateGroup, deleteGroup, getAllUsers } from '../../../firebase/userService'; 
import GroupModal from './GroupModal';

const { Title } = Typography;

const GroupManager = () => {
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedGroups, fetchedUsers] = await Promise.all([
        getAllGroups(),
        getAllUsers()
      ]);
      setGroups(fetchedGroups);
      setUsers(fetchedUsers);
    } catch (error) {
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (record = null) => {
    setEditingGroup(record);
    setIsModalVisible(true);
  };

  const handleSaveGroup = async (values) => {
    setLoading(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, values);
        message.success("Group updated successfully");
      } else {
        await createGroup(values);
        message.success("Group created successfully");
      }
      setIsModalVisible(false);
      loadData();
    } catch (error) {
      message.error("Error saving group");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    setLoading(true);
    try {
      await deleteGroup(id);
      message.success("Group deleted successfully");
      loadData();
    } catch (error) {
      message.error("Error deleting group");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Group Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Members',
      key: 'members',
      render: (_, record) => {
        const studentIds = record.studentIds || [];
        if (studentIds.length === 0) return <Tag color="default">No members</Tag>;
        
        return (
          <Space size={[0, 8]} wrap>
            {studentIds.map(id => {
              const user = users.find(u => u.id === id);
              return (
                <Tag color="blue" key={id}>
                  {user ? user.name : 'Unknown User'}
                </Tag>
              );
            })}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="default" 
            icon={<Edit size={16} />} 
            onClick={() => handleShowModal(record)} 
          />
          <Popconfirm
            title="Delete this group?"
            description="Are you sure you want to delete this group?"
            onConfirm={() => handleDeleteGroup(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/users')}></Button>
          <Title level={3} style={{ margin: 0 }}>Group Management</Title>
        </div>
        
        <Button type="primary" icon={<Plus size={16} />} onClick={() => handleShowModal()}>
          New Group
        </Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={groups} 
          rowKey="id" 
          loading={loading} 
          scroll={{ x: true }} 
        />
      </Card>

      <GroupModal 
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSave={handleSaveGroup}
        editingRecord={editingGroup}
        users={users}
        loading={loading}
      />
    </div>
  );
};

export default GroupManager;