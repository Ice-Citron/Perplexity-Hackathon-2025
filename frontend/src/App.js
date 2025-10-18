import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NewsFeed from './pages/NewsFeed';
import ArticleDetail from './pages/ArticleDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/news" replace />} />
        <Route path="/news" element={<NewsFeed />} />
        <Route path="/article/:id" element={<ArticleDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
