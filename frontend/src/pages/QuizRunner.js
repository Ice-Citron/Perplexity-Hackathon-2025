import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { subscribeToAuthChanges } from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const TIME_LIMIT = 10; // seconds per question

const PHILOSOPHICAL_QUOTES = [
  { quote: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
  { quote: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle" },
  { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { quote: "The unexamined life is not worth living.", author: "Socrates" },
  { quote: "Patience is bitter, but its fruit is sweet.", author: "Aristotle" },
  { quote: "He who is not a good servant will not be a good master.", author: "Plato" },
  { quote: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { quote: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
  { quote: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius" },
  { quote: "While we are postponing, life speeds by.", author: "Seneca" },
  { quote: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { quote: "We suffer more often in imagination than in reality.", author: "Seneca" }
];

function QuizRunner() {
  const { topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const topicName = location.state?.topicName || topicId;

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [randomQuote] = useState(() => PHILOSOPHICAL_QUOTES[Math.floor(Math.random() * PHILOSOPHICAL_QUOTES.length)]);

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load quiz questions
  useEffect(() => {
    loadQuiz();
  }, [topicName]);

  // Timer countdown
  useEffect(() => {
    if (loading || isAnswerLocked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, loading, isAnswerLocked]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      console.log('[QuizRunner] Loading quiz...');
      console.log('[QuizRunner] Topic:', topicName);
      console.log('[QuizRunner] API_BASE_URL:', API_BASE_URL);
      console.log('[QuizRunner] Fetching:', `${API_BASE_URL}/api/quizzes/generate`);

      const response = await fetch(`${API_BASE_URL}/api/quizzes/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicName, numQuestions: 8 })
      });

      console.log('[QuizRunner] Response status:', response.status);
      console.log('[QuizRunner] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[QuizRunner] Error response:', errorText);
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      console.log('[QuizRunner] Received data:', data);
      console.log('[QuizRunner] Session ID:', data.sessionId);
      console.log('[QuizRunner] Questions count:', data.questions?.length || 0);

      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
    } catch (err) {
      console.error('[QuizRunner] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    // Auto-advance when timer expires
    handleNextQuestion();
  };

  const handleAnswerSelect = (optionIndex) => {
    if (isAnswerLocked) return;

    setSelectedAnswer(optionIndex);
    setIsAnswerLocked(true);

    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);

    // Auto-advance after 1 second
    setTimeout(() => {
      handleNextQuestion();
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeLeft(TIME_LIMIT);
      setIsAnswerLocked(false);
    } else {
      // Submit quiz
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      console.log('[QuizRunner] Submitting quiz...');
      console.log('[QuizRunner] Session ID:', sessionId);
      console.log('[QuizRunner] Answers:', answers);
      console.log('[QuizRunner] User ID:', currentUser?.uid || null);
      console.log('[QuizRunner] Current User:', currentUser);
      console.log('[QuizRunner] Fetching:', `${API_BASE_URL}/api/quizzes/submit`);

      const response = await fetch(`${API_BASE_URL}/api/quizzes/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers,
          userId: currentUser?.uid || null
        })
      });

      console.log('[QuizRunner] Submit response status:', response.status);
      console.log('[QuizRunner] Submit response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[QuizRunner] Submit error response:', errorText);
        throw new Error('Failed to submit quiz');
      }

      const result = await response.json();
      console.log('[QuizRunner] Submit result:', result);
      console.log('[QuizRunner] Result ID:', result.resultId);

      // Navigate to results page
      navigate(`/quizzes/results/${result.resultId}`, {
        state: { result }
      });
    } catch (err) {
      console.error('[QuizRunner] Submit error:', err);
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fff2dc'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex items-start justify-center pt-20 p-6" style={{backgroundColor: '#fff2dc'}}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
          <div className="text-center">
            {/* Animated thinking icon */}
            <div className="mb-6 relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1">
                <span className="flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600"></span>
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Analyzing Your Performance...
            </h2>
            <p className="text-gray-600 mb-8">
              Our AI is generating personalized feedback and insights for you
            </p>

            {/* Progress bar */}
            <div className="bg-gray-200 rounded-full h-2 mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '66%' }}></div>
            </div>

            {/* Philosophical quote */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-l-4 border-emerald-700">
              <p className="text-gray-700 italic text-lg mb-3">
                "{randomQuote.quote}"
              </p>
              <p className="text-gray-600 font-medium">
                — {randomQuote.author}
              </p>
            </div>

            {/* Loading dots */}
            <div className="mt-6 flex justify-center gap-2">
              <div className="w-3 h-3 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-emerald-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#fff2dc'}}>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/quizzes')}
              className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen" style={{backgroundColor: '#fff2dc'}}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{topicName}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <button
              onClick={() => navigate('/quizzes')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Timer */}
          <div className="flex items-center justify-center mb-8">
            <div className={`relative w-24 h-24 ${timeLeft <= 2 ? 'animate-pulse' : ''}`}>
              <svg className="transform -rotate-90 w-24 h-24">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={timeLeft <= 2 ? '#ef4444' : '#3b82f6'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - timeLeft / TIME_LIMIT)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-bold ${timeLeft <= 2 ? 'text-red-500' : 'text-emerald-700'}`}>
                  {timeLeft}
                </span>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {currentQuestion.question_text}
            </h2>
            <p className="text-sm text-gray-500 text-center">
              Select your answer
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isDisabled = isAnswerLocked;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isDisabled}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-white scale-105'
                      : 'border-gray-200 hover:border-emerald-600 hover:bg-emerald-50'
                  } ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className={`text-lg ${isSelected ? 'text-emerald-900 font-medium' : 'text-gray-700'}`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default QuizRunner;
