// src/components/admin/GroupManager/GroupManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, message, Tag, Space, Popconfirm } from 'antd';
import { ArrowLeft, Plus, Edit, Trash2, ClipboardList } from 'lucide-react'; // Added ClipboardList
import { getAllGroups, createGroup, updateGroup, deleteGroup, getAllUsers } from '../../../firebase/userService'; 
import { getUserMissions, deleteMission, createMission } from '../../../firebase/missionService'; // Added mission imports
import GroupModal from './GroupModal';
import GroupMissionModal from './GroupMissionModal'; // Import new modal

const { Title } = Typography;

const GroupManager = () => {
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // State for group mission assignment
  const [isMissionModalVisible, setIsMissionModalVisible] = useState(false);
  const [selectedGroupForMission, setSelectedGroupForMission] = useState(null);

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

  const handleAssignMission = async (values) => {
    setLoading(true);
    try {
      const studentIds = selectedGroupForMission.studentIds || [];
      
      if (studentIds.length === 0) {
        message.warning("This group has no members.");
        setLoading(false);
        return;
      }

      // Format the mission data correctly
      const missionData = {
        ...values,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
      };

      let assignedCount = 0;

      for (const studentId of studentIds) {
        // 1. Fetch current missions for this specific student (force cache refresh)
        const studentMissions = await getUserMissions(studentId, true);
        
        // 2. Check for duplicate practiceId to override/remove
        const duplicateMissions = studentMissions.filter(m => m.practiceId === missionData.practiceId);
        
        // 3. Delete duplicates
        for (const dup of duplicateMissions) {
          await deleteMission(dup.id, studentId);
        }

        // 4. Assign the new mission
        await createMission({ ...missionData, userId: studentId });
        assignedCount++;
      }

      message.success(`Mission successfully assigned to ${assignedCount} students!`);
      setIsMissionModalVisible(false);
      setSelectedGroupForMission(null);
    } catch (error) {
      console.error("Error assigning group mission:", error);
      message.error("Failed to assign mission to the group.");
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
          {/* Assign Mission Button */}
          <Button 
            type="default" 
            icon={<ClipboardList size={16} />} 
            onClick={() => {
              setSelectedGroupForMission(record);
              setIsMissionModalVisible(true);
            }}
            title="Assign Mission to Group"
          />
          <Button 
            type="default" 
            icon={<Edit size={16} />} 
            onClick={() => handleShowModal(record)} 
            title="Edit Group"
          />
          <Popconfirm
            title="Delete this group?"
            description="Are you sure you want to delete this group?"
            onConfirm={() => handleDeleteGroup(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary" danger icon={<Trash2 size={16} />} title="Delete Group" />
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

      {/* Group Mission Assignment Modal */}
      <GroupMissionModal 
        visible={isMissionModalVisible}
        onCancel={() => {
          setIsMissionModalVisible(false);
          setSelectedGroupForMission(null);
        }}
        onSave={handleAssignMission}
        loading={loading}
      />
    </div>
  );
};

export default GroupManager;