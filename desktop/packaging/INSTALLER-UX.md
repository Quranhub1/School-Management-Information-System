# SMIS Desktop Installer UX

The desktop deployment is designed for a school server/client environment where the administrator prepares the server once and carries the client installer on a USB flash drive to Windows workstations.

## Windows architecture

The release must support both:

- Windows 10/11 32-bit (`win-x86`)
- Windows 10/11 64-bit (`win-x64`)

The installer detects the operating-system architecture and installs the matching native client. It must never place a 64-bit executable on a 32-bit Windows installation.

## Installation flow

1. Welcome
2. License/installation options
3. Detect Windows architecture and install the matching client
4. **Mandatory SMIS server connection setup**
   - Enter/select the server endpoint supplied by the server administrator.
   - Do not provide a Skip/Later button.
5. **Mandatory connection test**
   - Verify the workstation has network connectivity.
   - Verify the configured SMIS server is reachable.
   - Verify the SMIS health endpoint responds successfully.
   - Verify the application can reach the required API origin.
   - Do not enable Finish while required checks are failing.
6. Save the validated server configuration locally for the installed client.
7. Create the Start Menu and desktop shortcuts.
8. Launch the installed SMIS application.
9. Show the SMIS login module immediately.
10. After successful authentication, route the user to the module/dashboard authorized for that account's role.
11. Show the normal native window controls: **Minimize, Maximize/Restore, and Close**.

## Login/session behavior

- Credentials are requested when the application is opened.
- A successful login establishes the authenticated application session.
- Role-based authorization remains enforced by the API; the client must not grant access by hiding/showing controls alone.
- When the user closes the application, the session is ended/cleared according to the authentication implementation.
- Opening the application again therefore presents the login module again.

## Network behavior

The client does not configure Ethernet or Wi-Fi. It uses the Windows operating system's existing network connection. The server/database remain centralized; the client never connects directly to PostgreSQL.

## Server unavailable behavior

If the network or server is unavailable, the client must show a clear connection/setup screen instead of crashing or opening a misleading login page. The required connection test must pass before first-run setup is considered complete.

## Finish means configured

The intended installer contract is that **Finish is the end of a successful installation, not a way to bypass server configuration**. The workstation should leave the installer with a tested SMIS endpoint, shortcuts installed, and the application ready to open to login.
