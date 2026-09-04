import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import schemaRoutes from './schemaRoutes.js';
import authRoutes from './authRoutes.js';
import rbacRoutes from './rbacRoutes.js';
import patientRoutes from './patientRoutes.js';
import medicalHistoryRoutes from './medicalHistoryRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import opdQueueRoutes from './opdQueueRoutes.js';
import nurseTriageRoutes from './nurseTriageRoutes.js';
import appointmentFlowRoutes from './appointmentFlowRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/schema', schemaRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/rbac', rbacRoutes);
apiRouter.use('/patients', patientRoutes);
apiRouter.use('/medical-history', medicalHistoryRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/appointments', appointmentRoutes);
apiRouter.use('/queue', opdQueueRoutes);
apiRouter.use('/triage', nurseTriageRoutes);
apiRouter.use('/appointment-flow', appointmentFlowRoutes);

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
