# billing-service

Owns invoices and settlement; authorises invoice payments through Payments.

Owned by **Billing Platform**. Registered in the Atlassian Service Registry as **Billing**.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/invoices` | Raise an invoice |
| `GET` | `/invoices/:invoiceId` | Read an invoice |
| `POST` | `/invoices/:invoiceId/pay` | Authorise payment for an invoice |
| `POST` | `/invoices/:invoiceId/credit-notes` | Credit a paid invoice |
| `GET` | `/health` | Liveness |
| `GET` | `/ready` | Readiness |
| `GET` | `/metrics` | Counts by status |

## Quick start

```bash
npm install
npm start
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `SERVICE_NAME` | `billing-service` | Service name in logs and telemetry |
| `RELEASE` | `billing-<package version>` | Release identifier in logs and telemetry |
| `API_KEY` | unset | When set, requests must send `x-api-key` |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window |
| `RATE_LIMIT_MAX` | `100` | Requests per window per client |

## Architecture

Routes parse and validate, controllers map to HTTP, the service layer holds the business
rules, and the repository keeps state in an in-memory `Map`. There is no external database.

## Dependencies

Called synchronously by **Customer Payments API**, and calls **Payments** synchronously to authorise a payment.
