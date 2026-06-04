import React from 'react';
import { Card, Typography } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SignIn: React.FC = () => (
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

      <a href="/api/auth/google" style={{ display: 'block', textDecoration: 'none' }}>
        <button style={{
          width: '100%', height: 46, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: '#fff', border: '1px solid #dadce0', borderRadius: 8,
          fontWeight: 600, fontSize: 15, color: '#3c4043',
          fontFamily: 'inherit', transition: 'box-shadow 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          <GoogleOutlined style={{ fontSize: 18, color: '#4285F4' }} />
          Войти через Google
        </button>
      </a>
    </Card>
  </div>
);

export default SignIn;
