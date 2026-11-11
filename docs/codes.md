# SMIS Developer & Server Command Reference

> Repository documentation location: `docs/codes.md`

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


---

## 15. Recovered commands from earlier SMIS sessions

This section records additional commands recovered from previous development and server-support conversations. These are historical commands, not assumptions that every machine still has the same configuration.

### Windows: update and start the SMIS workstation

PowerShell:

```powershell
Set-Location "C:\\Users\\JOES TECH\\School-Management-Information-System"
git switch main
git pull --ff-only origin main
.\\Start-System.ps1
```

The `Start-System.ps1` script was used in the Windows workflow. Check that it exists before running:

```powershell
Test-Path ".\\Start-System.ps1"
```

Start the frontend development server without changing directory:

```powershell
npm --prefix frontend run dev
```

### Windows: repository verification and safe diagnostics

```powershell
git status
git log -1 --oneline
git branch --show-current
git show HEAD:backend/src/SchoolManagement.Api/Controllers/CampusAssignmentsController.cs
```

Check the installed development tools:

```powershell
node --version
npm --version
dotnet --version
psql --version
rustc --version
cargo --version
```

Check PostgreSQL and its command-line client:

```powershell
Get-Service *postgres*
Test-Path "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"
& "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe" --version
```

Check Rust installation paths:

```powershell
Test-Path "$env:USERPROFILE\\.cargo\\bin\\rustc.exe"
Test-Path "$env:USERPROFILE\\.cargo\\bin\\rustup.exe"
```

If Rust is installed for the current user but not on the current PowerShell PATH:

```powershell
$env:Path += ";$env:USERPROFILE\\.cargo\\bin"
rustc --version
cargo --version
```

### Windows: network and GitHub connectivity troubleshooting

```powershell
Test-NetConnection 1.1.1.1 -Port 443
Resolve-DnsName github.com
Test-NetConnection github.com -Port 443
ipconfig /flushdns
Clear-DnsClientCache
```

### Windows: remove a generated login stylesheet

This exact command was used from the repository root to remove the generated file before rebuilding it:

```powershell
Remove-Item "frontend\\public\\assets\\css\\institution-login.css" -Force
```

Then rebuild the stylesheet from `frontend`:

```powershell
Set-Location "C:\\Users\\JOES TECH\\School-Management-Information-System\\frontend"
npm run build:login-css
```

Only remove generated assets when you intend to regenerate them.

### Ubuntu: refresh the local checkout from GitHub

**Destructive reset — use only when you deliberately want the local tracked files to match remote main.** This discards local tracked-file changes. `git clean -fd` also deletes untracked files and directories.

```bash
cd ~/School-Management-Information-System
git fetch origin
git reset --hard origin/main
git clean -fd
git status
git branch --show-current
git log -1 --oneline
```

A non-destructive update is preferable when local work must be preserved:

```bash
cd ~/School-Management-Information-System
git switch main
git pull --ff-only origin main
```

### Ubuntu: backend source build and service diagnostics

Build from the backend directory:

```bash
cd ~/School-Management-Information-System/backend
dotnet restore
dotnet build
```

The following service name was found on the Ubuntu deployment. An earlier attempt to restart `school-management-api` returned “unit not found”; the actual unit was `schoolmanagement`.

```bash
sudo systemctl restart schoolmanagement
sudo systemctl status schoolmanagement --no-pager
sudo journalctl -u schoolmanagement -n 50 --no-pager
```

Additional deployment diagnostics:

```bash
sudo journalctl -u schoolmanagement -n 150 --no-pager
sudo systemctl cat schoolmanagement
sudo coredumpctl info schoolmanagement --no-pager
```

The deployed API was observed under `/opt/schoolmanagement/api`. The running service used the published deployment, not the source-tree build output. Confirm the current service configuration before copying files or restarting it.

### Ubuntu: deploy built frontend files

Historical deployment workflow:

```bash
cd ~/School-Management-Information-System
git fetch origin
git checkout main
git reset --hard origin/main
```

Build the backend and frontend:

```bash
cd ~/School-Management-Information-System/backend
dotnet restore
dotnet build
```

```bash
cd ~/School-Management-Information-System/frontend
npm install
npm run build
```

A previous deployment used rsync to install built files:

```bash
sudo rsync -a --delete <BUILD-SOURCE>/ <DEPLOYMENT-DESTINATION>/
```

**Caution:** `--delete` removes destination files that are not present in the source. Confirm both paths carefully, ensure the source contains the complete intended build, and keep a rollback copy before using it on a live server.

Restart the historical services after a verified deployment:

```bash
sudo systemctl restart schoolmanagement
sudo systemctl restart nginx
sudo systemctl status schoolmanagement --no-pager
sudo systemctl status nginx --no-pager
```

