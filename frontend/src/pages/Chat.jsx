import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Compass, Users, Sun, Moon, Globe, Mic, Volume2, Paperclip, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TRANSLATIONS = {
  en: {
    welcome: "Hello! Welcome to Asia University Vietnam. I'm your AI admission consultant. How can I help you today?",
    placeholder: "Ask about programs, scholarships, admissions...",
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
    headerSub: "AI Admission Consulting Assistant · 24/7",
    statusText: "Online",
    emptyTitle: "Hello! How can I<br/>help you today?",
    emptySubtitle: "Ask anything about <strong>Asia University Vietnam</strong> – programs, scholarships, admissions, life in Taiwan.",
    footerHint: "Press Enter to send · Shift+Enter for new line",
    newChat: "New Conversation",
    langNotice: "🇬🇧 Switched to English – AI will respond in English.",
    toastNewChat: "✅ New conversation started",
    emptyTags: [
      '🏆 Available scholarships?', '📚 Programs & majors',
      '📋 Admission requirements', '💰 How much is tuition?',
      '✈️ Life in Taiwan', '🎯 Career opportunities'
    ],
    quick_replies: [
      { icon: "🏆", text: "What scholarships are available?" },
      { icon: "📋", text: "What are the admission requirements?" },
      { icon: "📚", text: "What programs does Asia Vietnam offer?" },
      { icon: "💰", text: "How much is the tuition fee?" },
      { icon: "✈️", text: "What is life like in Taiwan?" }
    ]
  },
  vi: {
    welcome: "Xin chào! Chào mừng đến với Asia University Vietnam. Tôi là tư vấn viên tuyển sinh AI. Tôi có thể giúp gì cho bạn hôm nay?",
    placeholder: "Hỏi về ngành học, học bổng, tuyển sinh...",
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
    headerSub: "Trợ lý Tư vấn Tuyển sinh AI · 24/7",
    statusText: "Đang hoạt động",
    emptyTitle: "Xin chào! Tôi có thể<br/>giúp gì cho bạn?",
    emptySubtitle: "Hỏi bất kỳ điều gì về <strong>Asia University Vietnam</strong> – ngành học, học bổng, tuyển sinh, cuộc sống tại Đài Loan.",
    footerHint: "Enter để gửi · Shift+Enter xuống dòng",
    newChat: "Cuộc trò chuyện mới",
    langNotice: "🇻🇳 Đã chuyển sang Tiếng Việt – AI sẽ trả lời bằng tiếng Việt.",
    toastNewChat: "✅ Đã bắt đầu cuộc trò chuyện mới",
    emptyTags: [
      '🏆 Học bổng có gì?', '📚 Các ngành học',
      '📋 Điều kiện tuyển sinh', '💰 Học phí bao nhiêu?',
      '✈️ Học ở Đài Loan ra sao?', '🎯 Cơ hội việc làm sau tốt nghiệp'
    ],
    quick_replies: [
      { icon: "🏆", text: "Học bổng có những loại nào?" },
      { icon: "📋", text: "Điều kiện xét tuyển là gì?" },
      { icon: "📚", text: "Các ngành học tại Asia Vietnam?" },
      { icon: "💰", text: "Học phí khoảng bao nhiêu?" },
      { icon: "✈️", text: "Cuộc sống tại Đài Loan như thế nào?" }
    ]
  }
};

