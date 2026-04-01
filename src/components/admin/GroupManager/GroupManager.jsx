// src/components/admin/GroupManager/GroupManager.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Button, Table, message, Tag, Space, Popconfirm } from 'antd';
// Combined lucide-react imports
import { ArrowLeft, Plus, Edit, Trash2, ClipboardList, Printer } from 'lucide-react'; 
import { getAllGroups, createGroup, updateGroup, deleteGroup, getAllUsers } from '../../../firebase/userService'; 
import { getUserMissions, deleteMission, createMission } from '../../../firebase/missionService'; 
import GroupModal from './GroupModal';
import GroupMissionModal from './GroupMissionModal'; 

const { Title } = Typography;

const GroupManager = () => {
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

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

  // --- PRINT FUNCTION ---
  const handlePrintGroup = (group) => {
    const studentIds = group.studentIds || [];
    if (studentIds.length === 0) {
      message.warning("This group has no members to print.");
      return;
    }

    // Filter the global users array to get only the users in this group
    const groupStudents = users.filter(u => studentIds.includes(u.id));

    // Open a new window for printing
    const printWindow = window.open('', '', 'height=600,width=800');
    
    // Construct the HTML for the printable document
    let htmlContent = `
      <html>
        <head>
          <title>Student Credentials - ${group.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h2>Group: ${group.name} - Student Credentials</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
    `;

    groupStudents.forEach(student => {
      const name = student.name || 'N/A';
      const username = student.username || student.email || 'N/A'; 
      const password = student.password || 'N/A'; 
      
      htmlContent += `
        <tr>
          <td>${name}</td>
          <td>${username}</td>
          <td>${password}</td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Add a slight delay to ensure styles are loaded before opening the print dialog
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // --- RESTORED ASSIGN MISSION FUNCTION ---
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
          <Button 
            type="default" 
            icon={<Printer size={16} />} 
            onClick={() => handlePrintGroup(record)}
            title="Print Credentials"
          />
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