### Ubuntu: PostgreSQL checks and database access

```bash
psql --version
sudo systemctl status postgresql --no-pager
sudo -u postgres psql -c "\\l"
```

Test application database credentials interactively (the password is entered at the prompt):

```bash
psql -h localhost -U school_management -d school_management -W
```

Exit the PostgreSQL prompt:

```sql
\\q
```

### Entity Framework Core: apply database migrations

Historical command pattern used during deployment:

```bash
dotnet ef database update --connection "Host=127.0.0.1;Port=5432;Database=school_management;Username=school_management;Password=<SET-SECURELY>"
```

Use the correct startup project and migrations project for the current repository layout. Never paste a real production password into shell history, chat, source control, or this document. Prefer protected environment configuration or an approved secret store.

### Local automatic database backups

The Windows workstation backup arrangement recorded in the earlier conversation was:

- Backup directory: `C:\\Users\\JOES TECH\\SMIS-Backups`
- First automatic backup: approximately 2 minutes after backend startup.
- Repeat interval: every 24 hours.
- Retention: 30 most recent backups.
- Backup tools: `pg_dump` and `pg_restore`.
- Backups are local and outside the SMIS repository; they are not uploaded.

Check that the folder exists:

```powershell
Test-Path "C:\\Users\\JOES TECH\\SMIS-Backups"
Get-ChildItem "C:\\Users\\JOES TECH\\SMIS-Backups"
```

Check PostgreSQL backup utilities:

```powershell
Get-Command pg_dump
Get-Command pg_restore
pg_dump --version
pg_restore --version
```

The automatic schedule is application/workstation behavior, not a command to launch a backup manually. Confirm the current backup service status and inspect the output folder rather than assuming a backup succeeded.

### Ubuntu: inspect and edit API startup registration

Historical source-editing workflow (from the backend directory):

```bash
cd ~/School-Management-Information-System/backend
nano src/SchoolManagement.Api/Program.cs
```

A previous dependency-injection fix added this registration above the infrastructure registration:

```csharp
builder.Services.AddApplication();
```

Then compile:

```bash
dotnet build
```

Do not repeat this source edit unless the current file still needs the registration.

---

## 16. Command safety notes from the recovered history

- `git reset --hard` discards tracked local modifications.
- `git clean -fd` deletes untracked files and directories.
- `rsync --delete` deletes destination-only files.
- Database restore and EF migration commands can change production data/schema; verify the target and backup first.
- The old conversation contained a database password example. It is intentionally **not reproduced** here; use a secure placeholder or secret configuration.
- Historical service names and paths (`schoolmanagement`, `/opt/schoolmanagement/api`, `nginx`) belong to a particular Ubuntu deployment and must be checked on each server.


---

## 17. Additional recovered workstation diagnostics

These commands were recovered from earlier SMIS setup and troubleshooting sessions.

### Ubuntu: Wi-Fi adapter and network diagnostics

List network devices and saved connections:

```bash
nmcli device status
nmcli connection show
```

Check radio blocks and available wireless networks:

```bash
rfkill list
nmcli device wifi list
nmcli dev wifi list
```

Inspect wireless interfaces and USB network adapters:

```bash
iw dev
lsusb
```

These were used while troubleshooting a USB wireless adapter that was disconnected and not discovering access points. Interface names vary by machine; inspect the output instead of copying an old interface name into commands.

### Windows: inspect an HTTP API response

PowerShell command used to request the public institution settings endpoint:

```powershell
Invoke-WebRequest 'http://127.0.0.1:5000/api/public/institution-settings/active' -UseBasicParsing
```

For a failed request, inspect the HTTP status and response body inside a try/catch rather than assuming the API is offline:

```powershell
try {
    $response = Invoke-WebRequest 'http://127.0.0.1:5000/api/public/institution-settings/active' -UseBasicParsing
    $response.StatusCode
    $response.Content
}
catch {
    $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.ReadToEnd()
    }
}
```

### Windows: run a guarded backend build

This pattern restores packages, builds without restoring again, and stops if either command fails:

```powershell
dotnet restore .\backend\SchoolManagement.sln
if ($LASTEXITCODE -ne 0) { throw "Backend restore failed" }

dotnet build .\backend\SchoolManagement.sln --no-restore
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

Write-Host "BACKEND BUILD SUCCEEDED"
```

### Windows: refresh the main branch before development

```powershell
Set-Location 'C:\Users\JOES TECH\School-Management-Information-System'
git pull --ff-only origin main
```

---

## 18. Installer and first-run deployment checklist

The previously discussed Windows installer workflow requires these steps in order:

1. Install the application.
2. Complete mandatory server setup.
3. Complete mandatory connection and resource testing.
4. Finish setup.
5. Launch the application.
6. Sign in.

