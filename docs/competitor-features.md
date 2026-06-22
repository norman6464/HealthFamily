# 類似SaaS 機能調査（競合比較とギャップ分析）

調査日: 2026年6月 / 対象: HealthFamily（家族・ペットの健康／服薬管理 Webアプリ）

## 調査サマリー

- **「業界の定番」になっている服薬管理機能**は、服薬リマインダー・在庫(リフィル)アラート・家族/介護者への見守り通知。これらは Medisafe / MyTherapy / 国内お薬手帳系すべてが備えており、HealthFamily も大半をカバー済み。
- **HealthFamily に最も足りていない重要機能 Top は (1) マイナポータル/電子処方箋連携、(2) 処方箋・レシートの画像/QR/OCR取込、(3) 薬の飲み合わせ(相互作用)チェック** の3つ。いずれも国内の主要お薬手帳(お薬手帳プラス、EPARK、kakari、アイン)で「あって当たり前」になりつつあり、未対応は競合上の明確なギャップ。
- **PHR領域では Apple ヘルスケア / Google ヘルスコネクト経由のウェアラブル・バイタル自動連携**が標準。HealthFamily は体温・身体測定を手入力で持つが自動連携がなく、入力継続率で不利。
- **医療費控除は HealthFamily の強み**（2制度シミュレーション＋CSV明細書）。ただし業界標準はマイナポータルの「医療費通知」XML自動取得＋家族分一括取得であり、ここを取り込めば手入力を激減でき差別化が一段強まる。
- **ペット領域は「家族共有・カスタム項目・支出管理」が定番**（ペットノート+ 等）。HealthFamily はペットも人と同じ枠組みで一元管理できる点が独自の強みになり得る。
- **横断的な未対応の定番**: 医師共有用PDFエクスポート、データエクスポート、AIアドバイス。特にPDF/レポート出力は MyTherapy 等で標準。

## カテゴリ別 主要プロダクトと注目機能

