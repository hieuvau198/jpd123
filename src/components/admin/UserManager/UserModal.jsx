// src/components/admin/UserManager/UserModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select } from 'antd';
import gradesData from '../../../data/system/grades.json';

const { Option } = Select;

const UserModal = ({ open, onCancel, onSubmit, user = null, groups = [], loading = false }) => {
  const [form] = Form.useForm();
  const isEditing = Boolean(user);

  useEffect(() => {
    if (open) {
      if (user) {
        const userGroupIds = groups
          .filter((g) => g.studentIds && g.studentIds.includes(user.id))
          .map((g) => g.id);
        form.setFieldsValue({
          name: user.name,
          username: user.username,
          password: user.password,
          role: user.role || 'Student',
          grade: user.grade || gradesData[0],
          groupIds: userGroupIds,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          role: 'Student',
          grade: gradesData[0],
        });
      }
    }
  }, [open, user, groups, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      // Validate failed, form tự hiển thị lỗi
    }
  };

  return (
    <Modal
      title={isEditing ? 'Edit User' : 'Create User'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Full Name"
          rules={[{ required: true, message: 'Please enter full name' }]}
        >
          <Input placeholder="Nguyễn Khánh Băng" />
        </Form.Item>

        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: 'Please enter username' }]}
        >
          <Input placeholder="khanhbang" disabled={isEditing} />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please enter password' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Select a role' }]}
          >
            <Select>
              <Option value="Student">Student</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="grade"
            label="Grade"
            rules={[{ required: true, message: 'Please select a grade' }]}
          >
            <Select placeholder="Select Grade" showSearch>
              {gradesData.map((grade) => (
                <Option key={grade} value={grade}>
                  {grade}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item name="groupIds" label="Groups">
          <Select mode="multiple" placeholder="Assign to groups">
            {groups.map((group) => (
              <Option key={group.id} value={group.id}>
                {group.name || group.id}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserModal;