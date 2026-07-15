import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, GraduationCap, Users, Globe, Sun, Moon, Mic, Volume2, Paperclip, X } from 'lucide-react';
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

export default function Chat({ lang, setLang, theme, setTheme }) {
  const navigate = useNavigate();
  const t = TRANSLATIONS[lang];

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_messages');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 1,
        sender: 'bot',
        text: t.welcome
      }
    ];
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '', program: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  
  const [sessionId] = useState(() => {
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
  const fileInputRef = useRef(null);

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
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages, isLoading, leadSubmitted, showLeadForm]);

  // Update initial message when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].sender === 'bot') {
      setMessages([{ id: 1, sender: 'bot', text: t.welcome }]);
    }
  }, [lang, t.welcome]);

  const handleSendMessage = async (text) => {
    if (!text.trim() && !selectedImage) return;

    const userMsg = { id: Date.now(), sender: 'user', text, hasImage: !!selectedImage };
    setMessages((prev) => [...prev, userMsg]);
    
    const imageToSend = selectedImage;
    setInputMessage('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.sender, text: m.text }));
      
      const payload = { message: text, history, sessionId, language: lang };
      if (imageToSend) {
        payload.imageBase64 = imageToSend; // Format: "data:image/png;base64,iVBORw0KGgo..."
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
    
    // Explicitly set voice to fix Vietnamese reading issue in some browsers
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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
            onClick={() => navigate('/admin')} 
            title="Admin Dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--panel-border)', borderRadius: '20px', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
          >
            <Users size={18} />
            <span style={{ fontWeight: 'bold' }}>Admin</span>
          </button>

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
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-area">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.sender === 'bot' ? (
                  <div style={{ position: 'relative' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    {msg.text && (
                      <button 
                        onClick={() => handleSpeak(msg.text, msg.id)}
                        style={{ position: 'absolute', top: '0', right: '-25px', background: 'none', border: 'none', color: speakingMsgId === msg.id ? 'var(--asia-green)' : 'var(--text-primary)', cursor: 'pointer', padding: '5px' }}
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
                    <p>{msg.text}</p>
                  </div>
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
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageChange} 
            />
            <button 
              className="send-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              style={{ marginRight: '0.5rem', background: 'var(--panel-border)', color: selectedImage ? 'var(--asia-green)' : 'var(--text-primary)' }}
              title="Attach Image"
            >
              <Paperclip size={20} />
            </button>
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
              onClick={handleListen}
              disabled={isLoading}
              style={{ marginRight: '0.5rem', background: isListening ? '#ff4d4d' : 'var(--panel-border)', color: isListening ? '#fff' : 'var(--text-primary)' }}
              title="Speak"
            >
              <Mic size={20} />
            </button>
            <button 
              className="send-button"
              onClick={() => handleSendMessage(inputMessage)}
              disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
      
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
              <button type="button" className="cancel-btn" onClick={() => setShowLeadForm(false)}>{t.cancel_lead}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
