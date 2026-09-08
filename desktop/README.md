# SMIS Desktop Client

The School Management Information System includes a native Windows desktop client intended to feel like a conventional installed school-management application rather than a browser tab.

## Architecture

- **Shell:** .NET 8 WPF
- **Embedded UI:** Microsoft WebView2
- **Backend:** the existing authenticated SMIS ASP.NET Core API
- **Database:** PostgreSQL remains server-side; the desktop client never connects directly to PostgreSQL

The shell owns the application window, title, lifecycle, navigation policy, and browser-feature restrictions. Users do not see an address bar, tabs, browser chrome, or developer tools.

## Production configuration

Before packaging for deployment, replace the production system URI in `MainWindow.xaml.cs` with the institution's final HTTPS frontend origin. The final packaging phase should also bundle the approved frontend build and serve it through the desktop shell's local application origin so the installed client does not depend on a normal browser session.

## Local build

From a Windows machine with the .NET 8 SDK and WebView2 Runtime installed:

```powershell
dotnet build desktop/SchoolManagement.Desktop/SchoolManagement.Desktop.csproj -c Release
```

The WebView2 Runtime is a Windows prerequisite for the embedded UI.
