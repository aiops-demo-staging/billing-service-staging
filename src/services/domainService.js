'use strict';

const { domainRepository } = require('../repositories/domainRepository');
const { paymentsClient } = require('../clients/paymentsClient');

const MAX_PAYMENT_ATTEMPTS = 5;

/**
 * Raises an invoice in `open` state. Nothing is charged until it is paid.
 *
 * The total is derived from the line items when they are supplied, so the invoice a
 * customer sees always adds up to what they are being asked to pay.
 */
function raiseInvoice(invoice) {
  const lineItems = invoice.lineItems || [];
  const derivedTotal = lineItems.reduce((total, item) => total + item.amountMinor, 0);

  return domainRepository.save({
    customerId: invoice.customerId,
    lineItems,
    amountMinor: derivedTotal > 0 ? derivedTotal : invoice.amountMinor,
    currency: invoice.currency,
    description: invoice.description,
    status: 'open',
    settlementStatus: 'none',
    paymentAttempts: 0,
  });
}

/**
 * Authorises payment for an invoice through Payments.
 *
 * Billing owns the invoice lifecycle, so an authorisation failure leaves the invoice open
 * rather than dropping it: the customer can retry with a different instrument. Attempts are
 * capped so a repeatedly declining card cannot generate unbounded traffic to Payments.
 *
 * Authorisation and settlement are tracked separately — an authorised invoice is not
 * settled revenue until the acquirer confirms.
 */
function payInvoice(invoiceId, payment) {
  const invoice = domainRepository.findById(invoiceId);
  if (!invoice) return null;

  if ((invoice.paymentAttempts || 0) + 1 > MAX_PAYMENT_ATTEMPTS) {
    return domainRepository.update(invoiceId, {
      status: 'open',
      declineReason: 'TooManyAttempts',
    });
  }
  domainRepository.recordAttempt(invoiceId);

  const result = paymentsClient.authorize({
    invoiceId,
    network: payment.network,
    amountMinor: invoice.amountMinor,
    currency: invoice.currency,
  });

  process.stdout.write(
    JSON.stringify({
      level: 'info',
      event: 'invoice.authorization_attempted',
      invoiceId,
      network: payment.network,
      profileId: result.profileId,
      authorized: result.authorized,
    }) + '\n',
  );

  return domainRepository.update(invoiceId, {
    status: result.authorized ? 'paid' : 'open',
    settlementStatus: result.authorized ? 'awaiting_settlement' : 'none',
    authorizationId: result.authorizationId,
    declineReason: result.declineReason || null,
    lastAttemptAt: new Date().toISOString(),
  });
}

module.exports = { raiseInvoice, payInvoice };
