import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Typography, Dropdown } from 'antd';
import {
  CalculatorOutlined, TeamOutlined, LogoutOutlined, UserOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, BarChartOutlined,
} from '@ant-design/icons';
import Calculator from './Calculator';
import Clients from './Clients';
import Analytics from './Analytics';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

type Tab = 'clients' | 'calculator' | 'analytics';

interface Props { onLogout: () => void; }

const PAGE_TITLES: Record<Tab, string> = {
  clients: 'Клиенты',
  calculator: 'Форекс',
  analytics: 'Аналитика',
};

const CRMApp: React.FC<Props> = ({ onLogout }) => {
  const [active, setActive] = useState<Tab>('clients');
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { key: 'clients',    icon: <TeamOutlined />,       label: 'Клиенты' },
    { key: 'analytics',  icon: <BarChartOutlined />,   label: 'Аналитика' },
    { key: 'calculator', icon: <CalculatorOutlined />, label: 'Форекс' },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      danger: true,
      onClick: onLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsed={collapsed}
        collapsible
        trigger={null}
        width={240}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: '0 20px', borderBottom: '1px solid #f0f0f0', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #1D9E75, #085041)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>C</span>
          </div>
          {!collapsed && (
            <Text strong style={{ fontSize: 16, color: '#1a1a1a' }}>CRM Pro</Text>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[active]}
          items={menuItems}
          onClick={({ key }) => setActive(key as Tab)}
          style={{ border: 'none', marginTop: 8 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky', top: 0, zIndex: 100, height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(v => !v)}
            />
            <Text strong style={{ fontSize: 16 }}>{PAGE_TITLES[active]}</Text>
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40 }}>
              <Avatar size={30} icon={<UserOutlined />} style={{ background: '#1D9E75' }} />
              <Text style={{ fontSize: 14 }}>admin</Text>
            </Button>
          </Dropdown>
        </Header>

        <Content style={{ padding: 24, background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
          {active === 'clients'    && <Clients />}
          {active === 'calculator' && <Calculator />}
          {active === 'analytics'  && <Analytics />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default CRMApp;
