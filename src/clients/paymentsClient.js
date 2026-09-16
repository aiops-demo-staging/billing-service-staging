'use strict';

const { randomUUID } = require('crypto');

/**
 * Payments client.
 *
 * Beaconstone's demo estate runs each service in isolation, so this stands in for the
 * synchronous authorisation call to Payments. The request and response shapes match the
 * real contract, which is what makes the dependency legible in the service graph.
 *
 * Payments reports which authorisation profile it selected; Billing echoes it into its own
 * logs so the two services can be correlated during an investigation.
 */
const paymentsClient = {
  authorize(request) {
    return {
      authorized: true,
      authorizationId: randomUUID(),
      declineReason: null,
      profileId: 'card-default',
      network: request.network,
    };
  },
};

module.exports = { paymentsClient };
