'use strict';

const { randomUUID } = require('crypto');

/**
 * In-memory invoice store. The demo service keeps no external database.
 */
const store = new Map();

const domainRepository = {
  save(record) {
    const saved = {
      invoiceId: randomUUID(),
      raisedAt: new Date().toISOString(),
      ...record,
    };
    store.set(saved.invoiceId, saved);
    return saved;
  },

  update(invoiceId, changes) {
    const existing = store.get(invoiceId);
    if (!existing) return null;
    const updated = { ...existing, ...changes };
    store.set(invoiceId, updated);
    return updated;
  },

  recordAttempt(invoiceId) {
    const existing = store.get(invoiceId);
    if (!existing) return null;
    return this.update(invoiceId, { paymentAttempts: (existing.paymentAttempts || 0) + 1 });
  },

  findById(invoiceId) {
    return store.get(invoiceId) || null;
  },

  countByStatus() {
    return [...store.values()].reduce((counts, record) => {
      counts[record.status] = (counts[record.status] || 0) + 1;
      return counts;
    }, {});
  },

  size() {
    return store.size;
  },
};

module.exports = { domainRepository };
