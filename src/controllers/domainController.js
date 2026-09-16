'use strict';

const { raiseInvoice, payInvoice } = require('../services/domainService');
const { domainRepository } = require('../repositories/domainRepository');

function raise(req, res) {
  const invoice = {
    customerId: req.body.customerId,
    amountMinor: req.body.amountMinor,
    currency: req.body.currency || 'USD',
    description: req.body.description || null,
    lineItems: req.body.lineItems || [],
  };

  const record = raiseInvoice(invoice);

  return res.status(201).json({
    invoiceId: record.invoiceId,
    status: record.status,
    amountMinor: record.amountMinor,
    requestId: req.requestId,
  });
}

function getInvoice(req, res) {
  const record = domainRepository.findById(req.params.invoiceId);
  if (!record) {
    return res.status(404).json({ error: 'InvoiceNotFound', requestId: req.requestId });
  }
  return res.json(record);
}

function pay(req, res) {
  const record = payInvoice(req.params.invoiceId, { network: req.body.network });
  if (!record) {
    return res.status(404).json({ error: 'InvoiceNotFound', requestId: req.requestId });
  }
  return res.json({
    invoiceId: record.invoiceId,
    status: record.status,
    settlementStatus: record.settlementStatus,
    authorizationId: record.authorizationId,
    declineReason: record.declineReason,
    requestId: req.requestId,
  });
}

function issueCreditNote(req, res) {
  const invoice = domainRepository.findById(req.params.invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: 'InvoiceNotFound', requestId: req.requestId });
  }
  if (invoice.status !== 'paid') {
    return res.status(409).json({ error: 'InvoiceNotPaid', requestId: req.requestId });
  }
  const updated = domainRepository.update(invoice.invoiceId, {
    creditedMinor: (invoice.creditedMinor || 0) + (req.body.amountMinor || invoice.amountMinor),
  });
  return res.status(201).json({
    invoiceId: updated.invoiceId,
    creditedMinor: updated.creditedMinor,
    requestId: req.requestId,
  });
}

module.exports = { raise, getInvoice, pay, issueCreditNote };
