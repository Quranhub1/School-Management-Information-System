# Attendance device integration

## Barcode readers (USB HID keyboard mode)

The Attendance > Daily tab includes a **Scan student barcode** field. A standard USB barcode reader configured as a keyboard wedge types the scanned value into this field. Configure the reader to append an Enter/Carriage Return suffix; Enter submits the value to the currently open attendance session.

The barcode payload must currently be the student's SMIS **Student ID GUID**, because the existing attendance endpoint accepts `studentId` as a GUID. Do not encode names, phone numbers, or other personal details in the barcode. If cards should contain admission numbers instead, add a server-side, permission-checked lookup from admission number to Student ID before enabling that format.

No barcode JavaScript package, CDN, network service, or internet connection is required.

## Fingerprint readers

Fingerprint capture is vendor-specific. Do not assume a generic USB fingerprint reader can be driven by a browser.

### SecuGen WebAPI

For supported SecuGen readers (including Hamster Pro 20 and Hamster IV), install the vendor's Windows driver and SecuGen WebAPI Client (SgiBioSrv) on each attendance workstation. The vendor service exposes:

- Capture: `https://localhost:8000/SGIFPCapture`
- Template comparison: `https://localhost:8000/SGIMatchScore`

The capture response includes `ErrorCode`, device details, and `TemplateBase64`. Always check `ErrorCode === 0` before using the template. Matching requires two templates and returns `MatchingScore` (0–199). The service requires the appropriate SecuGen licence for the application origin.

Official documentation: https://webapi.secugen.com/docs/SECUGEN_WEB_SERVICE_API_DOC.pdf

### HID DigitalPersona

For U.are.U readers, install the supported HID DigitalPersona client and use the matching, locally bundled vendor WebSDK assets. The browser SDK captures biometric samples; matching should be performed by a trusted matching service/SDK, not by trusting a browser-side success flag.

Official SDK: https://github.com/hidglobal/digitalpersona-fingerprint

### Before enabling fingerprint attendance

The SMIS database currently records attendance against a Student ID but does not provide a fingerprint-enrolment/template lifecycle. Fingerprint attendance therefore needs a separately designed, access-controlled enrolment and verification workflow before it can identify a student. That workflow must define:

1. The exact reader model and vendor runtime installed on each workstation.
2. Who may enrol, replace, and revoke a student's fingerprint.
3. Encrypted template storage, key management, audit events, retention, and deletion.
4. A trusted matching boundary and a threshold calibrated for the selected SDK.
5. Consent, fallback attendance, and device-unavailable procedures.

Do not store raw fingerprint images or templates in browser localStorage, sessionStorage, or logs. Do not mark a student present merely because a capture succeeded; capture is not identity verification.

The browser-to-local-service connection must be tested from the actual SMIS origin. HTTPS pages may require the vendor's trusted localhost certificate. Restrict localhost service access to trusted origins where the vendor supports origin allow-listing.
