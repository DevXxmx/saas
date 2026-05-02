<!-- ── apps/partners/README.md ─────────────────────────────── -->

# Partners App

## Purpose

Lightweight CRM for external partners and companies. Allows admin to store contact information, upload contract files, and send emails to partners from the communications system.

## Models

| Model | Key Fields | Notes |
|---|---|---|
| `Partner` | `name`, `type`, `contact_person`, `email`, `phone`, `notes`, `contract_file` | `type`: `company`, `institution`, `ngo`, `other`. UUID primary key. |

## API Endpoints

| Method | URL | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/partners/` | Admin | List partners |
| `POST` | `/api/v1/partners/` | Admin | Create partner |
| `GET` | `/api/v1/partners/{id}/` | Admin | Partner detail |
| `PATCH` | `/api/v1/partners/{id}/` | Admin | Update partner |
| `DELETE` | `/api/v1/partners/{id}/` | Admin | Delete partner |

## Notes

- Partners are not users. They have no login.
- Partners can be selected as recipients in the bulk email composer using `recipient_type='partners'`.
- Contract files are stored in `partners/contracts/` in the media root (or S3 in production).
- All partner endpoints are admin-only.
