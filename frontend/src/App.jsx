import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import './index.css';

function App() {
  const [lang, setLang] = useState('en');
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat lang={lang} setLang={setLang} />} />
        <Route path="/admin" element={<Admin lang={lang} setLang={setLang} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
