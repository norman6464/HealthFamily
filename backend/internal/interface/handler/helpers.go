package handler

import "time"

// parseDate はISO8601または日付文字列を *time.Time に変換する。空なら nil。
func parseDate(s *string) *time.Time {
	if s == nil || *s == "" {
		return nil
	}
	layouts := []string{time.RFC3339, "2006-01-02T15:04:05", "2006-01-02"}
	for _, l := range layouts {
		if t, err := time.Parse(l, *s); err == nil {
			return &t
		}
	}
	return nil
}
