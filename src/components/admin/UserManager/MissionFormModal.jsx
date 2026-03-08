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
import { getAllChemistry } from '../../../firebase/chemistryService';

const { Option } = Select;

const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

const MissionFormModal = ({ visible, onCancel, onSave, editingRecord, loading }) => {
  const [form] = Form.useForm();
  const [practiceOptions, setPracticeOptions] = useState([]);
  const [loadingPractices, setLoadingPractices] = useState(false);
  const [fetchedData, setFetchedData] = useState([]); // Store raw data to extract total questions
  
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
          startDate: dayjs(), 
          endDate: dayjs().add(2, 'day'), 
          targetQuestions: 1, // Default value
        });
      }
    } else {
      form.resetFields();
      setPracticeOptions([]);
      setFetchedData([]);
    }
  }, [visible, editingRecord, form]);

  // Fetch practice data when the mission "type" changes
  useEffect(() => {
    const fetchPractices = async () => {
      if (!selectedType) {
        setPracticeOptions([]);
        setFetchedData([]);
        return;
      }
      
      setLoadingPractices(true);
      if (!editingRecord) {
        form.setFieldsValue({ practiceId: null, name: null, totalQuestions: null, targetQuestions: 1 }); 
      }
      
      try {
        let data = [];
        switch (selectedType) {
          case 'Flashcard': data = await getAllFlashcards(); break;
          case 'Quiz': data = await getAllQuizzes(); break;
          case 'Phonetic': data = await getAllPhonetics(); break;
          case 'Repair': data = await getAllRepairs(); break;
          case 'Speak': data = await getAllSpeaks(); break;
          case 'Defense': data = await getAllDefenses(); break;
          case 'Chem Quiz': data = await getAllChemistry(); break;
          default: break;
        }

        setFetchedData(data); // Save the raw data

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
  }, [selectedType, visible, form, editingRecord]);

  // Handle auto-filling name and totalQuestions when practice source is selected
  const handlePracticeChange = (value) => {
    const selectedItem = fetchedData.find(item => item.id === value);
    if (selectedItem) {
      const name = selectedItem.name || selectedItem.title || selectedItem.id;
      
      // Calculate total questions dynamically based on common array fields in your data models
      const total = selectedItem.questions?.length 
                 || selectedItem.flashcards?.length 
                 || selectedItem.items?.length 
                 || selectedItem.words?.length 
                 || selectedItem.data?.length
                 || 10; // Fallback if no array is found
                 
      form.setFieldsValue({
         name: name,
         totalQuestions: total,
         targetQuestions: Math.min(10, total) // Default to max 10, or total if less
      });
    }
  };

  return (
    <Modal 
      title={editingRecord ? "Edit Mission" : "Assign Mission"} 
      open={visible} 
      onCancel={onCancel} 
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        {/* Hidden field to store the practice name */}
        <Form.Item name="name" hidden><Input /></Form.Item>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Form.Item name="type" label="Mission Type" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="Flashcard">Flashcard</Option>
              <Option value="Quiz">Quiz</Option>
              <Option value="Chem Quiz">Chem Quiz</Option>
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
              options={practiceOptions}
              disabled={!selectedType}
              onChange={handlePracticeChange}
              filterOption={(input, option) => {
                const normalizedInput = removeAccents(input);
                const normalizedLabel = removeAccents(option?.label || '');
                return normalizedLabel.includes(normalizedInput);
              }}
            />
          </Form.Item>
        </div>

        {/* New Question Target Fields */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Form.Item name="targetQuestions" label="Target Questions" style={{ flex: 1 }} rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="totalQuestions" label="Total Questions (Auto)" style={{ flex: 1 }}>
            <InputNumber disabled style={{ width: '100%' }} />
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