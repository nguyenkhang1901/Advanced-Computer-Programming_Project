import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import './index.css';

function App() {
  const [lang, setLang] = useState('vi');
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  
  React.useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />} />
        <Route path="/admin" element={<Admin lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