### 1. 服薬管理・お薬手帳
- **Medisafe**: 受賞歴ある服薬リマインダー、**薬同士の相互作用チェック内蔵**、リフィル(残量)アラート、家族・介護者を "Med-Friend" 登録して飲み忘れ時に自動見守り通知、20以上のバイタル測定項目、HIPAA/GDPR準拠。([Google Play: Medisafe](https://play.google.com/store/apps/details?id=com.medisafe.android.client))
- **MyTherapy**: 服薬・補充リマインダー、**家族プロファイル(共有ケア)**、症状/痛み日記、**月次ヘルスレポートのPDF出力→メール送信**(医師共有・遠隔の高齢家族見守りに活用)、ISO13485/27001取得。([mytherapyapp.com](https://www.mytherapyapp.com/ja))
- **日本調剤「お薬手帳プラス」**: 電子お薬手帳で**国内初のマイナポータル連携**(2022/11)。薬剤情報・処方情報・調剤情報の3種を取込み最大3年分を一元管理、**電子処方箋の閲覧＋薬局への送信**、処方箋送信、オフライン閲覧、会員200万人超。([機能拡張ニュース](https://www.nicho.co.jp/corporate/newsrelease/20230829_nr1/) / [機能紹介](https://portal.okusuriplus.com/feature/))
- **kakari (メドピア)**: マイナポータル連携で2021年9月以降・最大37ヶ月分の薬情報取得(都度カード読取が必要)、調剤明細QRからの薬情報登録。([kakariヘルプ](https://kakari-support.medpeer.jp/hc/ja/articles/360042817853))
- **EPARKお薬手帳**: **飲み合わせ検索**(処方薬×処方薬/×成分/×市販薬、市販薬同士、薬×食品)、マイナポータル連携で過去の薬・検査結果を取得し相互作用を発見。([飲み合わせ検索](https://okusuritecho.epark.jp/renew/medicine_combination))
- **いつでもアイン薬局 / CLINICS(メドレー)**: 処方箋画像の事前アップロード受付、オンライン服薬指導、お薬手帳情報の薬局共有。([アイン薬局](https://www.ainj.co.jp/app/service.html))
- 厚労省「電子版お薬手帳サービス一覧」では、電子処方箋連携・薬剤師との相談機能・副作用報告・他PHR連携・バイタル記録がガイドライン要件として整理されている。([厚労省PDF](https://www.mhlw.go.jp/content/001257615.pdf))

### 2. PHR・家族健康記録
- **Welbyマイカルテ**: 血圧/血糖/体重/食事/運動/睡眠の記録、**血圧計・SMBG・体重計・活動量計と自動連携**、**Apple ヘルスケア連携**、**Google ヘルスコネクト連携**、**CGM(FreeStyleリブレ2)連携**、約2.7万医療機関とデータ共有。([Welbyサービス](https://welby.jp/service/) / [機器連携](https://karte.welby.jp/patient/cooperation.html))
- **Apple ヘルスケア(HealthKit) / Google ヘルスコネクト**: ウェアラブルのバイタル(歩数・心拍・血圧・睡眠・体重等50種以上)を集約する**標準ハブ**。PHRアプリ各社はここ経由で連携するのが定石。([ヘルスコネクト解説](https://www.android.com/intl/ja_jp/articles/healthconnect202403/))
- **あすけん**: 食事/栄養中心、Apple ヘルスケア・ヘルスコネクト連携で歩数・体重を取込。([あすけんFAQ](https://asken.tayori.com/q/s-faq/detail/899469/))

### 3. 介護・見守り
- **チーム型家族介護アプリ**: 1契約で**最大9人**(家族＋ケアマネ等)登録、介護日記・費用(レシート画像)共有、かかりつけ医・事業者の連絡先登録。([しずなび介護なび](https://shizuoka-roujinhome.jp/info/caregiving-record-top-4-apps/))
- **カナミックかんたん介護記録**: 体調・介護内容を簡単記録、健康データのグラフ表示、家族共有。([アスピック](https://www.aspicjapan.org/asu/article/20184))
- **ケアコラボ / ケア記録アプリ(介護サプリ)**: 写真・動画のリアルタイム家族共有、コメントによる双方向、**調剤明細のQR読取で薬情報登録**、LINE家族連携。複数職員の同時編集・権限管理が施設系の標準要件。([介護サプリ](https://kaigosapuri.com/carerecord/option/))

### 4. ペット健康管理
- **ペットノート+ (PetNote+)**: 体重・体温・便など**写真付き記録**、多頭飼い対応、**記録項目を自由にカスタム**、毎日/毎月の**リマインダー通知**、体重・体温の**グラフ化**、薬・ワクチン管理、**家族共有**、**病院代・餌代の支出管理**。([公式LP](https://petnote-plus.com/lp/app/) / [App Store](https://apps.apple.com/jp/app/id1553584485))
- **うちっ子ログ等**: カレンダーで通院・散歩予定を記録、食事管理、家族共有。([アプリブ ペット](https://app-liv.jp/lifestyle/pets/0645/))

### 5. 医療費・家計/医療費控除
- **マネーフォワード クラウド確定申告 / ME**: **マイナポータル連携で医療費通知情報(XML)を自動取得**(2024/7対応)、家族分も代理人設定で一括取得、ME家計簿の「医療費/薬」明細を申告へ取込、国税庁「医療費集計フォーム」インポート。([MF: マイナポータル連携](https://biz.moneyforward.com/support/tax-return/news/new-feature/20240731.html) / [医療費控除操作](https://biz.moneyforward.com/support/tax-return/faq/documentation/medical_expense.html))
- **マイナポータル / e-Tax**: 2021年9月以降の医療費通知を例年2月上旬に1年分一括取得、**家族(配偶者・子)分も代理人設定で取得**、e-Tax作成コーナーで自動反映。通知に載らない費用(年末受診・市販薬・交通費・整骨院)は手入力が必要。([マイナポータルFAQ](https://faq.myna.go.jp/faq/show/7116) / [国税庁 医療費控除特集](https://www.nta.go.jp/taxes/shiraberu/shinkoku/tokushu/keisubetsu/iryou-koujo.htm))

### 6. 横断的な定番機能(専門ツール例)
- **相互作用チェック**: 患者向けは EPARK の飲み合わせ検索、専門向けは KEGG MEDICUS(最大40薬)・QLifePro。([KEGG MEDICUS](https://www.kegg.jp/medicus-bin/select_drug) / [QLifePro](https://meds.qlifepro.com/interaction))
- **処方箋OCR**: Pharmy(モイネット)が処方箋スキャン→OCR自動取込。CARADA Solamichi は相互作用・適応病名禁忌の処方監査。([Pharmy OCR](https://www.moinetsystem.com/system/ocr/) / [Solamichi](https://site.solamichi.com/fn/audit))
- **医師共有PDF/レポート**: MyTherapy の月次PDF出力が代表例。

## 機能比較表

| 機能 | 業界での一般度 | HealthFamilyの現状 | 取り込み優先度 | 備考 |
|---|---|---|---|---|
| 服薬リマインダー(時刻通知) | 定番 | あり | - | 通知設定あり。重要リマインダー/週末別設定など高度化余地 |
| 在庫(残量)アラート | 定番 | あり | - | 在庫アラート実装済 |
| 家族/メンバー管理・共有 | 定番 | あり(部分) | 中 | メンバー管理あり。閲覧/編集の権限分離・見守り通知は要強化 |
| 服薬記録(飲んだチェック) | 定番 | あり | - | 服薬記録あり |
| 通院・費用・病院・処方箋管理 | 普及 | あり | - | HealthFamilyの強み |
| 医療費控除シミュレーション | 新興 | あり(強み) | - | 2制度＋CSV、競合に対し先行 |
| **マイナポータル/医療費通知 取込** | 定番(税)/普及 | なし | **高** | 家族分一括取得で手入力激減。控除機能と直結 |
| **電子処方箋連携(閲覧/送信)** | 普及(拡大中) | なし | **高** | 国内お薬手帳の必須要件化が進行 |
| **処方箋/お薬QR・画像OCR取込** | 定番(お薬手帳) | なし | **高** | 手入力負担の最大要因。導入効果大 |
| **薬の飲み合わせ(相互作用)チェック** | 普及 | なし | **高** | 安全性訴求・差別化。外部DB/API活用 |
| レシートOCR(医療費) | 普及 | 部分(手入力/CSV) | 中 | 控除明細の自動化に寄与 |
| ウェアラブル/HealthKit・ヘルスコネクト連携 | 定番(PHR) | なし | 中 | 体温/身体測定/体調ログの自動化・継続率向上 |
| 医師共有PDF/健康レポート出力 | 普及 | なし(CSVのみ) | 中 | 受診時提示・他者共有に有効 |
| データエクスポート(全体) | 普及 | 部分(CSV) | 中 | ロックイン回避・信頼性 |
| AIアドバイス/異常検知 | 新興 | なし | 低 | 中長期。バイタル蓄積後に価値 |
| 介護見守り(飲み忘れ家族通知/権限) | 普及 | 部分 | 中 | 高齢家族介護シナリオで需要 |
| ペット: カスタム項目・支出・グラフ | 普及 | 部分 | 中 | ペット特化UIで満足度向上 |
| オンライン服薬指導/薬局連携 | 新興 | なし | 低 | 提携が前提でハードル高 |

## HealthFamilyへの推奨追加機能(優先度順)

1. **処方箋・お薬QR / 画像OCR 取込(最優先)** — 服薬・薬・処方箋の手入力が最大の離脱要因。調剤明細QRや処方箋写真からの自動登録は国内お薬手帳で事実上の標準。入力コストを下げることで継続率・LTVが直接改善する。
2. **マイナポータル「医療費通知」XML 自動取得＋家族分一括** — HealthFamilyの強みである医療費控除シミュレーションと直結。家族分を代理人取得して自動集計すれば「家族の医療費を一括で確定申告まで」という独自の完結体験が作れ、確定申告期の強力な集客フックになる。([MF事例](https://biz.moneyforward.com/support/tax-return/news/new-feature/20240731.html), [マイナポータルFAQ](https://faq.myna.go.jp/faq/show/7116))
3. **薬の飲み合わせ(相互作用)チェック** — 家族・ペットで複数人×複数薬を管理する HealthFamily と相性が良く、安全性という強い訴求点になる。外部医薬品DB/APIで処方薬同士・市販薬・食品の警告を実装。Medisafe/EPARK が示す通り差別化機能として機能する。
4. **医師共有PDF / 健康サマリーレポート出力** — 服薬・通院・体調・検査・アレルギーを1枚にまとめて受診時に提示。MyTherapyの月次PDFが好例で、CSVしかない現状を補完し「持っていく価値」を高める。
5. **Apple ヘルスケア / Google ヘルスコネクト連携** — 体温・身体測定・体調ログをウェアラブルから自動取込。手入力を減らし日次アクティブ率を底上げ。PHR標準への準拠は将来のAI/異常検知の土台にもなる。
6. **家族メンバーの権限分離＋見守り通知の強化** — 「閲覧のみ/編集可」の権限、および高齢家族・子の飲み忘れを別の家族へ自動通知(Med-Friend型)。介護シナリオの需要を取り込み、家族SaaSとしての中核価値を強める。
7. **ペット特化の体験向上(カスタム項目・支出・グラフ)** — ペットノート+が示す「自由なカスタム項目＋費用＋グラフ＋家族共有」を強化。人とペットを同一基盤で扱えるのは HealthFamily 独自の競争優位で、ペット層の獲得余地が大きい。
8. **AIアドバイス/バイタル異常検知(中長期)** — 蓄積したバイタル・服薬データから受診推奨や傾向アラート。差別化の上澄みとして、5のデータ連携が整った後に着手。

## 参考(Sources)

- [MyTherapy 公式(日本語)](https://www.mytherapyapp.com/ja)
- [Google Play: Medisafe Pill & Med Reminder](https://play.google.com/store/apps/details?id=com.medisafe.android.client)
- [日本調剤 お薬手帳プラス: マイナポータル連携機能拡張(電子処方箋)](https://www.nicho.co.jp/corporate/newsrelease/20230829_nr1/)
- [お薬手帳プラス 機能紹介](https://portal.okusuriplus.com/feature/)
- [kakari: マイナポータル連携でお薬情報登録(ヘルプ)](https://kakari-support.medpeer.jp/hc/ja/articles/360042817853)
- [EPARKお薬手帳: 薬の飲み合わせ検索](https://okusuritecho.epark.jp/renew/medicine_combination)
- [いつでもアイン薬局: できること](https://www.ainj.co.jp/app/service.html)
- [厚労省: 電子版お薬手帳サービス一覧(PDF)](https://www.mhlw.go.jp/content/001257615.pdf)
- [Welby サービス](https://welby.jp/service/) / [Welbyマイカルテ 機器連携](https://karte.welby.jp/patient/cooperation.html)
- [Android ヘルスコネクト活用事例](https://www.android.com/intl/ja_jp/articles/healthconnect202403/)
- [あすけん: Apple ヘルスケア連携FAQ](https://asken.tayori.com/q/s-faq/detail/899469/)
- [介護記録アプリおすすめ(しずなび介護なび)](https://shizuoka-roujinhome.jp/info/caregiving-record-top-4-apps/)
- [介護記録アプリおすすめ16選(アスピック)](https://www.aspicjapan.org/asu/article/20184)
- [ケア記録アプリ オプション(介護サプリ)](https://kaigosapuri.com/carerecord/option/)
- [ペットノート+ 公式LP](https://petnote-plus.com/lp/app/) / [ペットノート+ App Store](https://apps.apple.com/jp/app/id1553584485)
- [2026年 ペット体調管理アプリおすすめ(アプリブ)](https://app-liv.jp/lifestyle/pets/0645/)
- [マネーフォワード: マイナポータル連携で医療費通知取得(2024/7)](https://biz.moneyforward.com/support/tax-return/news/new-feature/20240731.html)
- [マネーフォワード: 医療費控除の操作方法](https://biz.moneyforward.com/support/tax-return/faq/documentation/medical_expense.html)
- [マイナポータル: 家族の医療費通知情報を取得する方法](https://faq.myna.go.jp/faq/show/7116)
- [国税庁: 医療費控除を受ける方へ(令和7年分)](https://www.nta.go.jp/taxes/shiraberu/shinkoku/tokushu/keisubetsu/iryou-koujo.htm)
- [KEGG MEDICUS 医薬品相互作用チェック](https://www.kegg.jp/medicus-bin/select_drug)
- [QLifePro 医薬品相互作用チェック](https://meds.qlifepro.com/interaction)
- [Pharmy 処方箋OCR(モイネットシステム)](https://www.moinetsystem.com/system/ocr/)
- [CARADA 電子薬歴 Solamichi 処方監査](https://site.solamichi.com/fn/audit)
