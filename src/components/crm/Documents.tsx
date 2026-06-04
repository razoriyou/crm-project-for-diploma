import React, { useState, useEffect, useCallback } from 'react';
import {
  Button, Table, Typography, Alert, Space, Upload, Spin, Empty, Tag, Dropdown, Modal, message,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  CloudUploadOutlined, ReloadOutlined,
  FileTextOutlined, FileImageOutlined, FilePdfOutlined,
  FileExcelOutlined, FileWordOutlined, FolderOutlined, FileUnknownOutlined,
  MoreOutlined, LinkOutlined, DownloadOutlined, DeleteOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink: string;
}

function fileIcon(mimeType: string) {
  if (mimeType.includes('folder'))                              return <FolderOutlined     style={{ color: '#f5a623' }} />;
  if (mimeType.includes('pdf'))                                 return <FilePdfOutlined    style={{ color: '#e53e3e' }} />;
  if (mimeType.includes('image'))                               return <FileImageOutlined  style={{ color: '#38a169' }} />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileExcelOutlined style={{ color: '#276749' }} />;
  if (mimeType.includes('document')   || mimeType.includes('word'))   return <FileWordOutlined  style={{ color: '#2b6cb0' }} />;
  if (mimeType.includes('text'))                                return <FileTextOutlined   style={{ color: '#718096' }} />;
  return <FileUnknownOutlined style={{ color: '#a0aec0' }} />;
}

function fmtSize(size?: string) {
  if (!size) return '—';
  const b = parseInt(size);
  if (b < 1024)           return `${b} Б`;
  if (b < 1024 * 1024)    return `${(b / 1024).toFixed(1)} КБ`;
  return `${(b / (1024 * 1024)).toFixed(1)} МБ`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

const COLUMNS = (
  onOpen: (file: DriveFile) => void,
  onDownload: (file: DriveFile) => void,
  onDelete: (file: DriveFile) => void,
) => [
  {
    title: 'Название',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, file: DriveFile) => (
      <Space>
        {fileIcon(file.mimeType)}
        <Text>{name}</Text>
      </Space>
    ),
  },
  {
    title: 'Изменён',
    dataIndex: 'modifiedTime',
    key: 'modifiedTime',
    width: 150,
    render: (t: string) => fmtDate(t),
  },
  {
    title: 'Размер',
    dataIndex: 'size',
    key: 'size',
    width: 110,
    render: (s?: string) => <Text type="secondary">{fmtSize(s)}</Text>,
  },
  {
    title: '',
    key: 'actions',
    width: 56,
    render: (_: unknown, file: DriveFile) => {
      const items: MenuProps['items'] = [
        {
          key: 'open',
          icon: <LinkOutlined />,
          label: 'Открыть в Drive',
          onClick: () => onOpen(file),
        },
        {
          key: 'download',
          icon: <DownloadOutlined />,
          label: 'Скачать',
          onClick: () => onDownload(file),
        },
        { type: 'divider' },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Удалить',
          danger: true,
          onClick: () => onDelete(file),
        },
      ];
      return (
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      );
    },
  },
];

const Documents: React.FC = () => {
  const [files,     setFiles]     = useState<DriveFile[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/drive/files');
      if (res.status === 401) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'insufficient_scope') {
          window.location.href = '/api/auth/google';
          return;
        }
        throw new Error('Не авторизован');
      }
      if (!res.ok) throw new Error('Не удалось загрузить список файлов');
      setFiles(await res.json());
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadFiles().finally(() => setLoading(false));
  }, [loadFiles]);

  const handleDownload = (file: DriveFile) => {
    const a = document.createElement('a');
    a.href = `/api/drive/files/${file.id}/download`;
    a.download = file.name;
    a.click();
  };

  const handleDelete = (file: DriveFile) => {
    Modal.confirm({
      title: 'Удалить файл?',
      content: `«${file.name}» будет удалён из Google Drive без возможности восстановления.`,
      okText: 'Удалить',
      okButtonProps: { danger: true },
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          const res = await fetch(`/api/drive/files/${file.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Ошибка при удалении файла');
          message.success('Файл удалён');
          await loadFiles();
        } catch (e: any) {
          message.error(e.message);
        }
      },
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/drive/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Ошибка при загрузке файла');
      await loadFiles();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
    return false;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space align="center">
          <Title level={4} style={{ margin: 0 }}>Документы</Title>
          <Tag color="green">Google Drive</Tag>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadFiles}>Обновить</Button>
          <Upload beforeUpload={handleUpload} showUploadList={false}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={uploading}
              style={{ background: '#1D9E75', borderColor: '#1D9E75' }}
            >
              Загрузить
            </Button>
          </Upload>
        </Space>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        dataSource={files}
        columns={COLUMNS(
          (f) => window.open(f.webViewLink, '_blank'),
          handleDownload,
          handleDelete,
        )}
        rowKey="id"
        locale={{ emptyText: <Empty description="Файлы не найдены" /> }}
        pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
        style={{ background: '#fff', borderRadius: 12 }}
      />
    </div>
  );
};

export default Documents;
