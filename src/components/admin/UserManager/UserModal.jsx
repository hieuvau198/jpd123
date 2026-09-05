// src/components/admin/UserManager/UserModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import gradesData from '../../../data/system/grades.json';

const { Option } = Select;

const UserModal = ({ visible, onClose, onSubmit, user = null, groups = [] }) => {
  const [form] = Form.useForm();
  const isEditing = Boolean(user);

  useEffect(() => {
    if (visible) {
      if (user) {
        form.setFieldsValue({
          username: user.username || '',
          name: user.name || '',
          password: user.password || '',
          role: user.role || 'Student',
          grade: user.grade || 'Khác',
          groupIds: user.groupIds || [],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          role: 'Student',
          grade: 'Khác',
          groupIds: [],
        });
      }
    }
  }, [visible, user, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      onClose();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      message.error(error.message || 'Failed to save user');
    }
  };

  return (
    <Modal
      title={isEditing ? 'Edit User' : 'Create Student / User'}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
      okText={isEditing ? 'Update' : 'Create'}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          role: 'Student',
          grade: 'Khác',
          groupIds: [],
        }}
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[
            { required: true, message: 'Please enter a username' },
            { pattern: /^[a-zA-Z0-9_.-]+$/, message: 'Username cannot contain special characters or spaces' },
          ]}
        >
          <Input placeholder="e.g. lop9thinhlh" disabled={isEditing} />
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
  );
};

export default UserModal;