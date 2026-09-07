# Running the SMIS Backend

## Option 1: Mock Backend (Quick Testing - No .NET Required)

Use this to quickly test the frontend without needing .NET or PostgreSQL.

### Start the mock API:
```bash
cd backend/mock-server
npm install
npm start
```

The mock API runs at `http://localhost:5000`

### Test accounts:
- **Student:** `student1` / `password`
- **Admin:** `admin` / `password`

### Start the frontend:
```bash
cd frontend
npm install
npm run dev
```

The frontend will be at `http://localhost:5173`

**Note:** The mock server uses in-memory data. It implements:
- Authentication (`/api/auth/login`)
- Student portal (`/api/student-portal/*`)
- Global search (`/api/search`)
- Notices board (`/api/notices/board`)
- Messages (`/api/messages/*`)
- Academic streams (`/api/academic-structure/streams`)
- Health check (`/api/health`)

---

## Option 2: Real .NET Backend (Production Development)

### Prerequisites:
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- PostgreSQL database

### 1. Start PostgreSQL:
```bash
# Ubuntu/Debian
sudo systemctl start postgresql

# Or using Docker:
docker run --name smis-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### 2. Configure connection string:
Edit `backend/src/SchoolManagement.Api/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "SchoolManagement": "Host=localhost;Port=5432;Database=school_management;Username=postgres;Password=postgres"
  },
  "Authentication": {
    "JwtKey": "your-secret-key-here-min-32-chars-long"
  }
}
```

### 3. Run database migrations:
```bash
cd backend/src/SchoolManagement.Api
dotnet ef database update
```

If migrations don't exist yet, create them:
```bash
cd backend
dotnet ef migrations add InitialCreate --project src/SchoolManagement.Infrastructure --startup-project src/SchoolManagement.Api
dotnet ef database update --project src/SchoolManagement.Infrastructure --startup-project src/SchoolManagement.Api
```

### 4. Start the backend:
```bash
cd backend/src/SchoolManagement.Api
dotnet watch run
```

The API will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `https://localhost:5001/swagger`

### 5. Start the frontend (separate terminal):
```bash
cd frontend
npm install
npm run dev
```

The frontend will be at `http://localhost:5173`

### 6. Create admin user:
```bash
curl -X POST https://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourSecurePassword123!","firstName":"System","lastName":"Admin","roles":["SystemAdministrator"]}'
```

---

## Environment Variables (Production)

Set these environment variables for production deployment:

```bash
export ConnectionStrings__SchoolManagement="Host=localhost;Port=5432;Database=school_management;Username=postgres;Password=secure_password"
export Authentication__JwtKey="your-very-secure-secret-key-at-least-32-characters"
export ASPNETCORE_ENVIRONMENT="Production"
```

---

## Default Credentials (Development Only)

After running the setup script or seeding:
- Username: `admin`
- Password: `admin123`

**Change these immediately in production!**

---

## Troubleshooting

**Port already in use:**
```bash
# Change port in launchSettings.json or use:
dotnet run --urls http://localhost:5002
```

**Database connection fails:**
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Verify connection string in `appsettings.json`
- Check firewall rules if using remote database

**Frontend can't connect to backend:**
- Ensure backend is running on port 5000
- Check CORS settings in `Program.cs`
- Verify `VITE_API_BASE_URL` in frontend `.env` if set