The setup flow must not provide a Skip/Later route around mandatory server configuration and connection/resource testing.

Windows installer targets previously discussed:

- `win-x86`
- `win-x64`

Confirm the current Tauri configuration and release workflow before building either target; do not assume the target names alone are valid build commands.


---

## 19. More commands recovered from November 2026 troubleshooting

### Windows: restore a missing .NET API project dependency

**Context:** On 8 November 2026, the API startup encountered missing Serilog assemblies. Run from the API project directory:

```powershell
dotnet restore SchoolManagement.Api.csproj
```

Inspect package references and central package management files:

```powershell
dotnet list SchoolManagement.Api.csproj package
Select-String -Path SchoolManagement.Api.csproj -Pattern "Serilog"
Get-ChildItem ..\..\ -Filter "Directory.Packages.props" -Recurse
```

After a successful restore, run the API using the development environment:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --no-restore
```

Do not add or change package versions until you have inspected the project and central package version declarations.

### Windows: clean frontend dependency installation and PDFMake verification

**Context:** On 8 November 2026, the frontend dependency tree and PDFMake assets were checked.

Run from the frontend directory:

```powershell
npm ci
npm ls pdfmake
Test-Path "node_modules/pdfmake/build/pdfmake.min.js"
npm run dev
```

Use `npm ci` only when `package-lock.json` matches `package.json`. It replaces the installed dependency tree based on the lockfile.

### Windows: inspect the backend API project

From the API project directory:

```powershell
Set-Location "C:\Users\JOES TECH\School-Management-Information-System\backend\src\SchoolManagement.Api"
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run
```

The shorter `dotnet run` form was used in the November 2026 startup session. Use `--no-restore` only after dependencies have already been restored successfully.

---

## 20. Preserve local assets when updating the workstation

A November 2026 Git status showed local, untracked asset directories:

- `frontend/public/assets/fonts/`
- `frontend/public/assets/pdfmake/`

**User constraint:** Do not delete these directories during repository cleanup or synchronization.

Inspect them before any cleanup or reset:

PowerShell:

```powershell
Get-ChildItem "frontend\public\assets\fonts" -Recurse
Get-ChildItem "frontend\public\assets\pdfmake" -Recurse
git status --short
```

Ubuntu:

```bash
find frontend/public/assets/fonts -type f -print
find frontend/public/assets/pdfmake -type f -print
git status --short
```

Do not run `git clean -fd` or any broad cleanup command when these local assets are untracked and need to be retained. Back up or commit required assets before performing operations that could remove them.


---

## 21. More recovered commands: EF tools, tests, configuration, and deployment checks

### .NET: restore local CLI tools and verify Entity Framework tooling

**Context:** These commands were used during the October 2026 database audit and EF Core troubleshooting.

Run from the repository or solution directory containing the tool manifest:

```powershell
dotnet tool restore
dotnet ef --version
```

If the EF command is not found, inspect the repository's tool manifest before installing a global tool. The local tool manifest is intended to keep the tool version consistent across developer machines.

### Windows: run the database audit PowerShell script

**Context:** A database audit script was launched from the user's Downloads folder.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
& "$HOME\Downloads\smis-db-full-audit.ps1"
```

`-Scope Process` limits the execution-policy change to the current PowerShell process. Inspect the script before running it, especially if it connects to or modifies a database.

### Frontend: run Vitest with verbose output and preserve the exit code

Run from the frontend directory:

```powershell
npm test -- --reporter=verbose
Write-Host "Vitest exit code: $LASTEXITCODE"
```

A non-zero exit code means the test run failed; review the failing test names and stack traces rather than treating the command's completion as success.

### Frontend: inspect Vite, Vitest, and Playwright configuration

From the repository root:

```powershell
Get-ChildItem "frontend" -File | Where-Object { $_.Name -match '^(vite|vitest)\.config\.' } | ForEach-Object { Write-Host "`n--- $($_.FullName) ---"; Get-Content $_.FullName }
Get-Content "frontend\playwright.config.js"
Get-Content "frontend\playwright.config.cjs"
```

The Playwright configuration filenames may differ or only one may exist. Check the output and current repository files before assuming a particular config file is present.

### Git: inspect remote branches before integrating work

```powershell
git fetch origin
git branch -r
git status --short --branch
```

Use the remote branch list to identify actual branch names. Do not invent branch names or merge every remote branch without reviewing its purpose and status.

### Ubuntu: deploy and verify the frontend through Nginx

**Historical deployment commands:** A previous Ubuntu deployment copied the built frontend to `/opt/schoolmanagement/frontend/`, validated Nginx, reloaded it, and checked the local API health route.

Run the frontend build first:

```bash
cd ~/School-Management-Information-System/frontend
npm run build
```

Then, from the frontend directory, deploy the generated Vite output:

```bash
sudo rsync -a --delete dist/ /opt/schoolmanagement/frontend/
```

**Destructive option:** `--delete` removes files from the destination that are absent from `dist/`. Verify both paths and keep a rollback copy before using this on a live server.

Validate and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager
```

