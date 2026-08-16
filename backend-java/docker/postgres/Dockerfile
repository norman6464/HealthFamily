# 開発・統合テスト・jOOQ のコード生成で使う PostgreSQL。
# 本番の Supabase と同じメジャーバージョンに揃えている。
#
# スキーマをイメージに焼き込むことで、ボリュームのマウントパスに依存せず
# 手元でも CI でも同じ状態で起動する。
FROM postgres:17

# 本番 DB から pg_dump で起こしたスキーマ。手書きしないのは、
# 本番との差異に気づけなくなるため。
COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
