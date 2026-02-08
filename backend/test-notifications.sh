#!/bin/bash
# Test notification endpoints — email (SendGrid) + SMS (Twilio)
# Usage: bash test-notifications.sh [auth_token]
#
# If no token is supplied the script will create a throwaway user.

set -euo pipefail
API="http://localhost:5000/api"
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

# ── Get or create auth token ──────────────────────────────────────────
if [[ -n "${1:-}" ]]; then
  TOKEN="$1"
  echo -e "${GREEN}Using supplied token${NC}"
else
  RAND=$RANDOM
  EMAIL="testuser${RAND}@babywatcher.test"
  PASS="TestPass123!"
  echo -e "${YELLOW}Creating test user: $EMAIL${NC}"

  SIGNUP=$(curl -s "$API/auth/signup" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"displayName\":\"Test User\",\"phone\":\"+15551234567\"}")

  echo "Signup response: $SIGNUP" | head -c 300
  echo ""

  # The signup returns customToken, not idToken. Login to get idToken.
  LOGIN=$(curl -s "$API/auth/login" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")

  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('idToken',''))" 2>/dev/null || echo "")

  if [[ -z "$TOKEN" ]]; then
    echo -e "${RED}Login failed:${NC} $LOGIN"
    exit 1
  fi
  echo -e "${GREEN}Logged in, token obtained ✓${NC}"
fi

AUTH="Authorization: Bearer $TOKEN"

# ── 1. Update notification preferences + phone ───────────────────────
echo ""
echo -e "${YELLOW}═══ 1. PUT /notifications/preferences ═══${NC}"
PREFS=$(curl -s "$API/notifications/preferences" -X PUT \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"email":true,"sms":true,"push":true,"phone":"+15551234567"}')
echo "$PREFS" | python3 -m json.tool 2>/dev/null || echo "$PREFS"

# ── 2. Get notification preferences ──────────────────────────────────
echo ""
echo -e "${YELLOW}═══ 2. GET /notifications/preferences ═══${NC}"
GETPREFS=$(curl -s "$API/notifications/preferences" -H "$AUTH")
echo "$GETPREFS" | python3 -m json.tool 2>/dev/null || echo "$GETPREFS"

# ── 3. Create a notification (triggers email + SMS) ──────────────────
echo ""
echo -e "${YELLOW}═══ 3. POST /notifications (create + send email/SMS) ═══${NC}"
NOTIF=$(curl -s "$API/notifications" -X POST \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"reason":"BOUNDARY","details":{"side":"left"}}')
echo "$NOTIF" | python3 -m json.tool 2>/dev/null || echo "$NOTIF"

# ── 4. List notifications ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}═══ 4. GET /notifications ═══${NC}"
LIST=$(curl -s "$API/notifications" -H "$AUTH")
echo "$LIST" | python3 -m json.tool 2>/dev/null || echo "$LIST"

# ── 5. Create another notification (motion) ──────────────────────────
echo ""
echo -e "${YELLOW}═══ 5. POST /notifications (motion event) ═══${NC}"
NOTIF2=$(curl -s "$API/notifications" -X POST \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"reason":"ACTIVE"}')
echo "$NOTIF2" | python3 -m json.tool 2>/dev/null || echo "$NOTIF2"

# ── 6. Mark all as read ──────────────────────────────────────────────
echo ""
echo -e "${YELLOW}═══ 6. PUT /notifications/read-all ═══${NC}"
READALL=$(curl -s "$API/notifications/read-all" -X PUT -H "$AUTH")
echo "$READALL" | python3 -m json.tool 2>/dev/null || echo "$READALL"

# ── 7. Done ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══ All tests complete ═══${NC}"
echo "Check the backend terminal logs for email/SMS delivery results."
echo "  📧  Look for: '📧 Email sent' or '❌ SendGrid error'"
echo "  📱  Look for: '📱 SMS sent' or '❌ Twilio error'"
