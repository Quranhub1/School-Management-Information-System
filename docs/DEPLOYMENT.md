# Deployment Architecture

## Target environment

The primary production target is an on-premises Ubuntu Server machine on the school LAN.

## Logical flow

Client browser -> Nginx -> ASP.NET Core API -> relational database

The React frontend is delivered as static web assets and communicates with the API over the LAN.

## Network assumptions

The server should have a stable LAN address. The exact IP, DNS/local hostname, firewall policy, and router configuration will be determined during deployment and must not be hard-coded into application source code.

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
