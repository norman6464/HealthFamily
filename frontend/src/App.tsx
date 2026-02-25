import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Medications from './pages/Medications';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/:memberId/medications" element={<Medications />} />
      </Routes>
    </div>
  );
}

export default App;
