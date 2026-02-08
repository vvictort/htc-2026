#!/bin/bash

echo "=== Testing Auth API Endpoints ==="
echo ""

# Test Signup
echo "1. Testing Signup Endpoint:"
echo "POST http://localhost:5000/api/auth/signup"
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123","displayName":"Test User"}' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq .

echo ""
echo "---"
echo ""

# Test Login
echo "2. Testing Login Endpoint:"
echo "POST http://localhost:5000/api/auth/login"
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"password123"}' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq .

echo ""
echo "---"
echo ""

# Test Login with wrong password
echo "3. Testing Login with Invalid Password:"
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"wrongpassword"}' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq .

echo ""
echo "=== Tests Complete ==="
