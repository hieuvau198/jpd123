// src/components/admin/MissionFormModal.jsx
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

// 1. Map services to dynamically call them
const services = { Flashcard: getAllFlashcards, Quiz: getAllQuizzes, 'Chem Quiz': getAllChemistry, Phonetic: getAllPhonetics, Repair: getAllRepairs, Speak: getAllSpeaks, Defense: getAllDefenses, 'Chem Reaction': getAllChemReactions };
const removeAccents = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function MissionFormModal({ visible, onCancel, onSave, editingRecord, loading }) {
  const [form] = Form.useForm();
  const [{ data: fetchedData, loading: loadingPractices }, setPractices] = useState({ data: [], loading: false });
  const type = Form.useWatch('type', form);

  // 2. Handle Initialization & Reset
  useEffect(() => {
    if (!visible) return form.resetFields();
    form.setFieldsValue(editingRecord 
      ? { ...editingRecord, startDate: dayjs(editingRecord.startDate), endDate: dayjs(editingRecord.endDate) } 
      : { status: 'Chưa làm', percentage: 0, startDate: dayjs(), endDate: dayjs().add(2, 'day'), targetQuestions: 1 });
  }, [visible, editingRecord, form]);

  // 3. Handle Dynamic Fetching
  useEffect(() => {
    if (!visible || !type) return setPractices({ data: [], loading: false });
    setPractices(p => ({ ...p, loading: true }));
    if (!editingRecord) form.setFieldsValue({ practiceId: null, name: null, totalQuestions: null, targetQuestions: 1 });
    
    services[type]?.().then(data => setPractices({ data, loading: false })).catch(() => setPractices({ data: [], loading: false }));
  }, [type, visible, form, editingRecord]);

  // 4. Handle Logic Updates (Target -> Max Coins -> Earning Coins)
  const handleValuesChange = (changed, all) => {
    let max = all.max_coins || 0;
    if (changed.targetQuestions !== undefined) form.setFieldsValue({ max_coins: (max = changed.targetQuestions * 10) });
    if ('targetQuestions' in changed || 'percentage' in changed || 'max_coins' in changed) {
      form.setFieldsValue({ earning_coins: Math.floor(((all.percentage || 0)) * max) });
    }
  };

  const handlePracticeChange = (val) => {
    const item = fetchedData.find(i => i.id === val);
    if (!item) return;
    const total = item.questions?.length || item.flashcards?.length || item.items?.length || item.words?.length || item.data?.length || 10;
    form.setFieldsValue({ name: item.name || item.title || item.id, totalQuestions: total, targetQuestions: Math.min(10, total) });
  };

  // Reusable flex wrapper to save space
  const FlexRow = ({ children }) => <div style={{ display: 'flex', gap: 10 }}>{children}</div>;

  return (
    <Modal title={editingRecord ? "Edit Mission" : "Assign Mission"} open={visible} onCancel={onCancel} footer={null}>
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
          <Form.Item name="max_coins" label="Max Coins Reward" style={{ flex: 1 }}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
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
          {editingRecord ? "Update Mission" : "Assign Mission"}
        </Button>
      </Form>
    </Modal>
  );
}