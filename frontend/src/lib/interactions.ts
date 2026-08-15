// 薬の飲み合わせ(相互作用)簡易チェック
// 外部APIは使わず、薬剤名のキーワード一致ベースの静的ルールセットで判定する。
// 医療的な正確性を保証するものではなく、あくまで注意喚起のための簡易チェックである。

export type InteractionLevel = "info" | "warning" | "danger";

export interface InteractionWarning {
  level: InteractionLevel;
  title: string;
  detail: string;
  drugs: string[];
}

/** 免責文言 */
export const INTERACTION_DISCLAIMER =
  "本チェックは簡易的なものです。実際の服用は必ず医師・薬剤師にご相談ください。";

/**
 * 相互作用ルール。
 * groups の各配列のうち「いずれか1つ以上」がそれぞれマッチした場合に警告を出す。
 * 例: groups: [["ワルファリン"], ["アスピリン", "イブプロフェン"]] は
 *     ワルファリン系 かつ (アスピリン系 または イブプロフェン系) が同時に存在する場合に発火する。
 */
interface InteractionRule {
  level: InteractionLevel;
  title: string;
  detail: string;
  groups: string[][];
}

// キーワードは小文字化して部分一致で判定する
const RULES: InteractionRule[] = [
  {
    level: "danger",
    title: "ワルファリンと解熱鎮痛薬(NSAIDs)の併用",
    detail:
      "ワルファリン(抗凝固薬)とNSAIDs・アスピリンを併用すると、出血のリスクが高まる可能性があります。",
    groups: [
      ["ワルファリン", "warfarin", "ワーファリン"],
      [
        "アスピリン",
        "aspirin",
        "イブプロフェン",
        "ibuprofen",
        "ロキソプロフェン",
        "loxoprofen",
        "ロキソニン",
        "ジクロフェナク",
        "diclofenac",
        "ボルタレン",
        "nsaid",
        "ナプロキセン",
        "naproxen",
      ],
    ],
  },
  {
    level: "warning",
    title: "ワルファリンとビタミンK(納豆など)",
    detail:
      "ワルファリンの効果はビタミンKによって弱まります。納豆・青汁・クロレラ・ビタミンKサプリは避けるのが一般的です。",
    groups: [
      ["ワルファリン", "warfarin", "ワーファリン"],
      ["納豆", "ビタミンk", "vitamin k", "青汁", "クロレラ", "vitamink"],
    ],
  },
  {
    level: "danger",
    title: "MAO阻害薬と他の抗うつ薬・特定薬剤の併用",
    detail:
      "MAO阻害薬とSSRI・SNRI・三環系抗うつ薬などの併用は、セロトニン症候群など重篤な反応を起こす可能性があります。",
    groups: [
      ["mao阻害", "mao阻害薬", "maoi", "セレギリン", "selegiline", "エフピー"],
      [
        "ssri",
        "snri",
        "セルトラリン",
        "sertraline",
        "パロキセチン",
        "paroxetine",
        "フルボキサミン",
        "fluvoxamine",
        "デュロキセチン",
        "duloxetine",
        "三環系",
        "イミプラミン",
        "imipramine",
        "ペチジン",
        "pethidine",
        "トラマドール",
        "tramadol",
      ],
    ],
  },
  {
    level: "danger",
    title: "複数のNSAIDsの併用",
    detail:
      "複数の解熱鎮痛薬(NSAIDs)を併用すると、胃腸障害や腎機能障害のリスクが高まる可能性があります。",
    groups: [
      [
        "アスピリン",
        "aspirin",
        "イブプロフェン",
        "ibuprofen",
        "ロキソプロフェン",
        "loxoprofen",
        "ロキソニン",
        "ジクロフェナク",
        "diclofenac",
        "ボルタレン",
        "ナプロキセン",
        "naproxen",
        "セレコキシブ",
        "celecoxib",
      ],
      [
        "アスピリン",
        "aspirin",
        "イブプロフェン",
        "ibuprofen",
        "ロキソプロフェン",
        "loxoprofen",
        "ロキソニン",
        "ジクロフェナク",
        "diclofenac",
        "ボルタレン",
        "ナプロキセン",
        "naproxen",
        "セレコキシブ",
        "celecoxib",
      ],
    ],
  },
  {
    level: "warning",
    title: "グレープフルーツと一部の降圧薬・脂質異常症薬",
    detail:
      "グレープフルーツ(ジュース)は一部のカルシウム拮抗薬やスタチンの血中濃度を上げ、副作用が出やすくなる可能性があります。",
    groups: [
      ["グレープフルーツ", "grapefruit"],
      [
        "アムロジピン",
        "amlodipine",
        "ニフェジピン",
        "nifedipine",
        "アゼルニジピン",
        "ベニジピン",
        "アトルバスタチン",
        "atorvastatin",
        "シンバスタチン",
        "simvastatin",
        "スタチン",
        "statin",
      ],
    ],
  },
  {
    level: "warning",
    title: "テトラサイクリン系・ニューキノロン系とカルシウム・鉄剤",
    detail:
      "抗菌薬(テトラサイクリン系・ニューキノロン系)はカルシウムや鉄・マグネシウムと結合し、効果が弱まる可能性があります。時間をずらして服用します。",
    groups: [
      [
        "テトラサイクリン",
        "tetracycline",
        "ミノサイクリン",
        "minocycline",
        "ドキシサイクリン",
        "doxycycline",
        "レボフロキサシン",
        "levofloxacin",
        "シプロフロキサシン",
        "ciprofloxacin",
        "クラビット",
        "ニューキノロン",
      ],
      ["カルシウム", "calcium", "鉄剤", "鉄", "iron", "マグネシウム", "magnesium", "制酸"],
    ],
  },
  {
    level: "warning",
    title: "カリウム保持性利尿薬・ACE阻害薬とカリウム",
    detail:
      "ACE阻害薬・ARB・カリウム保持性利尿薬とカリウム製剤の併用は、高カリウム血症のリスクがあります。",
    groups: [
      [
        "スピロノラクトン",
        "spironolactone",
        "ace阻害",
        "エナラプリル",
        "enalapril",
        "arb",
        "ロサルタン",
        "losartan",
        "カンデサルタン",
        "candesartan",
      ],
      ["カリウム", "potassium", "アスパラk", "塩化カリウム"],
    ],
  },
  {
    level: "info",
    title: "アルコールと中枢神経抑制薬・睡眠薬",
    detail:
      "睡眠薬・抗不安薬・抗ヒスタミン薬とアルコールの併用は、過度の眠気や呼吸抑制を招くことがあります。",
    groups: [
      [
        "睡眠薬",
        "ベンゾジアゼピン",
        "benzodiazepine",
        "ゾルピデム",
        "zolpidem",
        "マイスリー",
        "ブロチゾラム",
        "デパス",
        "エチゾラム",
        "抗ヒスタミン",
      ],
      ["アルコール", "alcohol", "お酒"],
    ],
  },
  {
    level: "info",
    title: "メトトレキサートとNSAIDs",
    detail:
      "メトトレキサートとNSAIDsの併用は、メトトレキサートの血中濃度を上げ、副作用が強まる可能性があります。",
    groups: [
      ["メトトレキサート", "methotrexate", "リウマトレックス"],
      [
        "アスピリン",
        "aspirin",
        "イブプロフェン",
        "ibuprofen",
        "ロキソプロフェン",
        "loxoprofen",
        "ロキソニン",
        "nsaid",
      ],
    ],
  },
];

