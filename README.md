# billing-service

Owns invoices and settlement; authorises invoice payments through Payments.

Owned by **Billing Platform**. Java 21. Registered as **Billing**.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/invoices` | Raise an invoice |
| `GET` | `/invoices/:invoiceId` | Read an invoice |
| `POST` | `/invoices/:invoiceId/pay` | Authorise payment for an invoice |
| `GET` | `/health` | Liveness |

Called synchronously by **Customer Payments API**, and calls **Payments** synchronously
to authorise a payment.

```bash
mvn -q -DskipTests package
java -jar target/billing-service-2.10.0.jar
```
