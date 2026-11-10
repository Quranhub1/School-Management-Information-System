# SMIS Institutional Email Service

A local Node.js service that delivers institutional email using Nodemailer, renders HTML with EJS, and generates PDF receipts with PDFKit. It has no database connection and does not expose SMTP credentials to the frontend.

## Runtime contract

- Local development binds to `127.0.0.1:5100`. The Docker image binds to `0.0.0.0:5100` inside the container; attach it only to a private container network and do not publish the port publicly. When the API runs in a separate container, set `EmailService:BaseUrl` to the email service's private DNS name.
- `GET /health` is an unauthenticated liveness endpoint.
- `POST /internal/receipts/send` delivers a payment receipt and PDF attachment.
- `POST /internal/test` sends the administrator's SMTP test message.
- Internal endpoints require `x-smis-email-service-key`; configure a random key of at least 32 characters.
- SMTP credentials are supplied transiently by the authenticated .NET API after decrypting the institution's Data Protection-protected password. They are not persisted by this service.

## Local development

Requires Node.js 22.

```sh
cd services/email-service
npm install
npm test
EMAIL_SERVICE_API_KEY="$(openssl rand -hex 32)" npm start
```

The service only sends mail through the SMTP host configured in SMIS. It does not call an external email API. Build the image on a connected build machine and transfer the image to an offline deployment host if the deployment environment has no internet access.

## Security and operations

- Keep the service on loopback or a private container network; do not publish port 5100 to the public internet.
- Use a unique `EMAIL_SERVICE_API_KEY` shared only by the API and email service.
- Require valid SMTP TLS certificates; certificate validation is enabled.
- Do not log request bodies, SMTP credentials, message content or recipient data.
- SMTP availability, provider quotas and delivery policies remain provider-dependent.