Check the previously used local health endpoint:

```bash
curl -sS -i http://127.0.0.1:8081/api/health
```

The port `8081` and health route are historical deployment details. Confirm the current Nginx proxy configuration and API health route before relying on them.

### Ubuntu: inspect deployment configuration and recent service logs

```bash
sudo systemctl cat schoolmanagement
sudo systemctl status schoolmanagement --no-pager
sudo journalctl -u schoolmanagement -n 100 --no-pager
sudo nginx -t
```

Use these read-only checks before restarting or replacing deployed files.


---

## 22. Additional workstation hardware and local AI setup commands

These commands were recovered from earlier workstation-preparation conversations. The local AI setup is a separate development utility, not a runtime dependency of SMIS.

### Windows: inspect hardware before installing development tools

Run in PowerShell:

```powershell
Get-CimInstance Win32_ComputerSystem
Get-CimInstance Win32_Processor
Get-CimInstance Win32_VideoController
Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
Get-CimInstance Win32_OperatingSystem
Get-NetAdapter | Where-Object Status -eq "Up"
```

For a quick memory and graphics check:

```powershell
systeminfo | findstr /C:"Total Physical Memory"
Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM
```

### Windows: check Ollama and available local model resources

```powershell
ollama --version
ollama list
```

A model download used in an earlier Windows test was:

```powershell
ollama pull qwen2.5-coder:7b
```

The local Ollama API was accessed at:

```text
http://localhost:11434
```

Check available RAM, CPU, GPU, and disk space before pulling a large model. Model size and hardware requirements vary.

### Ubuntu: inspect CPU, memory, graphics, and storage

```bash
free -h
lscpu
lspci | grep -Ei 'vga|3d|display'
df -h
```

### Ubuntu: install and test speech output

The following commands were used while preparing the local Joes AI workstation:

```bash
sudo apt update
sudo apt install -y espeak-ng
espeak-ng "Hello, I'm Joes AI."
```

### Ubuntu: install Open Interpreter from a downloaded Debian package

Historical package-download method:

```bash
cd /tmp
curl -fsSL https://openinterpreter.com/download/linux/deb -o Interpreter-linux-amd64.deb
sudo apt install -y ./Interpreter-linux-amd64.deb
interpreter --version
```

This downloads a third-party installer package. Verify the publisher and current installation instructions before using it on a school server. It is intended for the separate local AI workstation, not the SMIS production server.

### Ubuntu: install Open Interpreter using its installer script

A separate historical installation method was:

```bash
curl -fsSL https://www.openinterpreter.com/install | sh
source ~/.bashrc
hash -r
interpreter --version
i --version
```

Use only one installation method unless you deliberately need to repair or replace an existing installation. Review remote installer scripts and publisher instructions before executing them.

### Ubuntu: launch the local AI tool from the SMIS workspace

```bash
cd ~/School-Management-Information-System
interpreter
```

The separate local Ollama model previously installed on the Ubuntu workstation was `qwen2.5-coder:1.5b`. Check the actual installed models with:

```bash
ollama list
```


---

## 23. Ollama installation and local AI troubleshooting

These commands belong to the separate Joes AI/local development workstation. They are not required to run SMIS.

### Ubuntu: install or verify Ollama

Check whether the executable is available:

```bash
which ollama
ollama --version
```

Historical official installer command:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Review the official installation instructions and script before running it. After installation, verify the command and installed models:

```bash
ollama --version
ollama list
```

### Ubuntu: run a small local model

Previously tested model commands:

```bash
ollama run qwen2.5:0.5b
ollama run qwen2.5:1.5b
ollama run qwen2.5-coder:1.5b
```

The model must be downloaded before it can be used offline. Once downloaded, Ollama can serve the model locally without an internet connection.

### Ubuntu: diagnose Open Interpreter installation

Check Python, pip, and whether the application is installed or discoverable:

```bash
python3 --version
pip3 --version
command -v interpreter
python3 -m pip show open-interpreter
pipx list
```

Inspect downloaded installer files:

```bash
ls -lah ~/Downloads
ls -lh /tmp/openinterpreter-install.sh
```

Check basic HTTPS connectivity to GitHub when downloads fail:

```bash
curl -I https://github.com
```

### Ubuntu: inspect the frontend asset manifest after deployment

After a verified frontend deployment, this historical command extracts Vite asset references from the deployed HTML:

```bash
grep -o 'assets/index-[^"]*' /opt/schoolmanagement/frontend/index.html
```

Confirm the deployed HTML path before running it; the deployment directory can differ between servers.
