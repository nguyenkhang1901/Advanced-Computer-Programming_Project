import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, GraduationCap, Users, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TRANSLATIONS = {
  en: {
    welcome: "Hello! Welcome to Asia University Vietnam. I'm your AI admission consultant. How can I help you today?",
    placeholder: "Ask anything about Asia University Vietnam...",
    lead_prompt: "Would you like us to contact you with more personalized information?",
    name: "Your Name",
    email: "Your Email",
    phone: "Phone Number",
    program_select: "Select a Program of Interest",
    submit_lead: "Get Free Consultation",
    cancel_lead: "Maybe Later",
    recommend_prompt: "Would you like an AI-powered personalized recommendation for your studies?",
    recommend_btn: "Get Personalized Recommendation",
    server_error: "Sorry, the server is currently unavailable. Please try again later.",
    lead_thanks: "Thank you! Our admission team will contact you soon with more details.",
    quick_replies: [
      "What are the entry requirements?",
      "Tell me about the IT programs",
      "Are there any scholarships?",
      "What is the tuition fee?"
    ],
    lang_btn: "EN"
  },
  vi: {
    welcome: "Xin chào! Chào mừng đến với Asia University Vietnam. Tôi là tư vấn viên tuyển sinh AI. Tôi có thể giúp gì cho bạn hôm nay?",
    placeholder: "Hỏi bất cứ điều gì về Asia University Vietnam...",
    lead_prompt: "Bạn có muốn chúng tôi liên hệ để tư vấn chi tiết hơn không?",
    name: "Họ và tên",
    email: "Email của bạn",
    phone: "Số điện thoại",
    program_select: "Chọn chương trình quan tâm",
    submit_lead: "Nhận Tư Vấn Miễn Phí",
    cancel_lead: "Để Sau",
    recommend_prompt: "Bạn có muốn nhận gợi ý chương trình học cá nhân hóa từ AI không?",
    recommend_btn: "Nhận Gợi Ý Cá Nhân Hóa",
    server_error: "Xin lỗi, máy chủ hiện không khả dụng. Vui lòng thử lại sau.",
    lead_thanks: "Cảm ơn bạn! Đội ngũ tuyển sinh sẽ sớm liên hệ với bạn.",
    quick_replies: [
      "Điều kiện đầu vào là gì?",
      "Thông tin về ngành Công nghệ",
      "Trường có những học bổng nào?",
      "Học phí bao nhiêu một năm?"
    ],
    lang_btn: "VI"
  }
};

export default function Chat({ lang, setLang }) {
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang];

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: t.welcome
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '', program: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [sessionId] = useState(() => 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2));
  const [showRecommendationBtn, setShowRecommendationBtn] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    const userMessageCount = messages.filter(m => m.sender === 'user').length;
    if (userMessageCount >= 3 && !leadSubmitted && !showLeadForm) {
      setShowLeadForm(true);
    }
  }, [messages, isLoading]);

  // Update initial message when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([{ id: 1, sender: 'bot', text: t.welcome }]);
    }
  }, [lang, t.welcome]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.sender, text: m.text }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, sessionId, language: lang }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: data.reply || "Sorry, I couldn't process that request." }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: t.server_error }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      setLeadSubmitted(true);
      setShowLeadForm(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: t.lead_thanks
      }]);
      setShowRecommendationBtn(true);
    } catch (error) {
      console.error("Failed to submit lead", error);
    }
  };

  const handleRecommendation = async () => {
    setShowRecommendationBtn(false);
    setIsLoading(true);
    try {
      const history = messages.map(m => ({ role: m.sender, text: m.text }));
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadData, history, language: lang })
      });
      const data = await response.json();
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: data.recommendation || "Failed to generate recommendation."
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'bot',
        text: "Sorry, failed to get a recommendation."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <GraduationCap size={40} color="var(--asia-green)" />
          <h1>Asia Uni AI Admission</h1>
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
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.sender === 'bot' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot">
              <div className="typing-indicator">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}

          {showLeadForm && (
            <div className="message bot lead-form-container">
              <div className="message-content">
                <p><strong>{t.lead_prompt}</strong></p>
                <form onSubmit={handleLeadSubmit} className="lead-form">
                  <input required type="text" placeholder={t.name} value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} />
                  <input required type="email" placeholder={t.email} value={leadData.email} onChange={e => setLeadData({...leadData, email: e.target.value})} />
                  <input type="tel" placeholder={t.phone} value={leadData.phone} onChange={e => setLeadData({...leadData, phone: e.target.value})} />
                  <select value={leadData.program} onChange={e => setLeadData({...leadData, program: e.target.value})}>
                    <option value="">{t.program_select}</option>
                    <option value="Semiconductor Technology">Công nghệ bán dẫn</option>
                    <option value="Artificial Intelligence">Trí tuệ nhân tạo (AI)</option>
                    <option value="Business Administration">Quản trị kinh doanh</option>
                    <option value="Finance">Tài chính</option>
                  </select>
                  <button type="submit" className="submit-btn">{t.submit_lead}</button>
                  <button type="button" className="cancel-btn" onClick={() => setShowLeadForm(false)}>{t.cancel_lead}</button>
                </form>
              </div>
            </div>
          )}

          {showRecommendationBtn && (
            <div className="message bot">
              <div className="message-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p>{t.recommend_prompt}</p>
                <button 
                  className="submit-btn" 
                  onClick={handleRecommendation}
                >
                  {t.recommend_btn}
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {!isLoading && messages.length < 3 && !showLeadForm && (
          <div className="quick-replies">
            {t.quick_replies.map((reply, idx) => (
              <button 
                key={idx} 
                className="quick-reply-chip"
                onClick={() => handleSendMessage(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div className="input-area">
          <input
            type="text"
            className="chat-input"
            placeholder={t.placeholder}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputMessage);
            }}
          />
          <button 
            className="send-button"
            onClick={() => handleSendMessage(inputMessage)}
            disabled={!inputMessage.trim() || isLoading}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
