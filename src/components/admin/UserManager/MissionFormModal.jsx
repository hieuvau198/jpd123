// src/components/admin/MissionFormModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, InputNumber, Input, Button } from 'antd';
import dayjs from 'dayjs';

// Import all your services
import { getAllFlashcards } from '../../../firebase/flashcardService';
import { getAllQuizzes } from '../../../firebase/quizService';
import { getAllPhonetics } from '../../../firebase/phoneticService';
import { getAllRepairs } from '../../../firebase/repairService';
import { getAllSpeaks } from '../../../firebase/speakService';
import { getAllDefenses } from '../../../firebase/defenseService';

const { Option } = Select;

const MissionFormModal = ({ visible, onCancel, onSave, editingRecord, loading }) => {
  const [form] = Form.useForm();
  const [practiceOptions, setPracticeOptions] = useState([]);
  const [loadingPractices, setLoadingPractices] = useState(false);
  
  // Watch the selected type to dynamically load practices
  const selectedType = Form.useWatch('type', form);

  // Initialize form values when modal opens
  useEffect(() => {
    if (visible) {
      if (editingRecord) {
        form.setFieldsValue({
          ...editingRecord,
          startDate: editingRecord.startDate ? dayjs(editingRecord.startDate) : null,
          endDate: editingRecord.endDate ? dayjs(editingRecord.endDate) : null,
        });
      } else {
        form.setFieldsValue({
          status: 'Chưa làm',
          percentage: 0,
          startDate: dayjs(), // Default to today
          endDate: dayjs().add(2, 'day'), // Default to 2 days from now
        });
      }
    } else {
      form.resetFields();
      setPracticeOptions([]);
    }
  }, [visible, editingRecord, form]);

  // Fetch practice data when the mission "type" changes
  useEffect(() => {
    const fetchPractices = async () => {
      if (!selectedType) {
        setPracticeOptions([]);
        return;
      }
      
      setLoadingPractices(true);
      // Reset the selected practice source when type changes
      form.setFieldsValue({ practiceId: null }); 
      
      try {
        let data = [];
        switch (selectedType) {
          case 'Flashcard': data = await getAllFlashcards(); break;
          case 'Quiz': data = await getAllQuizzes(); break;
          case 'Phonetic': data = await getAllPhonetics(); break;
          case 'Repair': data = await getAllRepairs(); break;
          case 'Speak': data = await getAllSpeaks(); break;
          case 'Defense': data = await getAllDefenses(); break;
          default: break;
        }

        // Format data for the Select options. 
        // We use name, title, or id to represent the label depending on your document structure.
        const options = data.map(item => ({
          label: item.name || item.title || item.id,
          value: item.id
        }));
        
        setPracticeOptions(options);
      } catch (error) {
        console.error("Failed to load practices:", error);
      } finally {
        setLoadingPractices(false);
      }
    };

    if (visible) {
      fetchPractices();
    }
  }, [selectedType, visible, form]);

  return (
    <Modal 
      title={editingRecord ? "Edit Mission" : "Assign Mission"} 
      open={visible} 
      onCancel={onCancel} 
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Form.Item name="type" label="Mission Type" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="Flashcard">Flashcard</Option>
              <Option value="Quiz">Quiz</Option>
              <Option value="Phonetic">Phonetic</Option>
              <Option value="Repair">Repair</Option>
              <Option value="Speak">Speak</Option>
              <Option value="Defense">Defense</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="practiceId" label="Practice Source" style={{ flex: 2 }} rules={[{ required: true }]}>
            <Select 
              showSearch
              placeholder="Select a practice source..."
              loading={loadingPractices}
              optionFilterProp="label" // Allows searching by the label text
              options={practiceOptions}
              disabled={!selectedType}
            />
          </Form.Item>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Form.Item name="startDate" label="Start Date" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
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

        <Button type="primary" htmlType="submit" loading={loading} block>
          {editingRecord ? "Update Mission" : "Assign Mission"}
        </Button>
      </Form>
    </Modal>
  );
};

export default MissionFormModal;