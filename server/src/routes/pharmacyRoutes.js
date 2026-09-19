import { Router } from 'express';
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getBatches,
  addBatch,
  getPharmacyStats,
} from '../controllers/pharmacyController.js';

const router = Router();

router.get('/medicines', getMedicines);
router.post('/medicines', addMedicine);
router.put('/medicines/:id', updateMedicine);
router.delete('/medicines/:id', deleteMedicine);

router.get('/batches', getBatches);
router.post('/batches', addBatch);

router.get('/stats', getPharmacyStats);

export default router;
