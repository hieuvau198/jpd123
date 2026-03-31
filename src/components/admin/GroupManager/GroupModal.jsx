// src/components/admin/GroupManager/GroupModal.jsx
import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

const GroupModal = ({ visible, onCancel, onSave, editingRecord, users, loading }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (editingRecord) {
        form.setFieldsValue({
          name: editingRecord.name,
          description: editingRecord.description,
          studentIds: editingRecord.studentIds || [],
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingRecord, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Filter out admins so we only assign students to groups
  const studentOptions = users.filter(u => u.role !== 'Admin');

  return (
    <Modal
      title={editingRecord ? "Edit Group" : "Create New Group"}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Cancel</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
          Save Group
        </Button>
      ]}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Group Name"
          rules={[{ required: true, message: 'Please enter a group name' }]}
        >
          <Input placeholder="e.g., Grade 10 Advanced" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={3} placeholder="Brief description of the group..." />
        </Form.Item>

        <Form.Item
          name="studentIds"
          label="Assign Members"
        >
          <Select
            mode="multiple"
            placeholder="Select students to add to this group"
            allowClear
            showSearch
            optionFilterProp="children"
            style={{ width: '100%' }}
          >
            {studentOptions.map(user => (
              <Option key={user.id} value={user.id}>
                {user.name} ({user.grade || 'No Grade'})
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GroupModal;