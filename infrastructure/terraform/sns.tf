# ===== プッシュ通知用SNSトピック =====
resource "aws_sns_topic" "push_notifications" {
  name = "${local.name_prefix}-push-notifications"

  tags = {
    Name = "${local.name_prefix}-push-notifications"
  }
}
