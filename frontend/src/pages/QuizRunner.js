import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { subscribeToAuthChanges } from '../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const TIME_LIMIT = 5; // seconds per question

function QuizRunner() {
  const { topicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const topicName = location.state?.topicName || topicId;

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);

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
        body: JSON.stringify({ topic: topicName, numQuestions: 5 })
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
      setLoading(true);
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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/quizzes')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                <span className={`text-3xl font-bold ${timeLeft <= 2 ? 'text-red-500' : 'text-blue-600'}`}>
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
                      ? 'border-blue-600 bg-blue-50 scale-105'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  } ${isDisabled && !isSelected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className={`text-lg ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
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
