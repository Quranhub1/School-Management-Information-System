# Library ISBN barcode and fingerprint device integration

## Book ISBN barcode readers (USB HID keyboard mode)

The barcode reader is for **books and their ISBNs**, not student attendance.

The Library > Add New Book section includes a **Scan book ISBN barcode** field. A standard USB barcode reader configured as a keyboard wedge types the book's ISBN into this field. Configure the scanner to append an Enter/Carriage Return suffix. Enter transfers the scanned ISBN into the book registration form, where SMIS applies ISBN formatting and checksum validation. The book's EAN-13/Bookland barcode preview is generated locally by the already-bundled JsBarcode package.

No extra barcode JavaScript package, CDN, internet connection, or Windows background service is required for a standard USB HID barcode scanner.

ISBN barcode data should be the ISBN digits. The scanner may include separators; SMIS normalizes and formats the value. The ISBN checksum must be valid before the book can be saved. This scanner workflow is specifically for book catalogue registration; it does not submit student attendance.

## Fingerprint readers

Fingerprint capture is vendor-specific. Do not assume a generic USB fingerprint reader can be driven by a browser.

### SecuGen WebAPI

For supported SecuGen readers (including Hamster Pro 20 and Hamster IV), install the vendor's Windows driver and SecuGen WebAPI Client (SgiBioSrv) on each workstation. The vendor service exposes:

- Capture: `https://localhost:8000/SGIFPCapture`
- Template comparison: `https://localhost:8000/SGIMatchScore`

The capture response includes `ErrorCode`, device details, and `TemplateBase64`. Always check `ErrorCode === 0` before using the template. Matching requires two templates and returns `MatchingScore` (0–199). The service requires the appropriate SecuGen licence for the application origin.

Official documentation: https://webapi.secugen.com/docs/SECUGEN_WEB_SERVICE_API_DOC.pdf

### HID DigitalPersona

For U.are.U readers, install the supported HID DigitalPersona client and use the matching, locally bundled vendor WebSDK assets. The browser SDK captures biometric samples; matching should be performed by a trusted matching service/SDK, not by trusting a browser-side success flag.

Official SDK: https://github.com/hidglobal/digitalpersona-fingerprint

### Before enabling fingerprint features

The exact reader model and intended use must be confirmed before implementation. A fingerprint capture alone does not verify identity. Any future biometric workflow must define:

1. The exact reader model and vendor runtime installed on each workstation.
2. Who may enrol, replace, and revoke a person's fingerprint.
3. Encrypted template storage, key management, audit events, retention, and deletion.
4. A trusted matching boundary and a threshold calibrated for the selected SDK.
5. Consent, fallback procedures, and device-unavailable handling.

Do not store raw fingerprint images or templates in browser localStorage, sessionStorage, or logs. The browser-to-local-service connection must be tested from the actual SMIS origin. HTTPS pages may require the vendor's trusted localhost certificate. Restrict localhost service access to trusted origins where the vendor supports origin allow-listing.
