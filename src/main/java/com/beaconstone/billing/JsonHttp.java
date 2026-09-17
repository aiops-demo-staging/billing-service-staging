package com.beaconstone.billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

final class JsonHttp {
    static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonHttp() {}

    static HttpServer server(int port) throws IOException {
        return HttpServer.create(new InetSocketAddress(port), 0);
    }

    static Map<String, Object> readJson(HttpExchange exchange) throws IOException {
        return MAPPER.readValue(exchange.getRequestBody(), MAPPER.getTypeFactory()
            .constructMapType(Map.class, String.class, Object.class));
    }

    static void json(HttpExchange exchange, int status, Object payload) throws IOException {
        byte[] bytes = MAPPER.writeValueAsBytes(payload);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("x-request-id", requestId(exchange));
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    static String requestId(HttpExchange exchange) {
        String incoming = exchange.getRequestHeaders().getFirst("x-request-id");
        return incoming == null || incoming.isBlank() ? UUID.randomUUID().toString() : incoming;
    }

    static int port() {
        String value = System.getenv("PORT");
        return value == null ? 8080 : Integer.parseInt(value);
    }

    static String serviceName(String fallback) {
        String value = System.getenv("SERVICE_NAME");
        return value == null || value.isBlank() ? fallback : value;
    }

    static String release(String fallback) {
        String value = System.getenv("RELEASE");
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
