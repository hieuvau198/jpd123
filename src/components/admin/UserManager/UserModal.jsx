// src/components/admin/UserModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';

const { Option } = Select;

const UserModal = ({ visible, onCancel, onSave, editingRecord, loading }) => {
  const [form] = Form.useForm();

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

  return (
    <Modal 
      title={editingRecord ? "Edit User" : "Add New User"} 
      open={visible} 
      onCancel={onCancel} 
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
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
        <Button type="primary" htmlType="submit" loading={loading} block>
          {editingRecord ? "Update" : "Create"}
        </Button>
      </Form>
    </Modal>
  );
};

export default UserModal;