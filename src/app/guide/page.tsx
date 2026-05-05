'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Home,
  Pill,
  Activity,
  Calendar,
  Settings,
  Users,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface GuideSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  steps: {
    title: string;
    description: string;
  }[];
}

const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    icon: <Home size={20} className="text-primary-600" />,
    title: 'はじめに（初期設定）',
    steps: [
      {
        title: '1. メンバーを登録する',
        description:
          'お薬タブ、またはホーム画面の案内から「メンバーを登録」をタップします。ご家族の名前やペットの名前を登録してください。人間・ペットどちらも登録できます。',
      },
      {
        title: '2. お薬を登録する',
        description:
          'お薬タブの「＋」ボタンからお薬を追加します。お薬の名前、メンバー、カテゴリ（内服薬・外用薬など）を入力してください。',
      },
      {
        title: '3. スケジュールを設定する',
        description:
          'お薬の詳細画面から「スケジュール追加」をタップ。服薬する時間と曜日（または間隔）を設定すると、ホーム画面に毎日の予定が表示されます。',
      },
    ],
  },
  {
    id: 'daily-use',
    icon: <Check size={20} className="text-green-600" />,
    title: '毎日の使い方',
    steps: [
      {
        title: 'ホーム画面で予定を確認',
        description:
          'ホーム画面に今日の服薬予定が時間順で表示されます。メンバーごとにフィルタリングもできます。',
      },
      {
        title: 'お薬を飲んだらチェック',
        description:
          '各予定の右側にある緑色のチェックボタンをタップすると、服薬記録がつきます。日付を変更してメモを追加することもできます（例：「昨日の飲み忘れ分」）。',
      },
      {
        title: '飲み忘れアラートを確認',
        description:
          'ホーム画面の上部に、過去7日間の飲み忘れが赤いアラートで表示されます。飲み忘れに気づいたら「履歴から記録を追加」から記録できます。',
      },
    ],
  },
  {
    id: 'history',
    icon: <Calendar size={20} className="text-blue-600" />,
    title: '履歴の確認・記録の追加',
    steps: [
      {
        title: 'カレンダーで履歴を確認',
        description:
          '通院タブの隣にある服薬履歴ページでは、カレンダー形式で記録を確認できます。日付をタップすると、その日の詳細が表示されます。色の濃さで記録の多さがわかります。',
      },
      {
        title: '過去の記録を追加する',
        description:
          'カレンダーで日付を選択し、「＋ 記録を追加」をタップ。メンバーとお薬を選んで登録できます。複数のお薬を一度に選択して同時登録も可能です。',
      },
      {
        title: 'メモの編集・削除',
        description:
          '各記録の鉛筆アイコンをタップするとメモを編集できます。ゴミ箱アイコンで記録自体の削除もできます。',
      },
    ],
  },
  {
    id: 'medications',
    icon: <Pill size={20} className="text-primary-600" />,
    title: 'お薬の管理',
    steps: [
      {
        title: 'お薬の一覧',
        description:
          'お薬タブでは登録したお薬が一覧表示されます。タップすると詳細・スケジュール・在庫情報を確認できます。',
      },
      {
        title: '在庫の管理',
        description:
          'お薬の詳細画面で在庫数を設定できます。残りが少なくなると、ホーム画面に在庫アラートが表示されます。',
      },
      {
        title: 'スケジュールの設定',
        description:
          '毎日・特定の曜日・○日おきなど、柔軟にスケジュールを設定できます。リマインダーの通知時間も個別に設定可能です。',
      },
    ],
  },
  {
    id: 'members',
    icon: <Users size={20} className="text-purple-600" />,
    title: 'メンバーの管理',
    steps: [
      {
        title: 'メンバーの追加',
        description:
          'お薬タブの上部、またはメンバー管理ページから家族やペットを追加できます。名前とタイプ（人間・ペット）を設定します。',
      },
      {
        title: 'メンバーの詳細',
        description:
          'メンバーをタップすると、そのメンバー専用の情報（お薬・通院・アレルギー・予防接種・体重記録など）をまとめて確認できます。',
      },
    ],
  },
  {
    id: 'health-logs',
    icon: <Activity size={20} className="text-orange-600" />,
    title: '体調の記録',
    steps: [
      {
        title: '体調を記録する',
        description:
          '体調タブから日々の体調を記録できます。体温、症状、気分などを入力して、体調の変化を把握しましょう。',
      },
      {
        title: '記録を振り返る',
        description:
          '過去の体調記録を一覧で確認できます。通院時に医師に体調の変化を伝えるのに役立ちます。',
      },
    ],
  },
  {
    id: 'appointments',
    icon: <Calendar size={20} className="text-teal-600" />,
    title: '通院の管理',
    steps: [
      {
        title: '通院予定を追加',
        description:
          '通院タブから予約情報を登録できます。病院名、日時、診療科目などを記録しましょう。',
      },
      {
        title: 'ホーム画面でリマインド',
        description:
          '近日中の通院予定がホーム画面に表示されるので、うっかり忘れを防げます。',
      },
    ],
  },
  {
    id: 'settings',
    icon: <Settings size={20} className="text-gray-600" />,
    title: '設定',
    steps: [
      {
        title: '通知設定',
        description:
          '設定画面から通知のON/OFF、リマインダーのタイミングなどを調整できます。',
      },
      {
        title: '緊急連絡先',
        description:
          'かかりつけ医や家族の連絡先を登録しておくと、いざという時にすぐ確認できます。',
      },
      {
        title: 'キャラクター選択',
        description:
          'ホーム画面に表示されるキャラクターを変更できます。お好みのキャラクターを選んでください。',
      },
    ],
  },
];

export default function GuidePage() {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['getting-started', 'daily-use']),
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-gradient-header shadow-soft">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center space-x-3">
          <Link
            href="/settings"
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="設定に戻る"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-white tracking-wide">使い方ガイド</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-3">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
          <h2 className="text-sm font-bold text-primary-800 mb-1">
            HealthFamily へようこそ
          </h2>
          <p className="text-xs text-primary-700 leading-relaxed">
            家族やペットのお薬・通院・体調をまとめて管理できるアプリです。
            まずはメンバーとお薬を登録して、毎日の服薬チェックを始めましょう。
          </p>
        </div>

        {guideSections.map((section) => {
          const isOpen = openSections.has(section.id);
          return (
            <div
              key={section.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                id={`guide-button-${section.id}`}
                aria-expanded={isOpen}
                aria-controls={`guide-panel-${section.id}`}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <span className="text-sm font-semibold text-gray-800">
                    {section.title}
                  </span>
                </div>
                {isOpen ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>
              {isOpen && (
                <div id={`guide-panel-${section.id}`} role="region" aria-labelledby={`guide-button-${section.id}`} className="px-4 pb-4 space-y-3">
                  {section.steps.map((step, idx) => (
                    <div key={idx} className="flex space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
