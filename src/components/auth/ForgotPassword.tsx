import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Result } from 'antd';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
  onBack: () => void;
}

const ForgotPassword: React.FC<Props> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="auth-bg">
      <Card
        bordered={false}
        style={{ width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(29,158,117,0.14)' }}
      >
        {sent ? (
          <Result
            status="success"
            title="Письмо отправлено!"
            subTitle="Инструкции по сбросу пароля отправлены на вашу почту. Проверьте входящие."
            extra={
              <Button type="primary" onClick={onBack} style={{ fontWeight: 600 }}>
                Вернуться к входу
              </Button>
            }
          />
        ) : (
          <>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ marginBottom: 20, padding: '4px 0', color: '#555' }}
            >
              Назад
            </Button>

            <div style={{ marginBottom: 28 }}>
              <Title level={3} style={{ margin: '0 0 6px' }}>Сброс пароля</Title>
              <Text type="secondary">
                Введите ваш email — мы пришлём ссылку для восстановления доступа.
              </Text>
            </div>

            <Form layout="vertical" onFinish={handleSubmit} size="large">
              <Form.Item name="email" rules={[
                { required: true, message: 'Введите email' },
                { type: 'email', message: 'Неверный формат email' },
              ]}>
                <Input
                  prefix={<MailOutlined style={{ color: '#bbb' }} />}
                  placeholder="your@email.com"
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block loading={loading}
                  style={{ height: 46, fontWeight: 600, fontSize: 15 }}>
                  Отправить ссылку
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPassword;
