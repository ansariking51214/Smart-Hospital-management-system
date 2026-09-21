import { Router } from 'express';
import { getSchemaDetails } from '../controllers/schemaController.js';

const router = Router();

router.get('/', getSchemaDetails);

export default router;
