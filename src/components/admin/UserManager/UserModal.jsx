// src/components/admin/UserManager/UserModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Popconfirm } from 'antd';
import { Trash2 } from 'lucide-react';

const { Option } = Select;

// Helper to remove Vietnamese diacritics
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

// Helper to generate username from name and grade
const generateUsername = (fullName, grade) => {
  if (!fullName || !grade) return '';

  // Process Grade: "Lớp 10" -> "lop10"
  const formattedGrade = normalizeString(grade).replace(/\s+/g, '');

  // Process Name: "Nguyen Van An" -> "annv"
  const nameParts = normalizeString(fullName).trim().split(/\s+/);
  let formattedName = '';
  
  if (nameParts.length > 0) {
    const firstName = nameParts[nameParts.length - 1]; // e.g., "an"
    const initials = nameParts.slice(0, nameParts.length - 1).map(p => p.charAt(0)).join(''); // e.g., "nv"
    formattedName = `${firstName}${initials}`;
  }

  return `${formattedGrade}${formattedName}`;
};

const UserModal = ({ visible, onCancel, onSave, onDelete, editingRecord, loading, groups = [] }) => {
  const [form] = Form.useForm();

  // Generate grades "Lớp 1" to "Lớp 12"
  const gradeOptions = Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`);

  useEffect(() => {
    if (visible) {
      if (editingRecord) {
        form.setFieldsValue(editingRecord);
      } else {
        form.setFieldsValue({ role: 'Student' });
      }
    } else {
      form.resetFields();
    }
  }, [visible, editingRecord, form]);

  const handleValuesChange = (changedValues, allValues) => {
    // Only auto-generate if we are creating a NEW user (not editing an existing one)
    if (!editingRecord) {
      // If the user types in the name or changes the grade, update the username
      if (changedValues.name !== undefined || changedValues.grade !== undefined) {
        const newUsername = generateUsername(allValues.name, allValues.grade);
        
        form.setFieldsValue({
          username: newUsername,
        });

        // Set default password if it hasn't been set yet
        if (!allValues.password) {
          form.setFieldsValue({
            password: '111111',
          });
        }
      }
    }
  };

  return (
    <Modal 
      title={editingRecord ? "Edit User" : "Add New User"} 
      open={visible} 
      onCancel={onCancel} 
      footer={null}
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onSave}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
          <Input placeholder="e.g., Nguyen Van An" />
        </Form.Item>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Form.Item name="username" label="Username" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" style={{ flex: 1 }} rules={[{ required: true }]}>
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
            <Select placeholder="Select a grade" allowClear>
              {gradeOptions.map(grade => (
                <Option key={grade} value={grade}>{grade}</Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        
        {editingRecord && (
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => {
                onDelete(editingRecord.id);
                onCancel();
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<Trash2 size={16} />}>
                Delete
              </Button>
            </Popconfirm>
          )}

          <Form.Item name="groupIds" label="Assign to Groups">
        <Select mode="multiple" placeholder="Select groups" allowClear>
          {groups.map(group => (
            <Option key={group.id} value={group.id}>{group.name || group.id}</Option>
          ))}
        </Select>
      </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block>
          {editingRecord ? "Update" : "Create"}
        </Button>
      </Form>
    </Modal>
  );
};

export default UserModal;