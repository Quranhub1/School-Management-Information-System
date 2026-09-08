# SMIS Desktop Client

The School Management Information System desktop client is being packaged as a standalone installed application for Windows and Ubuntu/Linux.

## Target behavior

- Opens from a desktop shortcut/application menu like a conventional school-management application.
- No Chrome/Edge/Firefox address bar, tabs or browser controls are exposed.
- Uses the computer's existing Ethernet/Wi-Fi network connection automatically.
- Connects to the configured SMIS server over HTTPS/LAN without connecting directly to PostgreSQL.
- Provides a server connection/health check so an unavailable network or server produces a useful message instead of a crash.

## Supported client targets

- Windows 10 and Windows 11, x64.
- Supported Ubuntu LTS releases, x64.

Compatibility is validated by CI against the operating-system/runtime combinations used for release builds. No installer can honestly guarantee every historical Ubuntu release indefinitely because operating-system libraries and security support change over time.

## Packaging architecture

The desktop package will contain the approved React frontend as local application assets. The native shell loads those assets itself and communicates with the remote SMIS API. This keeps the application independent of a user's normal web browser while retaining the central server/database architecture.

Windows uses the Windows WebView2 runtime. Ubuntu/Linux uses the platform WebKit runtime supplied by the operating system/package dependencies. The application does not install or modify network adapters, Wi-Fi settings, or PostgreSQL on client computers.
