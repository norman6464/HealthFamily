import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Medications from './pages/Medications';
import Settings from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:memberId/medications" element={<Medications />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
