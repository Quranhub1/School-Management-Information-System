# Launch Backend API
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\JOES TECH\School-Management-Information-System'; `$env:ASPNETCORE_ENVIRONMENT='Development'; `$env:ASPNETCORE_URLS='http://127.0.0.1:5000'; dotnet run --project '.\backend\src\SchoolManagement.Api\SchoolManagement.Api.csproj'"

# Wait 5 seconds for API to initialize
Start-Sleep -Seconds 5

# Launch Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\JOES TECH\School-Management-Information-System\frontend'; npm run dev"
