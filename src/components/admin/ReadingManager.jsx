// src/components/admin/ReadingManager.jsx
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Upload, Modal, message, Popconfirm, Space, Typography } from 'antd';
import { UploadOutlined, EyeOutlined, DownloadOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { getAllReadings, saveReadingSet, deleteReadingSet } from '../../firebase/readingService';

const { Title } = Typography;

const ReadingManager = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const data = await getAllReadings();
      setReadings(data);
    } catch (err) {
      message.error("Lỗi khi tải danh sách Reading.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        let payload;
        if (file.name.endsWith('.json')) {
          payload = JSON.parse(text);
        } else {
          // Xử lý file .txt: Lấy filename làm id/title và nội dung làm content
          const id = file.name.replace(/\.[^/.]+$/, "");
          payload = {
            id,
            title: id,
            content: text,
            createdAt: new Date().toISOString()
          };
        }

        if (!payload.id) {
          message.error("File cần có trường 'id'.");
          return;
        }

        const res = await saveReadingSet(payload);
        if (res.success) {
          message.success("Thêm bài Reading thành công!");
          fetchReadings();
        } else {
          message.error(res.message || "Không thể lưu bài Reading.");
        }
      } catch (err) {
        console.error(err);
        message.error("Định dạng file không hợp lệ!");
      }
    };
    reader.readAsText(file);
    return false; // Chặn tự upload qua HTTP của Antd
  };

  const handleDownload = (record) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(record, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${record.id || 'reading'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDelete = async (id) => {
    try {
      await deleteReadingSet(id);
      message.success("Đã xóa bài Reading.");
      fetchReadings();
    } catch (err) {
      message.error("Lỗi khi xóa bài Reading.");
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <strong>{text || 'Chưa đặt tên'}</strong>
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setPreviewData(record);
              setPreviewVisible(true);
            }}
          >
            Xem trước
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            Tải xuống
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa bài này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card className="m-4">
      <div className="flex justify-between items-center mb-4">
        <Title level={3} style={{ margin: 0 }}>Quản lý Reading</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchReadings}>Làm mới</Button>
          <Upload
            accept=".json,.txt"
            beforeUpload={handleFileUpload}
            showUploadList={false}
          >
            <Button type="primary" icon={<UploadOutlined />}>Tải lên file (JSON/TXT)</Button>
          </Upload>
        </Space>
      </div>

      <Table
        dataSource={readings}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`Xem trước: ${previewData?.title || previewData?.id}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>Đóng</Button>
        ]}
        width={700}
      >
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[60vh] text-xs">
          {JSON.stringify(previewData, null, 2)}
        </pre>
      </Modal>
    </Card>
  );
};

export default ReadingManager;