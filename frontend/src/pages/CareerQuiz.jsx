import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, Compass, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const questions = [
  {
    id: 1,
    question: "Bạn thích làm việc trong môi trường nào nhất?",
    options: [
      "Trong văn phòng yên tĩnh với máy tính & công nghệ",
      "Thường xuyên giao tiếp, gặp gỡ nhiều người",
      "Làm việc với số liệu, phân tích biểu đồ",
      "Năng động, linh hoạt và được đưa ra chiến lược"
    ]
  },
  {
    id: 2,
    question: "Khi gặp một bài toán khó, bạn thường...",
    options: [
      "Tự mày mò tìm cách giải quyết bằng logic và kỹ thuật",
      "Thảo luận với nhóm để tìm ra giải pháp chung",
      "Tính toán rủi ro và tìm phương án tối ưu nhất về chi phí",
      "Phân tích hệ thống và tối ưu hóa các quy trình"
    ]
  },
  {
    id: 3,
    question: "Mục tiêu nghề nghiệp tương lai của bạn thiên về hướng nào?",
    options: [
      "Chuyên gia phát triển phần mềm / AI / Kỹ sư chip",
      "Xây dựng sản phẩm, làm marketing hoặc Sales",
      "Chuyên gia phân tích tài chính / Đầu tư",
      "Quản lý, Giám đốc hoặc Tự khởi nghiệp (CEO)"
    ]
  }
];

function CareerQuiz({ lang }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSelect = (option) => {
    const newAnswers = { ...answers, [currentStep]: option };
    setAnswers(newAnswers);
    
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    setIsLoading(true);
    try {
      const answersList = Object.values(finalAnswers);
      const res = await axios.post('/api/quiz', {
        answers: answersList,
        language: lang
      });
      setResult(res.data.recommendation);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      setResult("Rất tiếc, hệ thống đang bận. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
  };

  return (
    <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
      
      <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
        >
          <ArrowLeft size={20} />
          {lang === 'en' ? 'Back to Chat' : 'Quay lại Trợ lý AI'}
        </button>
      </div>

      <div className="quiz-card" style={{
        background: 'rgba(25, 25, 35, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--panel-border)',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
        {/* Glow effect */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, var(--asia-gold) 0%, transparent 70%)', opacity: '0.1', filter: 'blur(40px)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {!result && !isLoading && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <Compass size={48} color="var(--asia-gold)" style={{ margin: '0 auto 1rem' }} />
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  {lang === 'en' ? 'Career Compass' : 'La Bàn Nghề Nghiệp'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  {lang === 'en' ? 'Discover the perfect major for you at Asia University.' : 'Khám phá ngành học phù hợp nhất với bạn tại Asia University.'}
                </p>
                
                {/* Progress bar */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '2rem' }}>
                  {questions.map((_, idx) => (
                    <div key={idx} style={{
                      height: '6px',
                      width: '40px',
                      borderRadius: '3px',
                      background: idx <= currentStep ? 'var(--asia-gold)' : 'var(--panel-border)',
                      transition: 'all 0.3s'
                    }} />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
                  {questions[currentStep].question}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {questions[currentStep].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelect(opt)}
                      style={{
                        padding: '1.25rem 1.5rem',
                        background: answers[currentStep] === opt ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${answers[currentStep] === opt ? 'var(--asia-gold)' : 'var(--panel-border)'}`,
                        borderRadius: '12px',
                        color: answers[currentStep] === opt ? 'var(--asia-gold)' : 'var(--text-primary)',
                        fontSize: '1.1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => {
                        if(answers[currentStep] !== opt) {
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if(answers[currentStep] !== opt) {
                          e.currentTarget.style.borderColor = 'var(--panel-border)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }
                      }}
                    >
                      {opt}
                      {answers[currentStep] === opt ? <CheckCircle2 size={24} /> : <ChevronRight size={24} color="var(--text-secondary)" opacity={0.5} />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {isLoading && (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <div className="spinner" style={{ margin: '0 auto 2rem' }}></div>
              <h2 style={{ color: 'var(--asia-gold)' }}>
                {lang === 'en' ? 'AI is analyzing your profile...' : 'AI đang phân tích hồ sơ của bạn...'}
              </h2>
            </div>
          )}

          {result && !isLoading && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
              <Sparkles size={48} color="var(--asia-green)" style={{ margin: '0 auto 1.5rem' }} />
              <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                {lang === 'en' ? 'Your Result' : 'Kết Quả Của Bạn'}
              </h2>
              
              <div style={{ 
                background: 'rgba(76, 175, 80, 0.1)', 
                border: '1px solid var(--asia-green)',
                borderRadius: '16px',
                padding: '2.5rem',
                fontSize: '1.2rem',
                lineHeight: '1.8',
                color: 'var(--text-primary)',
                textAlign: 'left',
                marginBottom: '3rem'
              }}>
                <div dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--asia-gold)">$1</strong>') }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={resetQuiz}
                  style={{
                    padding: '1rem 2rem',
                    background: 'transparent',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '30px',
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {lang === 'en' ? 'Retake Quiz' : 'Làm Lại Trắc Nghiệm'}
                </button>
                <button 
                  onClick={() => navigate('/')}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, var(--asia-gold), #b8860b)',
                    border: 'none',
                    borderRadius: '30px',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(212, 175, 55, 0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {lang === 'en' ? 'Chat with Advisor' : 'Gặp Cố Vấn Tuyển Sinh'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CareerQuiz;
