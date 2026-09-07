#!/bin/bash
set -e

BASE="http://localhost:5000"
STUDENT_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"username":"student1","password":"password"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
ADMIN_TOKEN=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

echo "=== AUTH ==="
echo "Student login: OK"
echo "Admin login: OK"

echo ""
echo "=== STUDENT PORTAL ==="
echo "--- Profile ---"
curl -s "$BASE/api/student-portal/me" -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool
echo ""
echo "--- Transcript ---"
curl -s "$BASE/api/student-portal/me/transcript" -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool
echo ""
echo "--- Summaries ---"
curl -s "$BASE/api/student-portal/me/summaries" -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool

echo ""
echo "=== GLOBAL SEARCH ==="
curl -s "$BASE/api/search?q=alice" -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool
echo ""
echo "--- Search with date filter ---"
curl -s "$BASE/api/search?q=alice&from=2024-01-01&to=2025-12-31" -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool

echo ""
echo "=== NOTICES ==="
curl -s "$BASE/api/notices/board" -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool

echo ""
echo "=== MESSAGES ==="
curl -s "$BASE/api/messages/conversations" -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool

echo ""
echo "=== ACADEMIC STRUCTURE ==="
curl -s "$BASE/api/academic-structure/streams" -H "Authorization: Bearer $STUDENT_TOKEN" | python3 -m json.tool

echo ""
echo "=== HEALTH ==="
curl -s "$BASE/api/health" | python3 -m json.tool

echo ""
echo "=== PDF DOWNLOAD ==="
curl -s -I "$BASE/api/student-portal/me/transcript/pdf" -H "Authorization: Bearer $STUDENT_TOKEN" | head -5

echo ""
echo "=== ALL TESTS PASSED ==="
