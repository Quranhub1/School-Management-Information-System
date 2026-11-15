# Library ISBN barcode and fingerprint device integration

## Book ISBN barcode readers (USB HID keyboard mode)

The barcode reader is for **books and their ISBNs**, not student attendance.

The Library > Add New Book form requires the librarian to select exactly one ISBN entry method: **Enter ISBN manually** or **Scan book barcode**. Only the selected method is displayed, so the librarian cannot use both methods for the same book. The ISBN is mandatory; leaving it blank prevents saving. In scan mode, a standard USB barcode reader configured as a keyboard wedge types the book's ISBN into the scan field. Configure the scanner to append an Enter/Carriage Return suffix. Enter transfers the scanned ISBN into the form, where SMIS applies ISBN formatting and checksum validation. In manual mode, the librarian types the ISBN digits directly. The book's EAN-13/Bookland barcode preview is generated locally by the already-bundled JsBarcode package.

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


## SMIS staff attendance station: ZKTeco ZK4500 and Live20R

Staff fingerprint attendance is a separate HR workflow. It does not replace student attendance and does not use the Library ISBN barcode reader.

### Device adapter boundary

SMIS defines a device-independent attendance contract: a workstation agent captures a fingerprint, performs identification using the vendor SDK and an enrolled template, and submits only the matched staff ID plus a unique capture ID to the authenticated SMIS API. The API assigns the UTC timestamp and derives check-in/check-out. The web browser must not attempt to access a USB fingerprint reader directly.

Each model requires its own adapter around the vendor runtime. The common adapter contract is not a claim that one driver or SDK can operate every reader.

### ZKTeco ZK4500

ZKTeco describes the ZK4500 as a USB optical scanner with a developer SDK and ZKFinger V10 templates. Its published product page states that live-fingerprint detection is not supported. This limitation must be considered in the institution's risk assessment; a successful match alone does not establish liveness.

ZKTeco's SDK selection guide lists ZK4500 among devices supported by selected ZKFinger SDK packages. Confirm the exact SDK package, architecture, operating system, redistribution licence, and driver with the supplier before packaging the workstation agent.

References:
- ZKTeco ZK4500: https://zkteco.systems/en/product/zk4500/
- ZKTeco SDK selection guide: https://zkteco.com.ua/download/ZKTeco%20Fingerprint%20Scanner%20SDK%20Selection%20Guide-Ver2.0.pdf

### ZKTeco Live20R

ZKTeco's Live20R product page advertises SDK availability and fingerprint liveness detection. However, the currently published ZKFinger SDK compatibility list surfaced for Windows/Linux names SLK20R and selected ZK series models; it does not explicitly establish Live20R compatibility. Do not treat Live20R and SLK20R as the same model. Obtain the exact Live20R SDK package and written compatibility confirmation from the supplier before enabling this adapter.

Reference: https://www.zkteco.in/fingerprint-scanner/Live20R

### Attendance event rules in SMIS

- The first accepted scan for a staff member on a calendar day is check-in (IN).
- The next accepted scan is check-out (OUT).
- A 30-second duplicate-scan guard and unique device/capture ID prevent repeated submissions from recording twice.
- Once OUT is recorded, later scans that day are rejected; corrections require an authorised administrative workflow.
- The API timestamp is UTC. The staff register displays times in Africa/Kampala.
- The daily register is one row per staff member per day and distinguishes Absent, Checked in (missing checkout), and Complete.
- The station should play its success tone only after the API confirms the event was saved. Failed/unknown matches must use a different error tone and must not create an attendance event.

### Security and rollout gate

The attendance capture endpoint is intended for a trusted, authenticated workstation agent after a successful local match. Before deployment, the agent must have a device-specific authentication credential, strict origin/local-service controls, encrypted template storage with managed keys, and audited enrolment/revocation. Do not expose a generic unauthenticated endpoint or accept a browser-provided “matched” flag as proof of identity.

The database credential entity accepts encrypted template bytes only. The actual enrolment UI, key-management service, device authentication, and vendor SDK adapters must be completed and tested against the physical ZK4500 and Live20R units before production use. No biometric template should be stored in browser storage or application logs.
