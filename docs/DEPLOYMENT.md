# Deployment Architecture

## Target environment

The primary production target is an on-premises Ubuntu Server machine on the school LAN.

## Logical flow

Client browser -> Nginx -> ASP.NET Core API -> relational database

The React frontend is delivered as static web assets and communicates with the API over the LAN.

## Network assumptions

The server should have a stable LAN address. The API defaults to TCP port 5000 and can serve the compiled React frontend from the same origin. The host-local URL is http://127.0.0.1:5000; LAN clients use http://HOST-PC-LAN-IP:5000. The actual IP must be established by a router DHCP reservation and must not be hard-coded into application source code. The DHCP reservation is still pending router access; see [LAN host setup](LAN_HOST_SETUP.md).

## Deployment phases

1. Local development.
2. CI build and automated tests.
3. Staging deployment.
4. LAN acceptance testing.
5. Production deployment.
6. Backup and restore verification.

## Internet independence

The core application must not require an external API, cloud database, or Internet connection for normal internal school operations.

Optional external integrations such as SMS or external email may be disabled when Internet connectivity is unavailable.


## Production frontend hosting

Run `npm run build:lan` in `frontend/`. This runs the frontend production checks/build, emits root-relative web assets, and copies the bundle to the API project's `wwwroot`. The API serves the static frontend and falls back to `index.html` for client-side routes. API paths are excluded from the SPA fallback. The Vite development server on port 5173 remains development-only.

## Router reservation status

- [ ] Identify the host PC's active LAN adapter and MAC address.
- [ ] Add a DHCP reservation in the school router.
- [ ] Verify the reserved lease remains stable after reboot/renewal.
- [ ] Verify port 5000 from another school computer.

These are target-network tasks and cannot be completed from source control alone. They require authorized access to the actual router configuration.
