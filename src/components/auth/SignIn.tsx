import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
  onLogin: () => void;
  onForgot: () => void;
}

const SignIn: React.FC<Props> = ({ onLogin, onForgot }) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/credentials.txt');
      const text = await res.text();
      const get = (key: string) =>
        text.split('\n').find(l => l.startsWith(key + '='))?.split('=').slice(1).join('=').trim();

      if (values.username === get('username') && values.password === get('password')) {
        message.success('Добро пожаловать!');
        onLogin();
      } else {
        message.error('Неверный логин или пароль');
      }
    } catch {
      message.error('Ошибка при авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <Card
        bordered={false}
        style={{ width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(29,158,117,0.14)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, #1D9E75, #085041)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 4px 16px rgba(29,158,117,0.3)',
          }}>
            <span style={{ color: '#fff', fontSize: 26, fontWeight: 700 }}>C</span>
          </div>
          <Title level={3} style={{ margin: 0, color: '#1a1a1a' }}>CRM Pro</Title>
          <Text type="secondary">Войдите в свой аккаунт</Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: 'Введите логин' }]}>
            <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="Логин" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Введите пароль' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="Пароль" />
          </Form.Item>
          <div style={{ textAlign: 'right', marginBottom: 20, marginTop: -6 }}>
            <Button type="link" style={{ padding: 0, color: '#1D9E75', fontSize: 13 }} onClick={onForgot}>
              Забыли пароль?
            </Button>
          </div>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}
              style={{ height: 46, fontWeight: 600, fontSize: 15 }}>
              Войти
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Логин: <b>admin</b> · Пароль: <b>admin123</b>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default SignIn;
