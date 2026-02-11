export default function Dashboard() {
  return (
    <div className="max-w-md mx-auto p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-primary-700">HealthFamily</h1>
      </header>

      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 text-center">
        <div className="text-4xl mb-2">🐈️</div>
        <p className="text-lg font-medium text-gray-700">
          お薬の時間だにゃい！
        </p>
      </div>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">今日の予定</h2>
        <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          <p className="p-4 text-gray-400 text-center text-sm">
            スケジュールを登録してください
          </p>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <button className="flex flex-col items-center text-primary-600 text-xs">
            <span className="text-lg">🏠</span>
            ホーム
          </button>
          <button className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">💊</span>
            お薬
          </button>
          <button className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">📅</span>
            通院
          </button>
          <button className="flex flex-col items-center text-gray-400 text-xs">
            <span className="text-lg">👤</span>
            設定
          </button>
        </div>
      </nav>
    </div>
  );
}
