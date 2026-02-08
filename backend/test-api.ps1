# PowerShell script to test Auth API endpoints
# Run this from the backend directory

Write-Host "=== Testing Auth API Endpoints ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000/api/auth"
$headers = @{
    "Content-Type" = "application/json"
}

# Function to make API calls and display results
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null
    )
    
    Write-Host "Test: $Name" -ForegroundColor Yellow
    Write-Host "$Method $Url" -ForegroundColor Gray
    
    try {
        if ($Body) {
            Write-Host "Body: $Body" -ForegroundColor Gray
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -Body $Body -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -UseBasicParsing
        }
        
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        Write-Host ""
        
        return $response
    }
    catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
        }
        Write-Host ""
        return $null
    }
}

# Test 1: Sign Up with valid data
Write-Host "=== 1. Sign Up Tests ===" -ForegroundColor Magenta
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$signupBody = @{
    email = "testuser$timestamp@example.com"
    password = "password123"
    displayName = "Test User"
} | ConvertTo-Json

Test-Endpoint -Name "Sign Up (Valid Data)" -Method "POST" -Url "$baseUrl/signup" -Body $signupBody

# Test 2: Sign Up with short password (should fail)
$shortPassBody = @{
    email = "test2@example.com"
    password = "123"
    displayName = "Test User"
} | ConvertTo-Json

Test-Endpoint -Name "Sign Up (Short Password - Should Fail)" -Method "POST" -Url "$baseUrl/signup" -Body $shortPassBody

# Test 3: Sign Up with duplicate email (should fail)
$duplicateBody = @{
    email = "testuser@example.com"
    password = "password123"
    displayName = "Test User"
} | ConvertTo-Json

Test-Endpoint -Name "Sign Up (Duplicate Email - May Fail)" -Method "POST" -Url "$baseUrl/signup" -Body $duplicateBody

Write-Host "=== 2. Login Tests ===" -ForegroundColor Magenta

# Test 4: Login with valid credentials
$loginBody = @{
    email = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Test-Endpoint -Name "Login (Valid Credentials)" -Method "POST" -Url "$baseUrl/login" -Body $loginBody

# Extract token from response
$token = $null
if ($loginResponse) {
    try {
        $loginData = $loginResponse.Content | ConvertFrom-Json
        $token = $loginData.idToken
        Write-Host "Token extracted: $($token.Substring(0, 20))..." -ForegroundColor Green
        Write-Host ""
    }
    catch {
        Write-Host "Could not extract token" -ForegroundColor Red
    }
}

# Test 5: Login with invalid password (should fail)
$invalidLoginBody = @{
    email = "testuser@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

Test-Endpoint -Name "Login (Invalid Password - Should Fail)" -Method "POST" -Url "$baseUrl/login" -Body $invalidLoginBody

# Test 6: Login with missing fields (should fail)
$missingFieldsBody = @{
    email = "testuser@example.com"
} | ConvertTo-Json

Test-Endpoint -Name "Login (Missing Password - Should Fail)" -Method "POST" -Url "$baseUrl/login" -Body $missingFieldsBody

Write-Host "=== 3. Protected Route Tests ===" -ForegroundColor Magenta

# Test 7: Get current user with token
if ($token) {
    $authHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "Test: Get Current User (With Token)" -ForegroundColor Yellow
    Write-Host "GET $baseUrl/me" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl/me" -Method "GET" -Headers $authHeaders -UseBasicParsing
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
        Write-Host ""
    }
    catch {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
        }
        Write-Host ""
    }
}

# Test 8: Get current user without token (should fail)
Test-Endpoint -Name "Get Current User (Without Token - Should Fail)" -Method "GET" -Url "$baseUrl/me"

Write-Host "=== Tests Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Sign Up endpoint: POST $baseUrl/signup" -ForegroundColor Gray
Write-Host "- Login endpoint: POST $baseUrl/login" -ForegroundColor Gray
Write-Host "- Get User endpoint: GET $baseUrl/me (requires Authorization header)" -ForegroundColor Gray
