// src/components/repair/RepairModeModal.jsx
import React from 'react';
import { Modal, Button, Tag } from 'antd';
import { Sparkles } from 'lucide-react';
import repairConfig from '../../data/system/repair_modes.json';

const RepairModeModal = ({ isOpen, set, onClose, onSelectMode }) => {
  const modes = repairConfig.modes || [];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-indigo-700">
          <Sparkles size={20} />
          <span>Chọn số lượng câu: {set?.title}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      styles={{ body: { padding: '16px 8px' } }}
    >
      <p className="text-slate-600 mb-4 text-sm">
        Bộ này có tổng cộng <b>{set?.questions?.length || 0}</b> câu
      </p>
      <div className="flex flex-col gap-3">
        {modes.map((mode) => (
          <Button
            key={mode.id}
            size="large"
            onClick={() => onSelectMode(mode.percentage)}
            className="h-14 flex items-center justify-between rounded-xl hover:border-indigo-500 hover:text-indigo-600 transition-all text-left"
          >
            <div className="flex flex-col">
              <span className="font-bold text-slate-800">{mode.label}</span>
            </div>
            <Tag color="indigo" className="font-bold">
              {mode.percentage}%
            </Tag>
          </Button>
        ))}
      </div>
    </Modal>
  );
};

export default RepairModeModal;