package usecase

import "time"

// jst はこのアプリの基準時間帯。
//
// 「今日」の境界も、医療費の年度の区切りも JST で決まる。実行環境の
// time.Local には頼れない。本番コンテナは distroless/static で tzdata を
// 含まないため time.Local は UTC になり、そのまま「今日」を切ると
// 日本時間の 0〜9 時に前日の予定が返ってしまう。毎朝、服薬リマインドが
// 一日ずれる形で壊れる。
//
// time.LoadLocation ではなく FixedZone にしているのは、tzdata が無い
// 環境でも必ず成立させるため。日本には夏時間が無いので固定で足りる。
var jst = time.FixedZone("Asia/Tokyo", 9*60*60)
