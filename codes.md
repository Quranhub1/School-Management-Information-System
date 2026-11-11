# SMIS Developer & Server Command Reference

A practical command notebook for the **School Management Information System (SMIS)** repository.

- Repository: https://github.com/Quranhub1/School-Management-Information-System
- Main branch: `main`
- Stack: .NET 8 / Entity Framework Core / PostgreSQL; React + TypeScript + Vite; Tauri desktop client.
- Currency/locale: UGX / `en-UG`.
- Windows working directory previously used: `C:\\Users\\JOES TECH\\School-Management-Information-System`
- Ubuntu working directory previously used: `~/School-Management-Information-System`

> **Important:** Commands marked **Confirmed** come from the SMIS workflow or repository scripts. Commands marked **Template** are reusable examples; replace placeholders and verify paths, service names, ports, and credentials before running them. Never commit passwords, API keys, private certificates, or production connection strings.

---

## 1. Get the latest source code

### First-time clone — Windows PowerShell or Ubuntu

```bash
git clone https://github.com/Quranhub1/School-Management-Information-System.git
cd School-Management-Information-System
git switch main
```

### Update an existing working copy

```bash
git switch main
git fetch origin --prune
git pull --ff-only origin main
git status
```

### Check branches and changes

```bash
git status --short
git branch --show-current
git branch -a
git log --oneline -10
git remote -v
git diff
git diff --stat
```

### Bring a remote branch into main

