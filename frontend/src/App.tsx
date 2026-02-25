import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
      </Routes>
    </div>
  );
}

export default App;
