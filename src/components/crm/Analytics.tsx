import React, { useMemo } from 'react';
import { Card, Col, Row, Typography, Space } from 'antd';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowUpOutlined, ArrowDownOutlined,
  UserAddOutlined, DollarOutlined, ShoppingOutlined, TeamOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const COLORS = ['#1D9E75', '#378ADD', '#7F77DD', '#E24B4A', '#BA7517', '#D4537E'];
const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

const seeded = (seed: number, min: number, max: number) => {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
};

const useChartData = () => useMemo(() => {
  const monthly = MONTHS.map((m, i) => ({
    month: m,
    revenue: seeded(i * 7 + 1, 800000, 2500000),
    expenses: seeded(i * 7 + 2, 400000, 1200000),
    deals: seeded(i * 7 + 3, 8, 34),
  }));

  const clients = MONTHS.map((m, i) => ({
    month: m,
    new: seeded(i * 5 + 1, 2, 18),
    churned: seeded(i * 5 + 2, 0, 5),
    cumulative: 42 + MONTHS.slice(0, i + 1).reduce((s, _, j) => s + seeded(j * 5 + 1, 2, 18), 0),
  }));

  const segments = [
    { name: 'Корпоративные',  value: 38 },
    { name: 'Малый бизнес',   value: 29 },
    { name: 'Стартапы',       value: 18 },
    { name: 'Частные',        value: 15 },
  ];

  const weekly = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d, i) => ({
    day: d,
    calls: seeded(i * 3 + 10, 3, 22),
    emails: seeded(i * 3 + 11, 5, 30),
    meetings: seeded(i * 3 + 12, 1, 8),
  }));

  const funnelData = [
    { stage: 'Лиды',        count: seeded(101, 280, 350) },
    { stage: 'Квалиф.',     count: seeded(102, 160, 220) },
    { stage: 'Предложение', count: seeded(103, 90, 130) },
    { stage: 'Переговоры',  count: seeded(104, 45, 80) },
    { stage: 'Закрыто',     count: seeded(105, 20, 45) },
  ];

  const kpis = [
    { label: 'Выручка (месяц)',  value: '₸ 1 840 000', delta: '+12%', up: true,  icon: <DollarOutlined />,  color: '#1D9E75', bg: '#E1F5EE' },
    { label: 'Новые клиенты',   value: '14',            delta: '+3',   up: true,  icon: <UserAddOutlined />, color: '#378ADD', bg: '#E6F1FB' },
    { label: 'Сделок закрыто',  value: '27',            delta: '-2',   up: false, icon: <ShoppingOutlined />,color: '#7F77DD', bg: '#EEEDFE' },
    { label: 'Активных клиентов',value: '84',           delta: '+5',   up: true,  icon: <TeamOutlined />,   color: '#BA7517', bg: '#FAEEDA' },
  ];

  return { monthly, clients, segments, weekly, funnelData, kpis };
}, []);

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 }).format(v) + ' ₸';

const Analytics: React.FC = () => {
  const { monthly, clients, segments, weekly, funnelData, kpis } = useChartData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI cards */}
      <Row gutter={16}>
        {kpis.map(k => (
          <Col key={k.label} xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ background: k.bg, boxShadow: 'none' }}
              styles={{ body: { padding: '18px 20px' } }}>
              <Space style={{ marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: k.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16,
                }}>
                  {k.icon}
                </div>
                <Text style={{ fontSize: 12, color: k.color }}>{k.label}</Text>
              </Space>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 600, color: k.color }}>{k.value}</span>
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: k.up ? '#1D9E75' : '#E24B4A',
                  display: 'flex', alignItems: 'center', gap: 2,
                }}>
                  {k.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {k.delta}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Revenue bar chart + Pie */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={<Title level={5} style={{ margin: 0 }}>Выручка и расходы по месяцам</Title>}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly} barGap={4} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtMoney} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip formatter={(v: any) => fmtMoney(v as number)} />
                <Legend />
                <Bar dataKey="revenue"  name="Выручка"  fill="#1D9E75" radius={[4,4,0,0]} />
                <Bar dataKey="expenses" name="Расходы"  fill="#E1F5EE" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
            title={<Title level={5} style={{ margin: 0 }}>Сегменты клиентов</Title>}
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={segments} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={48}
                  paddingAngle={3}
                >
                  {segments.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {segments.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i], flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#555' }}>{s.name}</span>
                  <span style={{ fontWeight: 600 }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Client growth area chart + Weekly activity */}
      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={<Title level={5} style={{ margin: 0 }}>Рост клиентской базы</Title>}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={clients}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1D9E75" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#378ADD" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="cumulative" name="База (всего)"
                  stroke="#1D9E75" fill="url(#cumGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="new" name="Новые"
                  stroke="#378ADD" fill="url(#newGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={<Title level={5} style={{ margin: 0 }}>Активность по дням недели</Title>}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls"    name="Звонки"   fill="#1D9E75" radius={[3,3,0,0]} />
                <Bar dataKey="emails"   name="Письма"   fill="#378ADD" radius={[3,3,0,0]} />
                <Bar dataKey="meetings" name="Встречи"  fill="#7F77DD" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Sales funnel + deals line */}
      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={<Title level={5} style={{ margin: 0 }}>Воронка продаж</Title>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {funnelData.map((s, i) => {
                const pct = Math.round((s.count / funnelData[0].count) * 100);
                return (
                  <div key={s.stage}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{s.stage}</span>
                      <span style={{ fontWeight: 600 }}>{s.count}</span>
                    </div>
                    <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 4,
                        background: COLORS[i % COLORS.length],
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            title={<Title level={5} style={{ margin: 0 }}>Количество сделок по месяцам</Title>}
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line
                  type="monotone" dataKey="deals" name="Сделок"
                  stroke="#1D9E75" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#1D9E75' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default Analytics;
