# SMIS LAN host setup

## Target network arrangement

- Backend listener: `http://0.0.0.0:5000`
- Host-local URL: `http://127.0.0.1:5000`
- School-client URL: `http://HOST-PC-LAN-IP:5000`
- Health endpoint: `/health`
- Frontend and API share the same origin; the Vite development server is not used for production hosting.

## 1. Identify the host PC network adapter

On the Windows host PC, open PowerShell:

```powershell
Get-NetIPConfiguration |
  Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } |
  Select-Object InterfaceAlias,
    @{Name="IPv4";Expression={$_.IPv4Address.IPAddress}},
    @{Name="Gateway";Expression={$_.IPv4DefaultGateway.NextHop}},
    @{Name="MAC";Expression={$_.NetAdapter.MacAddress}},
    @{Name="DHCP";Expression={$_.NetIPv4Interface.Dhcp}}
```

Use the adapter actually connected to the school router (Ethernet is preferable for a permanently installed host). Record its MAC address, current IPv4 address, subnet and default gateway. Do not reserve an address for a disconnected adapter or a temporary VPN interface.

## 2. Reserve the address in the router (PENDING)

**Status: NOT DONE — router access and details are required.**

1. Open the router administration page using the default gateway shown above.
2. Sign in with the institution's router administrator account.
3. Find LAN / DHCP Server / Address Reservation (the exact menu varies by router).
4. Add a reservation for the host PC's active adapter MAC address.
5. Select an unused IPv4 address within the LAN subnet and compatible with the router's DHCP reservation rules. Prefer an address outside the automatic DHCP pool if the router requires that.
6. Save the reservation, renew the host PC's DHCP lease or restart its network adapter, and verify that the reserved address is assigned.
7. Confirm the address remains the same after a host PC restart and router lease renewal.

Do not guess the router address, credentials, MAC address or reservation IP. Do not change the router's DHCP pool or gateway settings without checking existing clients and network configuration first.

## 3. Configure the host firewall

Create an inbound TCP allow rule for local port `5000`, limited to the Private profile and trusted school LAN. Do not create a public/WAN port-forward. Keep PostgreSQL port `5432` inaccessible to ordinary client computers.

Avast Firewall may also require an application rule for the API process:
- Development launch: the installed `dotnet.exe`.
- Published deployment: `SchoolManagement.Api.exe` or the hosting `dotnet.exe`, depending on publish mode.

## 4. Verify production hosting

On the host PC:

```powershell
Test-NetConnection 127.0.0.1 -Port 5000
Invoke-WebRequest http://127.0.0.1:5000/health
```

From another school computer, replace the example address with the reserved host address:

```powershell
Test-NetConnection HOST-PC-LAN-IP -Port 5000
Invoke-WebRequest http://HOST-PC-LAN-IP:5000/health
```

Open `http://HOST-PC-LAN-IP:5000` in the client browser. Verify login and at least one authenticated API workflow.

## 5. Details needed to complete the router reservation

The reservation cannot be safely applied from repository changes alone. To finish it, the operator must provide:
- Router make/model (or a screenshot of its DHCP reservation page, with passwords and public IPs hidden).
- The host PC adapter details from section 1.
- Confirmation that the operator can sign in to the router administration interface.

Do not share the router administrator password in chat. The operator can perform the final save while following the exact reservation values and steps.
