# Desktop packaging plan

## Windows

Release target: Windows 10/11 x64.

The release package must contain the SMIS desktop executable and its local frontend assets. WebView2 is used for rendering; the installer must verify/provide the WebView2 Runtime requirement without exposing browser chrome to users.

## Ubuntu

Release target: supported Ubuntu LTS x64 releases.

The Linux client is a separate native build. It must use the host's existing network connection and package its required WebKit desktop dependencies. It must not require Chrome or Firefox.

## Network model

The installed client does not configure networking. Normal operating-system Ethernet/Wi-Fi connectivity is sufficient. At first launch, the client uses the configured SMIS server endpoint and performs a health check. If the server cannot be reached, the UI reports the connection problem and allows the administrator to verify/change the server endpoint.

The API remains the only application data gateway. PostgreSQL stays server-side and is never exposed to client applications.
