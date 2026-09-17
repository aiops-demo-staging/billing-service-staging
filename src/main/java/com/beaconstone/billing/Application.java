package com.beaconstone.billing;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Billing. Owns the invoice lifecycle and asks Payments to authorise card payments.
 * An authorisation failure leaves the invoice open so the customer can retry.
 */
public final class Application {
    private static final String SERVICE = JsonHttp.serviceName("billing-service");
    private static final String RELEASE = JsonHttp.release("billing-2.10.0");
    private static final int MAX_PAYMENT_ATTEMPTS = 5;
    private static final Map<String, Map<String, Object>> STORE = new ConcurrentHashMap<>();

    public static void main(String[] args) throws Exception {
        HttpServer server = JsonHttp.server(JsonHttp.port());
        server.createContext("/health", ex -> JsonHttp.json(ex, 200,
            Map.of("status", "ok", "service", SERVICE, "release", RELEASE)));
        server.createContext("/ready", ex -> JsonHttp.json(ex, 200, Map.of("status", "ready")));
        server.createContext("/metrics", ex -> JsonHttp.json(ex, 200,
            Map.of("service", SERVICE, "release", RELEASE, "invoices", STORE.size())));
        server.createContext("/invoices", Application::invoices);
        server.start();
        System.out.println("{\"level\":\"info\",\"message\":\"billing-service started\",\"service\":\""
            + SERVICE + "\",\"release\":\"" + RELEASE + "\",\"port\":" + JsonHttp.port() + "}");
    }

    private static void invoices(HttpExchange exchange) throws java.io.IOException {
        String path = exchange.getRequestURI().getPath();
        if ("POST".equals(exchange.getRequestMethod()) && "/invoices".equals(path)) {
            raise(exchange);
            return;
        }
        var pay = java.util.regex.Pattern.compile("^/invoices/([^/]+)/pay$").matcher(path);
        if (pay.matches() && "POST".equals(exchange.getRequestMethod())) {
            pay(exchange, pay.group(1));
            return;
        }
        var get = java.util.regex.Pattern.compile("^/invoices/([^/]+)$").matcher(path);
        if (get.matches() && "GET".equals(exchange.getRequestMethod())) {
            Map<String, Object> invoice = STORE.get(get.group(1));
            if (invoice == null) {
                JsonHttp.json(exchange, 404, Map.of("error", "InvoiceNotFound"));
                return;
            }
            JsonHttp.json(exchange, 200, invoice);
            return;
        }
        JsonHttp.json(exchange, 404, Map.of("error", "NotFound", "path", path));
    }

    @SuppressWarnings("unchecked")
    private static void raise(HttpExchange exchange) throws java.io.IOException {
        Map<String, Object> body = JsonHttp.readJson(exchange);
        List<Map<String, Object>> lineItems = body.get("lineItems") instanceof List<?> list
            ? (List<Map<String, Object>>) list : List.of();
        int derived = 0;
        for (Map<String, Object> item : lineItems) {
            if (item.get("amountMinor") instanceof Number n) {
                derived += n.intValue();
            }
        }
        int amountMinor = derived > 0 ? derived : (body.get("amountMinor") instanceof Number n ? n.intValue() : 0);
        Map<String, Object> invoice = new LinkedHashMap<>();
        invoice.put("invoiceId", UUID.randomUUID().toString());
        invoice.put("raisedAt", Instant.now().toString());
        invoice.put("customerId", body.get("customerId"));
        invoice.put("lineItems", lineItems);
        invoice.put("amountMinor", amountMinor);
        invoice.put("currency", body.getOrDefault("currency", "USD"));
        invoice.put("description", body.get("description"));
        invoice.put("status", "open");
        invoice.put("settlementStatus", "none");
        invoice.put("paymentAttempts", 0);
        STORE.put((String) invoice.get("invoiceId"), invoice);
        JsonHttp.json(exchange, 201, Map.of(
            "invoiceId", invoice.get("invoiceId"),
            "status", "open",
            "amountMinor", amountMinor,
            "requestId", JsonHttp.requestId(exchange)
        ));
    }

    private static void pay(HttpExchange exchange, String invoiceId) throws java.io.IOException {
        Map<String, Object> invoice = STORE.get(invoiceId);
        if (invoice == null) {
            JsonHttp.json(exchange, 404, Map.of("error", "InvoiceNotFound"));
            return;
        }
        int attempts = ((Number) invoice.getOrDefault("paymentAttempts", 0)).intValue() + 1;
        invoice.put("paymentAttempts", attempts);
        if (attempts > MAX_PAYMENT_ATTEMPTS) {
            invoice.put("declineReason", "TooManyAttempts");
            JsonHttp.json(exchange, 200, invoice);
            return;
        }
        Map<String, Object> body = JsonHttp.readJson(exchange);
        String network = body.get("network") == null ? "" : String.valueOf(body.get("network"));
        Map<String, Object> result = PaymentsClient.authorize(
            invoiceId, network, ((Number) invoice.get("amountMinor")).intValue());
        boolean authorized = Boolean.TRUE.equals(result.get("authorized"));
        invoice.put("status", authorized ? "paid" : "open");
        invoice.put("settlementStatus", authorized ? "awaiting_settlement" : "none");
        invoice.put("authorizationId", result.get("authorizationId"));
        invoice.put("declineReason", result.get("declineReason"));
        invoice.put("lastAttemptAt", Instant.now().toString());
        JsonHttp.json(exchange, 200, Map.of(
            "invoiceId", invoiceId,
            "status", invoice.get("status"),
            "settlementStatus", invoice.get("settlementStatus"),
            "authorizationId", invoice.get("authorizationId"),
            "declineReason", invoice.get("declineReason"),
            "requestId", JsonHttp.requestId(exchange)
        ));
    }

    private Application() {}
}
