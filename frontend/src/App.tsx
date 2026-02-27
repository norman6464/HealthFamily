import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Medications from './pages/Medications';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/members/:memberId/medications" element={<ProtectedRoute><Medications /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
