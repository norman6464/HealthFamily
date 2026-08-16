# Cloud Run 用のイメージ。
#
# jOOQ のコード生成は compose の PostgreSQL に接続して行うため、イメージの
# ビルド中には実行できない。生成済みソースを持ち込むのではなく、CI で
# 「compose 起動 → generate-sources → jar 作成」まで済ませ、できあがった
# jar だけをこのイメージに入れる。
#
# ベースは temurin の JRE。distroless には Java 25 のイメージがまだ無い。

FROM eclipse-temurin:25-jre-alpine

# root で動かさない
RUN addgroup -S app && adduser -S -G app app
WORKDIR /app

ARG JAR_FILE=target/healthfamily-api-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar
RUN chown -R app:app /app
USER app

# Cloud Run は PORT を注入する。Spring Boot がそれを拾う
ENV PORT=8080

# コンテナのメモリ上限に対する割合でヒープを決める。
# 既定の 25% だと 256Mi/512Mi のような小さい設定でヒープが足りず GC が頻発する。
# 単一 vCPU なので SerialGC のほうが素直。起動を優先して C2 コンパイルは抑える。
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -XX:TieredStopAtLevel=1"

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
