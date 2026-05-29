import React, { useState, useEffect } from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import SignIn from './components/auth/SignIn';
import ForgotPassword from './components/auth/ForgotPassword';
import CRMApp from './components/crm/CRMApp';
import './App.css';

type View = 'signin' | 'forgot' | 'crm';

const App: React.FC = () => {
  const [view, setView] = useState<View>('signin');

  useEffect(() => {
    if (localStorage.getItem('crm_session')) setView('crm');
  }, []);

  const handleLogin = () => {
    localStorage.setItem('crm_session', 'true');
    setView('crm');
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_session');
    setView('signin');
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1D9E75',
          colorSuccess: '#1D9E75',
          borderRadius: 8,
          borderRadiusLG: 12,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        },
        components: {
          Layout: { siderBg: '#fff', headerBg: '#fff' },
          Menu: { itemBg: '#fff', activeBarBorderWidth: 0 },
        },
      }}
    >
      <AntApp>
        {view === 'signin'  && <SignIn onLogin={handleLogin} onForgot={() => setView('forgot')} />}
        {view === 'forgot'  && <ForgotPassword onBack={() => setView('signin')} />}
        {view === 'crm'     && <CRMApp onLogout={handleLogout} />}
      </AntApp>
    </ConfigProvider>
  );
};

export default App;
