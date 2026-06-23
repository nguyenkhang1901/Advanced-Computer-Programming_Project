import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, Mail, Phone, BookOpen, Calendar, Download, MessageSquare, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TRANSLATIONS = {
  en: {
    dashboard: "Admin Dashboard",
    back: "Back to Chat",
    leads: "Leads",
    chat_logs: "Chat Logs",
    collected_leads: "Collected Leads",
    export: "Export CSV",
    loading_leads: "Loading leads...",
    no_leads: "No leads collected yet.",
    undecided: "Undecided",
    chat_sessions: "Chat Sessions",
    loading_chats: "Loading chats...",
    no_chats: "No chat sessions recorded yet.",
    session: "Session",
    user: "User",
    bot: "Bot",
    lang_btn: "EN",
    login: "Admin Login",
    password: "Password",
    submit: "Login",
    invalid_pass: "Invalid password"
  },
  vi: {
    dashboard: "Trang Quản Trị",
    back: "Quay Lại Chat",
    leads: "Khách hàng",
    chat_logs: "Lịch Sử Chat",
    collected_leads: "Danh Sách Khách Hàng",
    export: "Xuất CSV",
    loading_leads: "Đang tải dữ liệu...",
    no_leads: "Chưa có khách hàng nào.",
    undecided: "Chưa quyết định",
    chat_sessions: "Phiên Trò Chuyện",
    loading_chats: "Đang tải lịch sử...",
    no_chats: "Chưa có lịch sử trò chuyện.",
    session: "Phiên",
    user: "Khách",
    bot: "Bot",
    lang_btn: "VI",
    login: "Đăng Nhập Quản Trị",
    password: "Mật khẩu",
    submit: "Đăng Nhập",
    invalid_pass: "Mật khẩu không chính xác"
  }
};

export default function Admin({ lang, setLang }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState('leads');
  const [chatLogs, setChatLogs] = useState({});
  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        const leadsRes = await fetch('/api/admin/leads');
        const leadsData = await leadsRes.json();
        setLeads(leadsData);

        const logsRes = await fetch('/api/admin/chat_logs');
        const logsData = await logsRes.json();
        setChatLogs(logsData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const handleExport = () => {
    window.open('/api/admin/leads/export', '_blank');
  };

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError(t.invalid_pass);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ maxWidth: '400px', margin: '10vh auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Users size={48} color="var(--asia-gold)" />
          <h1 style={{ color: 'var(--text-primary)', marginTop: '1rem' }}>{t.login}</h1>
        </div>
        <div style={{ background: 'var(--panel-bg)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--panel-border)' }}>
          <input 
            type="password" 
            placeholder={t.password} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter') handleLogin() }}
            style={{ width: '100%', padding: '1rem', borderRadius: '10px', border: '1px solid var(--panel-border)', background: 'var(--bg-color)', color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1rem' }}
          />
          {error && <p style={{ color: '#ff4d4d', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
          <button className="submit-btn" onClick={handleLogin} style={{ width: '100%' }}>{t.submit}</button>
          <button className="cancel-btn" onClick={() => navigate('/')} style={{ width: '100%', marginTop: '1rem' }}>{t.back}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ maxWidth: '1000px' }}>
      <div className="header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Users size={32} color="var(--asia-green)" />
          <h1>{t.dashboard}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="admin-btn" 
            onClick={() => setLang(lang === 'en' ? 'vi' : 'en')} 
            title="Toggle Language"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--panel-border)', borderRadius: '20px', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
          >
            <Globe size={18} />
            <span style={{ fontWeight: 'bold' }}>{t.lang_btn}</span>
          </button>
          <button className="admin-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={24} /> {t.back}
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
          <Users size={18} /> {t.leads}
        </button>
        <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageSquare size={18} /> {t.chat_logs}
        </button>
      </div>

      <div className="admin-panel">
        {activeTab === 'leads' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--asia-gold)', margin: 0 }}>{t.collected_leads}</h2>
              <button className="submit-btn" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} onClick={handleExport}>
                <Download size={18} /> {t.export}
              </button>
            </div>
            
            {loading ? (
              <p>{t.loading_leads}</p>
            ) : leads.length === 0 ? (
              <div className="empty-state">
                <p>{t.no_leads}</p>
              </div>
            ) : (
              <div className="leads-grid">
                {leads.map((lead) => (
                  <div key={lead.id} className="lead-card">
                    <h3>{lead.name}</h3>
                    <div className="lead-detail"><Mail size={16}/> {lead.email}</div>
                    <div className="lead-detail"><Phone size={16}/> {lead.phone || 'N/A'}</div>
                    <div className="lead-detail"><BookOpen size={16}/> {lead.program || t.undecided}</div>
                    <div className="lead-detail"><Calendar size={16}/> {new Date(lead.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--asia-gold)' }}>{t.chat_sessions}</h2>
            {loading ? (
              <p>{t.loading_chats}</p>
            ) : Object.keys(chatLogs).length === 0 ? (
              <div className="empty-state">
                <p>{t.no_chats}</p>
              </div>
            ) : (
              <div className="chat-logs-container">
                {Object.entries(chatLogs).map(([sessionId, logs]) => (
                  <div key={sessionId} className="session-card">
                    <h4>{t.session}: {sessionId}</h4>
                    <p className="session-date">{new Date(logs[0].created_at).toLocaleString()}</p>
                    <div className="session-messages">
                      {logs.map((log, idx) => (
                        <div key={idx} className={`log-msg ${log.role}`}>
                          <strong>{log.role === 'user' ? t.user : t.bot}:</strong> {log.message}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
