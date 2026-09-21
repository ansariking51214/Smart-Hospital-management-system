import prisma from '../config/db.js';

/**
 * Health check & system diagnostics endpoint
 */
export async function getHealthStatus(req, res, next) {
  try {
    const startTime = Date.now();
    // Test DB query
    const userCount = await prisma.user.count();
    const patientCount = await prisma.patientProfile.count();
    const doctorCount = await prisma.doctorProfile.count();
    const departmentCount = await prisma.department.count();
    const dbLatencyMs = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'Cloud-Based Hospital Management System (HMS) API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        database: {
          status: 'connected',
          provider: 'Prisma ORM (SQLite / SQL compatible)',
          latencyMs: dbLatencyMs,
          counts: {
            users: userCount,
            patients: patientCount,
            doctors: doctorCount,
            departments: departmentCount,
          },
        },
        moduleProgress: {
          currentModule: 'Module 1: Authentication, RBAC & Patient Registration',
          day: 'Day 1 (DB Schema Design & Project Setup)',
          status: 'Completed',
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
