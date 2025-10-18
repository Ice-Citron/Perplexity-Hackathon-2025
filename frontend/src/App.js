import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NewsFeed from './pages/NewsFeed';
import ArticleDetail from './pages/ArticleDetail';
import QuizzesLanding from './pages/QuizzesLanding';
import QuizRunner from './pages/QuizRunner';
import QuizResults from './pages/QuizResults';
import Leaderboard from './pages/Leaderboard';
import DailyQuizzes from './pages/DailyQuizzes';
import Profile from './pages/Profile';
import QuizHistory from './pages/QuizHistory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<NewsFeed />} />
        <Route path="/article/:id" element={<ArticleDetail />} />
        <Route path="/quizzes" element={<QuizzesLanding />} />
        <Route path="/quizzes/daily" element={<DailyQuizzes />} />
        <Route path="/quizzes/:topicId" element={<QuizRunner />} />
        <Route path="/quizzes/results/:resultId" element={<QuizResults />} />
        <Route path="/quiz-results/:resultId" element={<QuizResults />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/quiz-history" element={<QuizHistory />} />
      </Routes>
    </Router>
  );
}

export default App;