Review the branch before merging. Do not blindly merge unfinished or failing work.

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff origin/<branch-name>
```

If conflicts occur, resolve them, run the relevant tests, then:

```bash
git status
git add <resolved-file-or-directory>
git commit
```

Push only after checking the result:

```bash
git push origin main
```

---

## 2. Windows workstation commands

Open PowerShell and move to the project:

```powershell
Set-Location "C:\\Users\\JOES TECH\\School-Management-Information-System"
```

Check installed tools:

```powershell
git --version
dotnet --info
node --version
npm --version
psql --version
```

Find the PostgreSQL Windows service:

```powershell
Get-Service *postgres*
```

The service name previously seen on the development PC was `postgresql-x64-18`. Check it before using it:

```powershell
Get-Service -Name "postgresql-x64-18"
Start-Service -Name "postgresql-x64-18"
Get-Service -Name "postgresql-x64-18"
```

Stop it only when required:

```powershell
Stop-Service -Name "postgresql-x64-18"
```

---

## 3. Ubuntu workstation / server commands

Update package indexes and inspect the machine:

```bash
sudo apt update
sudo apt upgrade
uname -a
lsb_release -a
df -h
free -h
```

Check installed runtimes:

```bash
git --version
dotnet --info
node --version
npm --version
psql --version
```

Install common utilities (Ubuntu/Debian; review the package list before installing):

```bash
sudo apt install -y git curl wget unzip ca-certificates build-essential
```

Check PostgreSQL service status:

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Useful service diagnostics:

```bash
systemctl --type=service --state=running
journalctl -u postgresql -n 100 --no-pager
```

> Install .NET 8 and the supported Node.js LTS release using the official instructions for the exact Ubuntu version. Do not assume the distribution's default packages are the correct versions for this application.

---

## 4. Frontend: install, run, build, and test

Run frontend commands from the `frontend` directory.

### Windows PowerShell

```powershell
Set-Location "C:\\Users\\JOES TECH\\School-Management-Information-System\\frontend"
npm install
npm run dev
```

### Ubuntu

```bash
cd ~/School-Management-Information-System/frontend
npm install
npm run dev
```

### Repository-defined frontend scripts

These scripts were read from `frontend/package.json`:

```bash
npm run dev
npm run build
npm run preview
npm test
npm run test:watch
npm run copy-fonts
npm run copy-pdfmake-assets
npm run build:login-css
```

The development pre-script automatically runs the local font copy, PDFMake asset copy, and login CSS build before Vite starts.

The production build runs:

1. Copy local fonts.
2. Copy PDFMake assets.
3. Build the institution login CSS.
4. Check offline login assets.
5. Run TypeScript project builds.
6. Build the Vite application.

Build and test:

```bash
npm run build
npm test
```

Preview the built frontend:

```bash
npm run preview
```

If dependencies appear inconsistent, inspect the lockfile and package changes before reinstalling. Use `npm ci` only when the lockfile is in sync with `package.json`:

```bash
npm ci
```

---

## 5. Copying local assets

### Rebuild the repository-managed offline assets

Run from `frontend`:

```bash
npm run copy-fonts
npm run copy-pdfmake-assets
npm run build:login-css
```

Or run the complete production build, which invokes all three and checks offline login assets:

```bash
npm run build
```

### Copy a specific asset folder — Windows PowerShell template

Use this when moving a prepared asset directory to another local folder. Change both paths first.

```powershell
$source = ".\\public\\assets\\fonts"
$destination = "D:\\SMIS-Deployment\\frontend\\public\\assets\\fonts"
New-Item -ItemType Directory -Force -Path $destination
Copy-Item -Path "$source\\*" -Destination $destination -Recurse -Force
```

### Copy a specific asset folder — Ubuntu template

```bash
SOURCE="./frontend/public/assets/fonts/"
DEST="/var/www/smis/frontend/public/assets/fonts/"
sudo mkdir -p "$DEST"
sudo cp -a "$SOURCE". "$DEST"
```

### Copy the complete built frontend — template

Build first. Then copy the actual Vite output directory (normally `dist`) to the configured web-server document root.

PowerShell:

```powershell
npm run build
# Replace the destination with the real deployment directory.
New-Item -ItemType Directory -Force -Path "D:\\SMIS-Deployment\\frontend"
Copy-Item -Path ".\\dist\\*" -Destination "D:\\SMIS-Deployment\\frontend" -Recurse -Force
```

Ubuntu:

```bash
npm run build
# Replace the destination with the real deployment directory.
sudo mkdir -p /var/www/smis/frontend
sudo cp -a dist/. /var/www/smis/frontend/
```

Do not copy `node_modules` to the web-server document root. Keep source files, environment files, database files, and secrets outside the public web root.

### Check that local assets exist

PowerShell:

```powershell
Get-ChildItem ".\\public\\assets" -Recurse
Test-Path ".\\public\\assets\\fonts"
```

Ubuntu:

```bash
find ./frontend/public/assets -maxdepth 4 -type f -print
du -sh ./frontend/public/assets
```

---

## 6. Downloading source files and deployment packages

### Preferred: download the complete project with Git

```bash
git clone https://github.com/Quranhub1/School-Management-Information-System.git
```

For an existing copy:

```bash
git pull --ff-only origin main
```

### Download a release archive — template

Use a real release URL copied from the repository's GitHub Releases page. Do not guess a release filename or URL.

Ubuntu:

```bash
wget -O smis-release.zip "<PASTE-VERIFIED-RELEASE-URL-HERE>"
unzip -l smis-release.zip
```

PowerShell:

```powershell
Invoke-WebRequest -Uri "<PASTE-VERIFIED-RELEASE-URL-HERE>" -OutFile ".\\smis-release.zip"
Get-Item ".\\smis-release.zip"
```

### Download an individual public file — template

Only use a verified raw-file URL:

```bash
curl -fL "<PASTE-VERIFIED-RAW-FILE-URL-HERE>" -o "<OUTPUT-FILENAME>"
```

PowerShell:

```powershell
Invoke-WebRequest -Uri "<PASTE-VERIFIED-RAW-FILE-URL-HERE>" -OutFile ".\\<OUTPUT-FILENAME>"
```

Check a downloaded archive before extracting it:

```bash
file smis-release.zip
unzip -t smis-release.zip
```

---

## 7. Backend: .NET 8

The backend solution is under `backend/SchoolManagement.sln`. Backend projects include Domain, Application, Infrastructure, API, and test projects.

### Restore, build, and test

Run from the backend directory:

```bash
cd backend
dotnet restore SchoolManagement.sln
dotnet build SchoolManagement.sln --configuration Release
dotnet test SchoolManagement.sln --configuration Release --no-build
```

CI-style build (confirmed command):

```bash
dotnet build SchoolManagement.sln --configuration Release --no-restore
```

### Run the API in Development

Windows PowerShell, from the repository root (confirmed development pattern):

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
Set-Location ".\\backend\\src\\SchoolManagement.Api"
dotnet run --no-restore
```

Ubuntu, from the repository root:

```bash
export ASPNETCORE_ENVIRONMENT=Development
cd backend/src/SchoolManagement.Api
dotnet run --no-restore
```

The development API URL previously used was:

```text
http://127.0.0.1:5000
```

An older frontend configuration referenced `https://localhost:5001`; check the current launch settings and frontend environment configuration before relying on either URL.

### Publish the API — template

```bash
cd backend/src/SchoolManagement.Api
dotnet publish -c Release -o ./publish
```

Copy the publish output to the server's private application directory, not the public frontend document root.

---

## 8. PostgreSQL database operations

Database name previously used in development: `school_management`.

### Connect locally

```bash
psql -U postgres
```

Connect directly to the SMIS database:

```bash
psql -U postgres -d school_management
```

### Useful SQL inspection commands

Run inside `psql`:

```sql
\\l
\\c school_management
\\dt
\\du
SELECT current_database();
SELECT version();
\\q
```

### Backup the database

Ubuntu/Linux template:

```bash
pg_dump -U postgres -F c -d school_management -f "school_management_$(date +%Y%m%d_%H%M%S).dump"
```

