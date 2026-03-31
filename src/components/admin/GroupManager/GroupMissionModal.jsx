// src/components/admin/GroupManager/GroupMissionModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, InputNumber, Input, Button } from 'antd';
import dayjs from 'dayjs';

import { getAllFlashcards } from '../../../firebase/flashcardService';
import { getAllQuizzes } from '../../../firebase/quizService';
import { getAllPhonetics } from '../../../firebase/phoneticService';
import { getAllRepairs } from '../../../firebase/repairService';
import { getAllSpeaks } from '../../../firebase/speakService';
import { getAllDefenses } from '../../../firebase/defenseService';
import { getAllChemistry } from '../../../firebase/chemistryService';
import { getAllChemReactions } from '../../../firebase/chemReactionService';

// Map services to dynamically call them
const services = { 
  Flashcard: getAllFlashcards, 
  Quiz: getAllQuizzes, 
  'Chem Quiz': getAllChemistry, 
  Phonetic: getAllPhonetics, 
  Repair: getAllRepairs, 
  Speak: getAllSpeaks, 
  Defense: getAllDefenses, 
  'Chem Reaction': getAllChemReactions 
};

const removeAccents = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function GroupMissionModal({ visible, onCancel, onSave, loading }) {
  const [form] = Form.useForm();
  const [{ data: fetchedData, loading: loadingPractices }, setPractices] = useState({ data: [], loading: false });
  const type = Form.useWatch('type', form);

  // Handle Initialization & Reset
  useEffect(() => {
    if (!visible) {
      return form.resetFields();
    }
    // Default values for a new group mission
    form.setFieldsValue({ 
      status: 'Chưa làm', 
      percentage: 0, 
      startDate: dayjs(), 
      endDate: dayjs().add(2, 'day'), 
      targetQuestions: 1, 
      max_coins: 10, 
      earning_coins: 0 
    });
  }, [visible, form]);

  // Handle Dynamic Fetching
  useEffect(() => {
    if (!visible || !type) return setPractices({ data: [], loading: false });
    
    setPractices(p => ({ ...p, loading: true }));
    
    // Reset fields when switching types
    form.setFieldsValue({ practiceId: null, name: null, totalQuestions: null, targetQuestions: 1, max_coins: 10, earning_coins: 0 });
    
    services[type]?.()
      .then(data => setPractices({ data, loading: false }))
      .catch(() => setPractices({ data: [], loading: false }));
  }, [type, visible, form]);

  // Handle Logic Updates (Target -> Max Coins -> Earning Coins -> Status)
  const handleValuesChange = (changed, all) => {
    const updates = {};

    // 1. If Target Questions changed
    if (changed.targetQuestions !== undefined) {
      const newTarget = changed.targetQuestions;
      const newMaxCoins = newTarget * 10;
      updates.max_coins = newMaxCoins;

      const currentPct = all.percentage || 0;
      updates.earning_coins = Math.floor((currentPct / 100) * newMaxCoins);
    }

    // 2. If Percentage changed manually
    if (changed.percentage !== undefined) {
      const currentPct = changed.percentage;
      const currentMaxCoins = all.max_coins || 0;
      
      updates.earning_coins = Math.floor((currentPct / 100) * currentMaxCoins);

      if (currentPct >= 100) {
        updates.status = 'Đã chinh phục';
      } else if (currentPct > 0) {
        updates.status = 'Đang làm';
      } else {
        updates.status = 'Chưa làm';
      }
    }

    if (Object.keys(updates).length > 0) {
      form.setFieldsValue(updates);
    }
  };

  const handlePracticeChange = (val) => {
    const item = fetchedData.find(i => i.id === val);
    if (!item) return;
    
    const total = item.questions?.length || item.flashcards?.length || item.items?.length || item.words?.length || item.data?.length || item.reactions?.length || 10;
    const defaultTarget = Math.min(10, total);
    
    form.setFieldsValue({ 
      name: item.name || item.title || item.id, 
      totalQuestions: total, 
      targetQuestions: defaultTarget,
      max_coins: defaultTarget * 10,
      earning_coins: 0 
    });
  };

  const FlexRow = ({ children }) => <div style={{ display: 'flex', gap: 10 }}>{children}</div>;

  return (
    <Modal title="Assign Mission to Group" open={visible} onCancel={onCancel} footer={null}>
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange} onFinish={onSave}>
        <Form.Item name="name" hidden><Input /></Form.Item>

        <FlexRow>
          <Form.Item name="type" label="Mission Type" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Select options={Object.keys(services).map(v => ({ value: v, label: v }))} placeholder="Select type" />
          </Form.Item>
          <Form.Item name="practiceId" label="Practice Source" style={{ flex: 2 }} rules={[{ required: true }]}>
            <Select showSearch placeholder="Select a practice source..." loading={loadingPractices} disabled={!type} onChange={handlePracticeChange}
              options={fetchedData.map(i => ({ label: i.name || i.title || i.id, value: i.id }))}
              filterOption={(inp, opt) => removeAccents(opt?.label).includes(removeAccents(inp))} />
          </Form.Item>
        </FlexRow>

        <FlexRow>
          <Form.Item name="targetQuestions" label="Target Questions" style={{ flex: 1 }} rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="totalQuestions" label="Total (Auto)" style={{ flex: 1 }}><InputNumber disabled style={{ width: '100%' }} /></Form.Item>
        </FlexRow>

        <FlexRow>
          <Form.Item name="max_coins" label="Max Coins Reward" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} disabled/></Form.Item>
          <Form.Item name="earning_coins" label="Earned Coins" style={{ flex: 1 }}><InputNumber disabled style={{ width: '100%' }} /></Form.Item>
        </FlexRow>

        <FlexRow>
          <Form.Item name="startDate" label="Start Date" style={{ flex: 1 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="endDate" label="End Date" style={{ flex: 1 }}><DatePicker style={{ width: '100%' }} /></Form.Item>
        </FlexRow>

        <FlexRow>
          <Form.Item name="status" label="Status" style={{ flex: 2 }} rules={[{ required: true }]}>
            <Select options={[{ value: 'Chưa làm' }, { value: 'Đang làm' }, { value: 'Đã chinh phục' }]} />
          </Form.Item>
          <Form.Item name="percentage" label="Progress (%)" style={{ flex: 1 }}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
        </FlexRow>

        <Form.Item name="notes" label="Extra Notes" initialValue="Default instructions...">
          <Input.TextArea rows={2} placeholder="Optional instructions..." />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} block>
          Assign to All Members
        </Button>
      </Form>
    </Modal>
  );
}