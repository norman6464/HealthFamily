package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// 在庫更新は「省略」と「0 を指定」を区別しなければならない。
// 区別しないと、他の項目だけを送ったつもりのリクエストで在庫が 0 に消える。
func TestUpdateStockRequest_省略と0を区別する(t *testing.T) {
	cases := []struct {
		name     string
		body     string
		wantNil  bool
		wantVal  int
		wantFail bool
	}{
		{name: "0 を明示した場合は 0 として扱う", body: `{"stockQuantity":0}`, wantVal: 0},
		{name: "正の数はそのまま", body: `{"stockQuantity":42}`, wantVal: 42},
		{name: "キー省略は未指定として区別できる", body: `{}`, wantNil: true},
		{name: "null も未指定", body: `{"stockQuantity":null}`, wantNil: true},
		{name: "文字列は解釈できない", body: `{"stockQuantity":"10"}`, wantFail: true},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var req updateStockRequest
			err := json.Unmarshal([]byte(c.body), &req)

			if c.wantFail {
				if err == nil {
					t.Fatal("解釈に失敗すべき")
				}
				return
			}
			if err != nil {
				t.Fatalf("解釈できるはず: %v", err)
			}
			if c.wantNil {
				if req.StockQuantity != nil {
					t.Fatalf("未指定として扱うべきだが %d が入っている", *req.StockQuantity)
				}
				return
			}
			if req.StockQuantity == nil {
				t.Fatal("値が入るべき")
			}
			if *req.StockQuantity != c.wantVal {
				t.Fatalf("%d を期待したが %d", c.wantVal, *req.StockQuantity)
			}
		})
	}
}

// ハンドラを HTTP 越しに叩き、未指定・負数が 400 で弾かれることを確かめる。
func TestUpdateStock_未指定と負数は400(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cases := []struct {
		name string
		body string
	}{
		{name: "キー省略", body: `{}`},
		{name: "null", body: `{"stockQuantity":null}`},
		{name: "負数", body: `{"stockQuantity":-1}`},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			// ユースケースまで到達したら失敗と分かるよう、nil のまま呼び出す。
			// 400 で弾かれていれば nil 参照は起きない。
			h := &MedicationHandler{}
			r := gin.New()
			r.PATCH("/m/:medicationId/stock", func(ctx *gin.Context) {
				ctx.Set("userID", "user-1")
				h.UpdateStock(ctx)
			})

			w := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPatch, "/m/med-1/stock", strings.NewReader(c.body))
			req.Header.Set("Content-Type", "application/json")
			r.ServeHTTP(w, req)

			if w.Code != http.StatusBadRequest {
				t.Fatalf("400 を期待したが %d (%s)", w.Code, w.Body.String())
			}
		})
	}
}
