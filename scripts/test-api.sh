#!/bin/bash

# API Testing Script for Agora Backend
# This script tests all API endpoints with sample data

BASE_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@agora.com"
ADMIN_PASSWORD="Admin123!@#"

echo "🚀 Starting API Testing..."
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to make HTTP request and check status
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    local expected_status=$5
    local description=$6
    
    echo -e "${BLUE}Testing: $description${NC}"
    
    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data")
        else
            response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ -n "$headers" ]; then
            response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "$headers")
        else
            response=$(curl -s -w "%{http_code}" -X $method "$BASE_URL$endpoint")
        fi
    fi
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        print_result 0 "$description (Status: $status_code)"
        return 0
    else
        print_result 1 "$description (Expected: $expected_status, Got: $status_code)"
        echo "Response: $response_body"
        return 1
    fi
}

echo "📋 Testing Health Endpoints..."
echo "================================"

# Test health endpoints
test_endpoint "GET" "/health" "" "" "200" "Health Check"
test_endpoint "GET" "/health/ready" "" "" "200" "Readiness Check"

echo ""
echo "🔐 Testing Authentication Endpoints..."
echo "======================================="

# Test user registration
USER_DATA='{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User"
}'

test_endpoint "POST" "/auth/register" "$USER_DATA" "" "201" "Register New User"

# Test user login and extract token
echo -e "${BLUE}Logging in test user...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "TestPass123!"}')

USER_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token' 2>/dev/null)
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id' 2>/dev/null)

if [ "$USER_TOKEN" != "null" ] && [ -n "$USER_TOKEN" ]; then
    print_result 0 "User Login (Token extracted)"
else
    print_result 1 "User Login (Failed to extract token)"
    echo "Response: $LOGIN_RESPONSE"
fi

# Test admin login
echo -e "${BLUE}Logging in admin user...${NC}"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo $ADMIN_LOGIN_RESPONSE | jq -r '.data.token' 2>/dev/null)

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    print_result 0 "Admin Login (Token extracted)"
else
    print_result 1 "Admin Login (Failed to extract token)"
    echo "Response: $ADMIN_LOGIN_RESPONSE"
    echo -e "${YELLOW}⚠️  Note: Make sure to seed admin user first with 'npm run seed'${NC}"
fi

# Test protected endpoints with user token
if [ "$USER_TOKEN" != "null" ] && [ -n "$USER_TOKEN" ]; then
    test_endpoint "GET" "/auth/profile" "" "Authorization: Bearer $USER_TOKEN" "200" "Get User Profile"
    
    UPDATE_DATA='{"firstName": "Updated", "lastName": "User", "bio": "Updated bio"}'
    test_endpoint "PUT" "/auth/profile" "$UPDATE_DATA" "Authorization: Bearer $USER_TOKEN" "200" "Update User Profile"
fi

echo ""
echo "👥 Testing User Management Endpoints..."
echo "========================================"

# Test user endpoints
if [ "$USER_TOKEN" != "null" ] && [ -n "$USER_TOKEN" ]; then
    test_endpoint "GET" "/users" "" "Authorization: Bearer $USER_TOKEN" "200" "Get All Users"
    test_endpoint "GET" "/users?page=1&limit=5" "" "Authorization: Bearer $USER_TOKEN" "200" "Get Users with Pagination"
    test_endpoint "GET" "/users/search?q=test" "" "Authorization: Bearer $USER_TOKEN" "200" "Search Users"
    
    if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
        test_endpoint "GET" "/users/$USER_ID" "" "Authorization: Bearer $USER_TOKEN" "200" "Get User by ID"
    fi
    
    test_endpoint "GET" "/users/username/testuser" "" "Authorization: Bearer $USER_TOKEN" "200" "Get User by Username"
fi

# Test public endpoints
test_endpoint "GET" "/users/check?email=test@example.com" "" "" "200" "Check User Exists (Email)"
test_endpoint "GET" "/users/check?username=testuser" "" "" "200" "Check User Exists (Username)"

echo ""
echo "🔒 Testing Admin Endpoints..."
echo "=============================="

# Test admin endpoints
if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    test_endpoint "GET" "/users/stats" "" "Authorization: Bearer $ADMIN_TOKEN" "200" "Get User Statistics"
    
    if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
        test_endpoint "PUT" "/users/$USER_ID/deactivate" "" "Authorization: Bearer $ADMIN_TOKEN" "200" "Deactivate User"
        test_endpoint "PUT" "/users/$USER_ID/activate" "" "Authorization: Bearer $ADMIN_TOKEN" "200" "Activate User"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping admin tests - admin token not available${NC}"
fi

echo ""
echo "🧪 Testing Error Cases..."
echo "=========================="

# Test authentication errors
test_endpoint "GET" "/auth/profile" "" "" "401" "Access Protected Endpoint Without Token"
test_endpoint "GET" "/users" "" "Authorization: Bearer invalid_token" "401" "Access with Invalid Token"

# Test validation errors
INVALID_USER_DATA='{"username": "ab", "email": "invalid-email", "password": "123"}'
test_endpoint "POST" "/auth/register" "$INVALID_USER_DATA" "" "400" "Register with Invalid Data"

# Test duplicate registration
test_endpoint "POST" "/auth/register" "$USER_DATA" "" "400" "Register Duplicate User"

# Test invalid login
INVALID_LOGIN='{"email": "test@example.com", "password": "wrongpassword"}'
test_endpoint "POST" "/auth/login" "$INVALID_LOGIN" "" "401" "Login with Wrong Password"

echo ""
echo "📊 Test Summary"
echo "==============="
echo -e "${GREEN}✅ Tests completed!${NC}"
echo ""
echo "📝 Notes:"
echo "- Make sure the server is running on $BASE_URL"
echo "- Seed admin user with: npm run seed"
echo "- Check server logs for detailed error information"
echo ""
echo "🔗 Useful Commands:"
echo "- Start server: npm run dev"
echo "- Seed database: npm run seed:samples"
echo "- Check database: npm run check-db"