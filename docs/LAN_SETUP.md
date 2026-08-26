# LAN Setup Guide

## Network Requirements

- All client computers must be on the same LAN/VLAN as the Ubuntu server.
- The server must have a **static LAN IP address** (recommended) or a DHCP reservation.
- No internet connection is required after initial installation.

## Static IP Configuration

On Ubuntu Server:

```bash
# Find your network interface
ip a

# Configure static IP (example for Netplan on 22.04+)
sudo nano /etc/netplan/01-netcfg.yaml
```

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: no
      addresses:
        - 192.168.1.50/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

```bash
sudo netplan apply
```

## Verify LAN Connectivity

From the server:
```bash
ping -c 3 192.168.1.1
```

From a client computer:
```bash
ping <SERVER-IP>
```

## Firewall Rules

The installer configures UFW to allow:
- Port 22/tcp (SSH) — restrict to admin IP if possible
- Port 80/tcp (HTTP)
- Port 443/tcp (HTTPS, if configured)

PostgreSQL (port 5432) is **not** exposed externally; only the API on port 5000 is accessible internally via Nginx.

## Access URLs

| URL | Purpose |
|-----|---------|
| `http://<SERVER-IP>` | SMIS frontend (all users) |
| `http://<SERVER-IP>/health` | API health check |
| `http://<SERVER-IP>:5000` | Direct API access (for debugging) |

## DNS / Hostname (Optional)

If the school has a local DNS server or Windows AD DNS:

1. Create an A record: `smis` → `<SERVER-IP>`
2. Users can then access: `http://smis`

Without DNS, users must use the IP address directly.

## Browser Compatibility

Tested and supported:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**Recommendation:** Use Chrome or Firefox for best compatibility.

## Role-Based Access

Users log in with their assigned roles. Each role sees only authorized modules. Default roles are seeded during installation.

To assign roles, log in as `admin` and go to **Administration → Users**.

## Client Computer Requirements

- Any computer with a modern web browser
- No software installation required on client machines
- No .NET SDK required
- Screen resolution: 1024×768 minimum, 1920×1080 recommended
