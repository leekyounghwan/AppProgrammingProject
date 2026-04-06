import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ResultPage from './pages/ResultPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quiz/:category" element={<QuizPage />} />
        <Route path="/result/:category" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
