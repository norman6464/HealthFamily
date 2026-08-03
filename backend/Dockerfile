# Cloud Run 用マルチステージビルド
FROM golang:1.26 AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags '-s -w' -o /out/server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/server ./server
# MIGRATIONS_DIR=migrations (相対パス) で起動時に冪等適用されるため同梱する
COPY --from=build /src/migrations ./migrations
ENV MIGRATIONS_DIR=migrations
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["./server"]
