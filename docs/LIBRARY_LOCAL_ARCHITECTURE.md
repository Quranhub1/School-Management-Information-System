# Library Management — Local Architecture

Library Management is a single SMIS workspace. Librarian management and KOHA/DSpace configuration belong under Library Management rather than appearing as separate top-level modules.

## Local operating model

The SMIS library module runs on the school's local server/LAN. KOHA and DSpace may be separately installed on the same local network and can be configured by an authorized library administrator.

```text
Library Management
├── Catalogue & Circulation
├── Librarians
│   ├── Assign librarian
│   ├── Library role
│   ├── Activate / deactivate
│   └── Access control
└── Integrations
    ├── KOHA
    │   ├── OPAC endpoint
    │   ├── API endpoint
    │   └── connection status
    └── DSpace
        ├── Repository endpoint
        └── connection status
```

External integration failure must not prevent local catalogue, circulation or librarian management from working.
