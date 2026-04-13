import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import BottomNav from './components/BottomNav'
import UploadPage from './pages/UploadPage'
import RecipePage from './pages/RecipePage'
import SavedPage from './pages/SavedPage'
import SavedDetailPage from './pages/SavedDetailPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/recipe" element={<RecipePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/saved/:id" element={<SavedDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </AppProvider>
  )
}