export default function Chat({ lang, setLang, theme, setTheme }) {
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang];

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_messages');
    if (saved) return JSON.parse(saved);
    return [];
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadDismissed, setLeadDismissed] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '', program: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem('chat_session_id');
    if (saved) return saved;
    const newId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    localStorage.setItem('chat_session_id', newId);
    return newId;
  });
  
  const [showRecommendationBtn, setShowRecommendationBtn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    const userMessageCount = messages.filter(m => m.sender === 'user').length;
    if (userMessageCount >= 3 && !leadSubmitted && !showLeadForm && !leadDismissed) {
      setShowLeadForm(true);
    }
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages, isLoading, leadSubmitted, showLeadForm, leadDismissed]);

  // Initial bot greeting
  useEffect(() => {
    if (messages.length === 0) {
      // Don't auto-greet if empty, let the empty state show. Or auto-greet if you prefer.
      // Based on HTML, it fetches from /api/greeting. Let's just use empty state for now.
    }
  }, []);

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleLanguageChange = (newLang) => {
    if (lang === newLang) return;
    setLang(newLang);
    showToast(TRANSLATIONS[newLang].langNotice, 5000);
  };

  // Auto-resize textarea
  const handleTextareaInput = (e) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() && !selectedImage) return;

    const userMsg = { id: Date.now(), sender: 'user', text, hasImage: !!selectedImage };
    setMessages((prev) => [...prev, userMsg]);
    
    const imageToSend = selectedImage;
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.sender, text: m.text }));
      
      const payload = { message: text, history, sessionId, language: lang };
      if (imageToSend) {
        payload.imageBase64 = imageToSend;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      const botMessageId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        { id: botMessageId, sender: 'bot', text: "" }
      ]);
      
      let done = false;
      let fullText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim();
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  setIsLoading(false);
                  fullText += parsed.text;
                  setMessages(prev => prev.map(m => 
                    m.id === botMessageId ? { ...m, text: fullText } : m
                  ));
                } else if (parsed.error) {
                  setIsLoading(false);
                  fullText = "⚠️ " + parsed.error;
                  setMessages(prev => prev.map(m => 
                    m.id === botMessageId ? { ...m, text: fullText } : m
                  ));
                }
              } catch (e) {
                console.error("Error parsing chunk:", e, dataStr);
              }
            }
          }
        }
      }
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

  const handleListen = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(prev => (prev ? prev + ' ' : '') + transcript);
      if (textareaRef.current) {
         textareaRef.current.style.height = 'auto';
         textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
      }
    };
    recognition.onerror = (e) => console.error(e);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleSpeak = (text, id) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (speakingMsgId === id) {
      setSpeakingMsgId(null);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    const targetLang = lang === 'vi' ? 'vi-VN' : 'en-US';
    utterance.lang = targetLang;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const voice = voices.find(v => v.lang === targetLang || v.lang.startsWith(lang));
      if (voice) utterance.voice = voice;
    }
    
    utterance.onend = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewChat = () => {
    const newId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    setSessionId(newId);
    localStorage.setItem('chat_session_id', newId);
    setMessages([]);
    showToast(t.toastNewChat);
  };

  const getTime = () => {
    return new Date().toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-brand">
          <div className="logo-badge">🎓</div>
          <div className="brand-text">
            <div className="name">Asia University Vietnam</div>
            <div className="sub">{t.headerSub}</div>
          </div>
        </div>

        <div className="header-controls">
          <button className="icon-btn" onClick={() => navigate('/quiz')} title="Career Quiz">
            <Compass size={18} />
          </button>
          <button className="icon-btn" onClick={() => navigate('/admin')} title="Admin Dashboard">
            <Users size={18} />
          </button>
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'vi' ? 'active' : ''}`} onClick={() => handleLanguageChange('vi')}>🇻🇳 VI</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => handleLanguageChange('en')}>🇬🇧 EN</button>
          </div>

          <div className="header-status">
            <span className="status-dot"></span>
            <span>{t.statusText}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CHAT ── */}
      <div className="chat-wrapper">
        <div id="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-logo">🎓</div>
              <div className="empty-title" dangerouslySetInnerHTML={{ __html: t.emptyTitle }} />
              <div className="empty-subtitle" dangerouslySetInnerHTML={{ __html: t.emptySubtitle }} />
              <div className="empty-tags">
                {t.emptyTags.map((tag, idx) => (
                  <span key={idx} className="tag" onClick={() => handleSendMessage(tag)}>{tag}</span>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className={`avatar ${msg.sender}`}>{msg.sender === 'bot' ? '🤖' : '👤'}</div>
                <div>
                  <div className={`bubble ${msg.sender}`}>
                    {msg.sender === 'bot' ? (
                      <div style={{ position: 'relative' }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                        {msg.text && (
                          <button 
                            onClick={() => handleSpeak(msg.text, msg.id)}
                            style={{ position: 'absolute', top: '0', right: '-25px', background: 'none', border: 'none', color: speakingMsgId === msg.id ? 'var(--primary-light)' : 'var(--text-secondary)', cursor: 'pointer', padding: '5px' }}
                            title="Read aloud"
                          >
                            <Volume2 size={16} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {msg.hasImage && (
                          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Paperclip size={12}/> Image Attached
                          </div>
                        )}
                        <span>{msg.text}</span>
                      </div>
                    )}
                  </div>
                  <div className="msg-time">{getTime()}</div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="message bot">
              <div className="avatar bot">🤖</div>
              <div className="typing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}

          {showRecommendationBtn && (
            <div className="message bot">
              <div className="avatar bot">🤖</div>
              <div className="bubble bot" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p>{t.recommend_prompt}</p>
                <button className="submit-btn" onClick={handleRecommendation}>
                  {t.recommend_btn}
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {!isLoading && messages.length > 0 && messages.length < 3 && !showLeadForm && (
          <div className="quick-replies">
            {t.quick_replies.map((reply, idx) => (
              <button key={idx} className="quick-btn" onClick={() => handleSendMessage(reply.text)}>
                <span>{reply.icon}</span>
                <span>{reply.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={{ position: 'relative' }}>
          {selectedImage && (
            <div className="image-preview-container">
              <img src={selectedImage} alt="Preview" className="image-preview" />
              <button className="remove-image-btn" onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                <X size={14} />
              </button>
            </div>
          )}
          
          <div className="input-area">
            <div className="input-box">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleImageChange} 
              />
              <button 
                className="icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                style={{ width: '32px', height: '32px', border: 'none', color: selectedImage ? 'var(--primary)' : 'var(--text-secondary)' }}
                title="Attach Image"
              >
                <Paperclip size={18} />
              </button>
              
              <textarea
                id="userInput"
                ref={textareaRef}
                placeholder={t.placeholder}
                rows="1"
                maxLength="2000"
                value={inputMessage}
                onChange={handleTextareaInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }
                }}
              />
              
              <button 
                className="icon-btn"
                onClick={handleListen}
                disabled={isLoading}
                style={{ width: '32px', height: '32px', border: 'none', background: isListening ? '#ff4d4d' : 'transparent', color: isListening ? '#fff' : 'var(--text-secondary)' }}
                title="Speak"
              >
                <Mic size={18} />
              </button>
              
              <button 
                className="send-btn"
                onClick={() => handleSendMessage(inputMessage)}
                disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: '17px', height: '17px', fill: 'currentColor' }}>
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
            
            <div className="footer-bar">
              <span className="footer-hint">{t.footerHint}</span>
              <button className="new-chat-btn" onClick={handleNewChat}>
                🔄 <span>{t.newChat}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t.lead_prompt}</h2>
            <form onSubmit={handleLeadSubmit} className="lead-form">
              <input required type="text" placeholder={t.name} value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} />
              <input required type="email" placeholder={t.email} value={leadData.email} onChange={e => setLeadData({...leadData, email: e.target.value})} />
              <input type="tel" placeholder={t.phone} value={leadData.phone} onChange={e => setLeadData({...leadData, phone: e.target.value})} />
              <select value={leadData.program} onChange={e => setLeadData({...leadData, program: e.target.value})}>
                <option value="">{t.program_select}</option>
                <option value="Semiconductor Technology">Semiconductor Technology</option>
                <option value="Artificial Intelligence">Artificial Intelligence (AI)</option>
                <option value="Business Administration">Business Administration</option>
                <option value="Finance">Finance</option>
              </select>
              <button type="submit" className="submit-btn">{t.submit_lead}</button>
              <button type="button" className="cancel-btn" onClick={() => { setShowLeadForm(false); setLeadDismissed(true); }}>{t.cancel_lead}</button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div id="toast" className={toastMessage ? 'show' : ''}>
        {toastMessage}
      </div>
    </div>
  );
}
