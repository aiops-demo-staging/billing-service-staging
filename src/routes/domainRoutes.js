'use strict';

const express = require('express');
const domainController = require('../controllers/domainController');

const router = express.Router();

router.post('/invoices', domainController.raise);
router.get('/invoices/:invoiceId', domainController.getInvoice);
router.post('/invoices/:invoiceId/pay', domainController.pay);
router.post('/invoices/:invoiceId/credit-notes', domainController.issueCreditNote);

module.exports = router;
