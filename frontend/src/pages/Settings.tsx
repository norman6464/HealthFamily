import { CharacterSelector } from '../components/character/CharacterSelector';
import { BottomNavigation } from '../components/shared/BottomNavigation';

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

      <BottomNavigation activePath="/settings" />
    </div>
  );
}
