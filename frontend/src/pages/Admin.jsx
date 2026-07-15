import React, { useEffect, useState } from 'react';
import { ArrowLeft, Users, Mail, Phone, BookOpen, Calendar, Download, MessageSquare, Globe, Upload, PieChart as PieChartIcon, Sun, Moon, Trash2, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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
    invalid_pass: "Invalid password",
    dashboard_tab: "Dashboard",
    upload_tab: "Knowledge Base",
    upload_success: "Knowledge updated successfully!",
    upload_failed: "Failed to upload file.",
    upload_btn: "Upload .txt File",
    select_file: "Select .txt File",
    stats_programs: "Programs of Interest",
    stats_leads: "Total Leads"
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
    invalid_pass: "Mật khẩu không chính xác",
    dashboard_tab: "Thống Kê",
    upload_tab: "Dữ Liệu AI",
    upload_success: "Cập nhật dữ liệu thành công!",
    upload_failed: "Tải file lên thất bại.",
    upload_btn: "Tải lên file .txt",
    select_file: "Chọn file .txt",
    stats_programs: "Chương Trình Quan Tâm",
    stats_leads: "Tổng Khách Hàng"
  }
};

export default function Admin({ lang, setLang, theme, setTheme }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatLogs, setChatLogs] = useState({});
  const [loading, setLoading] = useState(true);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [files, setFiles] = useState([]);

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
        
        const filesRes = await fetch('/api/admin/files');
        const filesData = await filesRes.json();
        setFiles(filesData);
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

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadStatus('');
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploadStatus('Uploading...');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setUploadStatus(t.upload_success);
        const filesRes = await fetch('/api/admin/files');
        setFiles(await filesRes.json());
        setFile(null);
      } else {
        setUploadStatus(t.upload_failed);
      }
    } catch(e) {
      setUploadStatus(t.upload_failed);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm(`Delete ${filename}?`)) return;
    try {
      const res = await fetch(`/api/admin/files/${filename}`, { method: 'DELETE' });
      if (res.ok) {
        setFiles(files.filter(f => f !== filename));
        setUploadStatus('File deleted successfully');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const programStats = leads.reduce((acc, lead) => {
    const prog = lead.program || 'Undecided';
    acc[prog] = (acc[prog] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(programStats).map(key => ({ name: key, value: programStats[key] }));
  const COLORS = ['#0b7c3e', '#efaf1e', '#3b82f6', '#8b5cf6', '#f43f5e'];

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
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            title="Toggle Theme"
            style={{ padding: '0.5rem', background: 'var(--panel-border)', borderRadius: '50%', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
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
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <PieChartIcon size={18} /> {t.dashboard_tab}
        </button>
        <button className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
          <Users size={18} /> {t.leads}
        </button>
        <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageSquare size={18} /> {t.chat_logs}
        </button>
        <button className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          <Upload size={18} /> {t.upload_tab}
        </button>
      </div>

      <div className="admin-panel">
        {activeTab === 'dashboard' ? (
          <div>
            <h2 style={{ color: 'var(--asia-gold)', marginBottom: '1.5rem' }}>{t.stats_programs}</h2>
            <div style={{ height: '350px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <h2 style={{ color: 'var(--asia-gold)', marginTop: '2rem', marginBottom: '1.5rem' }}>{t.stats_leads}: {leads.length}</h2>
          </div>
        ) : activeTab === 'leads' ? (
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
        ) : activeTab === 'chat' ? (
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
        ) : (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '500px' }}>
              <h2 style={{ color: 'var(--asia-gold)', marginBottom: '1.5rem' }}>{t.upload_tab}</h2>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px', border: '1px dashed var(--asia-green)' }}>
                <input type="file" accept=".txt" onChange={handleFileChange} style={{ marginBottom: '1rem', color: 'var(--text-primary)' }} />
                <button className="submit-btn" onClick={handleUpload} disabled={!file} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={18} /> {t.upload_btn}
                </button>
                {uploadStatus && <p style={{ marginTop: '1rem', color: uploadStatus.includes('success') || uploadStatus.includes('deleted') ? 'var(--asia-green)' : '#ff4d4d' }}>{uploadStatus}</p>}
              </div>
            </div>
            
            <div style={{ flex: '1', minWidth: '300px' }}>
              <h2 style={{ color: 'var(--asia-gold)', marginBottom: '1.5rem' }}>Current Knowledge Files</h2>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--panel-border)', maxHeight: '400px', overflowY: 'auto' }}>
                {Array.isArray(files) ? (
                  files.length === 0 ? <p>No files uploaded yet.</p> : files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid var(--panel-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} color="var(--asia-green)" />
                        <span>{f}</span>
                      </div>
                      <button onClick={() => handleDeleteFile(f)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex' }} title="Delete File">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#ff4d4d' }}>Error loading files.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
