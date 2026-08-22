import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import schemaRoutes from './schemaRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/schema', schemaRoutes);

// Placeholder routes for Module 1 Day 2-5 (ready to be hooked up)
apiRouter.get('/version', (req, res) => {
  res.json({
    name: 'Smart Hospital Management System API',
    version: '1.0.0',
    module: 'Module 1: Authentication, RBAC & Patient Registration',
    status: 'Operational',
  });
});

export default apiRouter;
