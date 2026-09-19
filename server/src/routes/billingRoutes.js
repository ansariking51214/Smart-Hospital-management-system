import { Router } from 'express';
import {
  getUnbilledCharges,
  createInvoice,
  getInvoices,
  getInvoiceById,
  recordPayment,
  getInvoicePdfData,
} from '../controllers/billingController.js';

const router = Router();

router.get('/unbilled-charges/:patientId', getUnbilledCharges);
router.post('/invoices', createInvoice);
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoiceById);
router.post('/invoices/:id/payment', recordPayment);
router.get('/invoices/:id/pdf-data', getInvoicePdfData);

export default router;
