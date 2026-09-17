package com.beaconstone.billing;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Payments client.
 *
 * Stands in for the synchronous authorisation call to Payments. Payments reports which
 * authorisation profile it selected; Billing echoes it so the two services can be
 * correlated during an investigation.
 */
final class PaymentsClient {
    static Map<String, Object> authorize(String invoiceId, String network, int amountMinor) {
        Map<String, Object> result = new HashMap<>();
        result.put("authorized", true);
        result.put("authorizationId", UUID.randomUUID().toString());
        result.put("declineReason", null);
        result.put("profileId", "card-default");
        result.put("network", network);
        result.put("invoiceId", invoiceId);
        result.put("amountMinor", amountMinor);
        return result;
    }

    private PaymentsClient() {}
}
