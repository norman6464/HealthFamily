import { Link } from 'react-router-dom';
import { CharacterSelector } from '../components/character/CharacterSelector';

export default function Settings() {
  return (
    <div className="max-w-md mx-auto p-4 pb-20">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-primary-700">設定</h1>
      </header>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">キャラクター選択</h2>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <CharacterSelector />
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">🏠</span>
            ホーム
          </Link>
          <Link to="/members" className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">👥</span>
            メンバー
          </Link>
          <button className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">💊</span>
            お薬
          </button>
          <Link to="/settings" className="flex flex-col items-center text-primary-600 text-xs">
            <span className="text-lg">👤</span>
            設定
          </Link>
        </div>
      </nav>
    </div>
  );
}