Windows PowerShell template (ensure PostgreSQL's `bin` directory is on PATH):

```powershell
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump -U postgres -F c -d school_management -f ".\\school_management_$stamp.dump"
```

### Restore a custom-format backup — caution

Restore into the intended target database only. Confirm the target and backup before executing.

```bash
pg_restore --list "<BACKUP-FILE>.dump"
pg_restore -U postgres -d "<TARGET-DATABASE>" --clean --if-exists "<BACKUP-FILE>.dump"
```

Do not run a destructive restore against a live school database without an approved maintenance window and a verified current backup.

---

## 9. Server deployment and diagnostics

The following are **deployment templates**, not a record of a confirmed production server configuration. Adapt paths, service names, domain, ports, and reverse-proxy configuration to the actual server.

### Inspect listening ports

Ubuntu:

```bash
sudo ss -tulpn
sudo ss -tulpn | grep -E ':80|:443|:5000|:5432'
```

Windows:

```powershell
Get-NetTCPConnection -State Listen | Sort-Object LocalPort
```

### Check API response

```bash
curl -i http://127.0.0.1:5000/
```

A root endpoint may return an authorization response; test a known health endpoint if the application exposes one.

### Create a systemd service — template

Create the service file only after confirming the published API path, runtime identity, and environment configuration.

```ini
[Unit]
Description=SMIS API
After=network.target postgresql.service

[Service]
WorkingDirectory=/opt/smis/api
ExecStart=/usr/bin/dotnet /opt/smis/api/SchoolManagement.Api.dll
Restart=always
RestartSec=10
User=smis
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

Save as `/etc/systemd/system/smis-api.service`, then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable smis-api
sudo systemctl start smis-api
sudo systemctl status smis-api
sudo journalctl -u smis-api -n 100 --no-pager
```

### Basic firewall inspection

```bash
sudo ufw status verbose
```

Only open ports required by the deployment design. PostgreSQL port 5432 should not be exposed publicly for a normal single-server deployment; allow database access only from trusted hosts.

---

## 10. Tauri desktop build notes

The repository includes a Tauri desktop client. Before packaging, install the platform-specific Tauri prerequisites and verify the current Tauri scripts/configuration in the repository.

Expected package formats used by this project include Windows NSIS installers (x64/x86) and Ubuntu/Linux `.deb` and `.AppImage` packages. Build commands can differ by the current Tauri version and package scripts, so inspect them first:

```bash
cat frontend/package.json
find . -maxdepth 4 -iname '*tauri*' -o -iname 'tauri.conf.json'
```

Do not use an assumed packaging command until the repository's current Tauri configuration and scripts have been checked.

---

## 11. Troubleshooting quick checks

### Frontend dependency and build checks

```bash
npm install
npm run build
npm test
```

### Backend build checks

```bash
dotnet restore SchoolManagement.sln
dotnet build SchoolManagement.sln --configuration Release
dotnet test SchoolManagement.sln --configuration Release --no-build
```

### Git working-tree check before and after a fix

```bash
git status --short
git diff --check
git diff --stat
```

### Inspect logs

Ubuntu service:

```bash
sudo journalctl -u smis-api -n 200 --no-pager
sudo journalctl -u postgresql -n 100 --no-pager
```

Vite development server: read the terminal where `npm run dev` is running.

.NET API: read the terminal where `dotnet run` is running.

---

## 12. Important paths and values

| Item | Value |
|---|---|
| GitHub repository | `Quranhub1/School-Management-Information-System` |
| Main branch | `main` |
| Windows project path | `C:\\Users\\JOES TECH\\School-Management-Information-System` |
| Ubuntu project path | `~/School-Management-Information-System` |
| Backend solution | `backend/SchoolManagement.sln` |
| API project | `backend/src/SchoolManagement.Api` |
| Frontend project | `frontend/` |
| Database name | `school_management` |
| Development API URL previously used | `http://127.0.0.1:5000` |
| Windows PostgreSQL service previously seen | `postgresql-x64-18` |
| Frontend local asset scripts | `copy-fonts`, `copy-pdfmake-assets` |
| Login CSS script | `build:login-css` |

---

## 13. Before running commands on a school server

- [ ] Confirm that the Git branch and commit are the intended release.
- [ ] Confirm the target server, OS version, disk space, and installed runtime versions.
- [ ] Confirm the production database host and database name.
- [ ] Take and verify a database backup before migrations or restores.
- [ ] Keep secrets in protected environment configuration, not in Git.
- [ ] Build and test the frontend and backend.
- [ ] Copy only the required build/publish output and local static assets.
- [ ] Confirm file ownership and permissions for the service account.
- [ ] Confirm HTTPS, firewall rules, and restricted database access.
- [ ] Check service logs and test the application after deployment.

---

## 14. Keep this command book accurate

When a new command is confirmed on the development PC or school server, add it under the matching section with:
- the operating system,
- the directory where it must be run,
- what it does,
- whether it is confirmed or a template,
- and any required placeholder values.

Never store passwords, tokens, private keys, or production secrets in this file.
