import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PassportLayout } from './components/layout/PassportLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssistantPage from './pages/AssistantPage';
import DocumentsPage from './pages/DocumentsPage';
import OCRReviewPage from './pages/OCRReviewPage';
import FormPreviewPage from './pages/FormPreviewPage';
import ReadinessPage from './pages/ReadinessPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<RegisterPage />} />
              <Route path="/register" element={<Navigate to="/signup" replace />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<PassportLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/assistant" element={<AssistantPage />} />
                  <Route path="/documents" element={<DocumentsPage />} />
                  <Route path="/ocr-review" element={<OCRReviewPage />} />
                  <Route path="/form-preview" element={<FormPreviewPage />} />
                  <Route path="/readiness" element={<ReadinessPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
