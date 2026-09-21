import { Router } from 'express';
import {
  getWards,
  createWard,
  getBeds,
  createBed,
  allocateBed,
  dischargeBed,
  getActiveAllocations,
} from '../controllers/ipdController.js';

const router = Router();

router.get('/wards', getWards);
router.post('/wards', createWard);

router.get('/beds', getBeds);
router.post('/beds', createBed);

router.post('/allocations', allocateBed);
router.post('/allocations/:id/discharge', dischargeBed);
router.get('/allocations/active', getActiveAllocations);

export default router;