function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

/** ルールの1グループに対し、マッチした薬剤名(元の名前)を返す */
function matchGroup(group: string[], meds: { name: string; normalized: string }[]): string[] {
  const matched: string[] = [];
  for (const med of meds) {
    if (group.some((kw) => med.normalized.includes(normalize(kw)))) {
      matched.push(med.name);
    }
  }
  return matched;
}

/**
 * 飲み合わせをチェックする。
 * - 静的ルールセットによる相互作用の検出
 * - 同名薬の重複登録の検出
 */
export function checkInteractions(meds: { name: string }[]): InteractionWarning[] {
  const warnings: InteractionWarning[] = [];

  const prepared = meds
    .filter((m) => m.name && m.name.trim().length > 0)
    .map((m) => ({ name: m.name, normalized: normalize(m.name) }));

  // --- 同名薬の重複検出 ---
  const seen = new Map<string, string[]>();
  for (const m of prepared) {
    const list = seen.get(m.normalized) ?? [];
    list.push(m.name);
    seen.set(m.normalized, list);
  }
  for (const [, names] of seen) {
    if (names.length >= 2) {
      warnings.push({
        level: "warning",
        title: "同じ薬が重複して登録されています",
        detail:
          "同一の薬が複数登録されています。二重服用にならないよう、登録内容をご確認ください。",
        drugs: [...new Set(names)],
      });
    }
  }

  // --- 相互作用ルールの判定 ---
  for (const rule of RULES) {
    // 各グループでマッチした薬剤名を取得
    const matchedPerGroup = rule.groups.map((g) => matchGroup(g, prepared));

    // すべてのグループが少なくとも1件マッチする必要がある
    if (matchedPerGroup.some((m) => m.length === 0)) continue;

    // 同一グループ内の自己マッチ(NSAIDs同士など)の場合、最低2剤必要
    const allMatched = matchedPerGroup.flat();
    const uniqueDrugs = [...new Set(allMatched)];
    if (uniqueDrugs.length < 2) continue;

    warnings.push({
      level: rule.level,
      title: rule.title,
      detail: rule.detail,
      drugs: uniqueDrugs,
    });
  }

  // 重大度の高い順に並べる
  const order: Record<InteractionLevel, number> = { danger: 0, warning: 1, info: 2 };
  warnings.sort((a, b) => order[a.level] - order[b.level]);

  return warnings;
}
