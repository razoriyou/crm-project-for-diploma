import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Tag, Space, Modal, Form,
  Select, Typography, App, Popconfirm, Avatar, Badge,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const AVATAR_COLORS = [
  '#1D9E75','#378ADD','#7F77DD','#E24B4A','#BA7517','#D4537E','#3B6D11',
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const Clients: React.FC = () => {
  const { message } = App.useApp();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [open, setOpen]         = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form]                  = Form.useForm();

  useEffect(() => {
    const stored = localStorage.getItem('crm_clients');
    if (stored) {
      setClients(JSON.parse(stored));
      setLoading(false);
    } else {
      fetch('/clients.json')
        .then(r => r.json())
        .then((data: Client[]) => {
          setClients(data);
          localStorage.setItem('crm_clients', JSON.stringify(data));
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const persist = (list: Client[]) => {
    setClients(list);
    localStorage.setItem('crm_clients', JSON.stringify(list));
  };

  const addClient = async (values: Omit<Client, 'id' | 'createdAt'>) => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    const client: Client = {
      ...values,
      id: Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    persist([client, ...clients]);
    message.success('Клиент добавлен');
    setOpen(false);
    form.resetFields();
    setSaving(false);
  };

  const remove = (id: number) => {
    persist(clients.filter(c => c.id !== id));
    message.success('Клиент удалён');
  };

  const filtered = clients.filter(c =>
    [c.name, c.company, c.email].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    )
  );

  const activeCount   = clients.filter(c => c.status === 'active').length;
  const inactiveCount = clients.filter(c => c.status === 'inactive').length;

  const columns = [
    {
      title: 'Клиент',
      key: 'client',
      render: (_: unknown, r: Client) => (
        <Space>
          <Avatar style={{ background: avatarColor(r.name), flexShrink: 0 }}>
            {r.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500, lineHeight: 1.4 }}>{r.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'active' ? 'success' : 'default'}>
          {s === 'active' ? 'Активный' : 'Неактивный'}
        </Tag>
      ),
    },
    { title: 'Добавлен', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '',
      key: 'del',
      width: 50,
      render: (_: unknown, r: Client) => (
        <Popconfirm
          title="Удалить клиента?"
          description="Это действие нельзя отменить."
          onConfirm={() => remove(r.id)}
          okText="Удалить"
          cancelText="Отмена"
          okButtonProps={{ danger: true }}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Всего клиентов',  value: clients.length,  color: '#1D9E75', bg: '#E1F5EE' },
          { label: 'Активных',        value: activeCount,     color: '#378ADD', bg: '#E6F1FB' },
          { label: 'Неактивных',      value: inactiveCount,   color: '#E24B4A', bg: '#FCEBEB' },
        ].map(({ label, value, color, bg }) => (
          <Card
            key={label}
            bordered={false}
            style={{ flex: 1, background: bg, boxShadow: 'none' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Text style={{ fontSize: 12, color }}>{label}</Text>
            <div style={{ fontSize: 28, fontWeight: 600, color, lineHeight: 1.3 }}>{value}</div>
          </Card>
        ))}
      </div>

      {/* Table card */}
      <Card
        bordered={false}
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserOutlined style={{ color: '#1D9E75' }} />
            <Title level={5} style={{ margin: 0 }}>Список клиентов</Title>
            <Badge count={clients.length} style={{ background: '#1D9E75' }} />
          </div>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Добавить
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bbb' }} />}
            placeholder="Поиск по имени, компании, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 380 }}
          />
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: t => `${t} клиентов` }}
          locale={{ emptyText: 'Клиенты не найдены' }}
          size="middle"
        />
      </Card>

      {/* Add modal */}
      <Modal
        title="Новый клиент"
        open={open}
        onCancel={() => { setOpen(false); form.resetFields(); }}
        footer={null}
        width={480}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={addClient} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Полное имя" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="Иван Петров" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[
            { required: true, message: 'Введите email' },
            { type: 'email', message: 'Неверный формат email' },
          ]}>
            <Input placeholder="email@company.kz" />
          </Form.Item>
          <Form.Item name="phone" label="Телефон">
            <Input placeholder="+7 XXX XXX-XX-XX" />
          </Form.Item>
          <Form.Item name="company" label="Компания">
            <Input placeholder="Название компании" />
          </Form.Item>
          <Form.Item name="status" label="Статус" initialValue="active">
            <Select>
              <Select.Option value="active">Активный</Select.Option>
              <Select.Option value="inactive">Неактивный</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setOpen(false); form.resetFields(); }}>Отмена</Button>
              <Button type="primary" htmlType="submit" loading={saving}>Добавить клиента</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Clients;
