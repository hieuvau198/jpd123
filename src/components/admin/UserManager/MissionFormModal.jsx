// src/components/admin/UserManager/MissionFormModal.jsx
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

// Added `existingMissions` prop to filter out already assigned practices
export default function MissionFormModal({ visible, onCancel, onSave, editingRecord, loading, existingMissions = [] }) {
  const [form] = Form.useForm();
  const [{ data: fetchedData, loading: loadingPractices }, setPractices] = useState({ data: [], loading: false });
  const type = Form.useWatch('type', form);

  // 2. Handle Initialization & Reset
  useEffect(() => {
    if (!visible) return form.resetFields();
    form.setFieldsValue(editingRecord 
      ? { ...editingRecord, startDate: dayjs(editingRecord.startDate), endDate: dayjs(editingRecord.endDate) } 
      : { status: 'Chưa làm', percentage: 0, startDate: dayjs(), endDate: dayjs().add(2, 'day'), targetQuestions: 1, max_coins: 10, earning_coins: 0 });
  }, [visible, editingRecord, form]);

  // 3. Handle Dynamic Fetching
  useEffect(() => {
    if (!visible || !type) return setPractices({ data: [], loading: false });
    setPractices(p => ({ ...p, loading: true }));
    
    // Only reset fields if we are creating a new record or switching types
    if (!editingRecord || editingRecord.type !== type) {
      form.setFieldsValue({ practiceId: null, name: null, totalQuestions: null, targetQuestions: 1, max_coins: 10, earning_coins: 0 });
    }
    
    services[type]?.().then(data => setPractices({ data, loading: false })).catch(() => setPractices({ data: [], loading: false }));
  }, [type, visible, form, editingRecord]);

  // 4. Handle Logic Updates (Target -> Max Coins -> Earning Coins -> Status)
  const handleValuesChange = (changed, all) => {
    const updates = {};
    let max = all.max_coins || 0;
    let pct = all.percentage || 0;
    let earned = all.earning_coins || 0;

    // 1. If Target Questions changed
    if (changed.targetQuestions !== undefined) {
      const newTarget = changed.targetQuestions;
      max = newTarget * 10;
      updates.max_coins = max;

      if (editingRecord) {
        // Keep current earnings the same, but cap at the new max_coins
        earned = Math.min(earned, max);
        updates.earning_coins = earned;
        
        // Recalculate percentage based on retained earnings
        pct = max > 0 ? Math.floor((earned / max) * 100) : 0;
        updates.percentage = pct;
        
        // Auto-update status based on the new percentage
        if (pct >= 100) {
          updates.status = 'Đã chinh phục';
        } else if (pct > 0) {
          updates.status = 'Đang làm';
        } else {
          updates.status = 'Chưa làm';
        }
      } else {
        // For entirely new missions, update earnings based on current percentage
        earned = Math.floor((pct / 100) * max);
        updates.earning_coins = earned;
      }
    }

    // 2. If Percentage changed manually
    if (changed.percentage !== undefined) {
      pct = changed.percentage;
      earned = Math.floor((pct / 100) * max);
      updates.earning_coins = earned;

      // Auto-update status when percentage changes
      if (pct >= 100) {
        updates.status = 'Đã chinh phục';
      } else if (pct > 0) {
        updates.status = 'Đang làm';
      } else {
        updates.status = 'Chưa làm';
      }
    }

    // Apply the dynamically calculated updates to the form fields
    if (Object.keys(updates).length > 0) {
      form.setFieldsValue(updates);
    }
  };

  // Filter fetched data so assigned practices don't show up (unless it's the currently edited one)
  const assignedPracticeIds = existingMissions.map(m => m.practiceId);
  const availablePractices = fetchedData.filter(item => 
    !assignedPracticeIds.includes(item.id) || item.id === editingRecord?.practiceId
  );

  const handlePracticeChange = (val) => {
    const item = availablePractices.find(i => i.id === val);
    if (!item) return;
    const total = item.questions?.length || item.flashcards?.length || item.items?.length || item.words?.length || item.data?.length || item.reactions?.length || 10;
    const defaultTarget = Math.min(10, total);
    
    form.setFieldsValue({ 
      name: item.name || item.title || item.id, 
      totalQuestions: total, 
      targetQuestions: defaultTarget,
      max_coins: defaultTarget * 10,
      earning_coins: 0 // Reset earnings on new practice selection
    });
  };

  // Reusable flex wrapper
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
              options={availablePractices.map(i => ({ label: i.name || i.title || i.id, value: i.id }))}
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
          {editingRecord ? "Update Mission" : "Assign Mission"}
        </Button>
      </Form>
    </Modal>
  );
}