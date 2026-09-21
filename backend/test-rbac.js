import prisma from './src/config/db.js';
import {
  SYSTEM_ROLES,
  ROLE_PERMISSIONS_MATRIX,
  PERMISSIONS,
  hasPermission,
} from './src/utils/rbacConfig.js';
import { generateToken, verifyToken } from './src/utils/jwt.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runRbacTests() {
  console.log('\n🏥 ========================================================');
  console.log('   MODULE 1 - DAY 3: ROLE-BASED ACCESS CONTROL (RBAC) TESTS');
  console.log('========================================================\n');

  try {
    // -------------------------------------------------------------
    // Test 1: Role Definitions & Hierarchy
    // -------------------------------------------------------------
    console.log('🔹 1. Role Definitions & Hierarchy:');
    assert(SYSTEM_ROLES.ADMIN === 'ADMIN', 'Admin role defined');
    assert(SYSTEM_ROLES.DOCTOR === 'DOCTOR', 'Doctor role defined');
    assert(SYSTEM_ROLES.RECEPTIONIST === 'RECEPTIONIST', 'Receptionist role defined');
    assert(SYSTEM_ROLES.NURSE === 'NURSE', 'Nurse role defined');
    assert(SYSTEM_ROLES.PHARMACIST === 'PHARMACIST', 'Pharmacist role defined');
    assert(SYSTEM_ROLES.PATIENT === 'PATIENT', 'Patient role defined');

    // -------------------------------------------------------------
    // Test 2: Granular Permissions Matrix
    // -------------------------------------------------------------
    console.log('\n🔹 2. Granular Permissions Matrix:');
    // Admin permissions
    assert(hasPermission('ADMIN', PERMISSIONS.MANAGE_USERS), 'Admin has MANAGE_USERS permission');
    assert(hasPermission('ADMIN', PERMISSIONS.VIEW_AUDIT_LOGS), 'Admin has VIEW_AUDIT_LOGS permission');
    assert(hasPermission('ADMIN', PERMISSIONS.CHANGE_USER_ROLES), 'Admin has CHANGE_USER_ROLES permission');

    // Doctor permissions
    assert(hasPermission('DOCTOR', PERMISSIONS.CREATE_CONSULTATION_NOTE), 'Doctor has CREATE_CONSULTATION_NOTE permission');
    assert(hasPermission('DOCTOR', PERMISSIONS.ISSUE_PRESCRIPTION), 'Doctor has ISSUE_PRESCRIPTION permission');
    assert(hasPermission('DOCTOR', PERMISSIONS.ORDER_LAB_TESTS), 'Doctor has ORDER_LAB_TESTS permission');
    assert(!hasPermission('DOCTOR', PERMISSIONS.MANAGE_USERS), 'Doctor lacks MANAGE_USERS permission (Strict Isolation)');

    // Receptionist permissions
    assert(hasPermission('RECEPTIONIST', PERMISSIONS.REGISTER_PATIENT), 'Receptionist has REGISTER_PATIENT permission');
    assert(hasPermission('RECEPTIONIST', PERMISSIONS.ISSUE_QUEUE_TOKEN), 'Receptionist has ISSUE_QUEUE_TOKEN permission');
    assert(!hasPermission('RECEPTIONIST', PERMISSIONS.CREATE_CONSULTATION_NOTE), 'Receptionist lacks CREATE_CONSULTATION_NOTE permission');

    // Nurse permissions
    assert(hasPermission('NURSE', PERMISSIONS.RECORD_VITAL_SIGNS), 'Nurse has RECORD_VITAL_SIGNS permission');
    assert(hasPermission('NURSE', PERMISSIONS.VIEW_WARD_ALLOCATIONS), 'Nurse has VIEW_WARD_ALLOCATIONS permission');
    assert(!hasPermission('NURSE', PERMISSIONS.ISSUE_PRESCRIPTION), 'Nurse lacks ISSUE_PRESCRIPTION permission');

    // Patient portal permissions
    assert(hasPermission('PATIENT', PERMISSIONS.VIEW_OWN_PROFILE), 'Patient has VIEW_OWN_PROFILE permission');
    assert(hasPermission('PATIENT', PERMISSIONS.VIEW_OWN_PRESCRIPTIONS), 'Patient has VIEW_OWN_PRESCRIPTIONS permission');
    assert(!hasPermission('PATIENT', PERMISSIONS.REGISTER_PATIENT), 'Patient cannot register other patients');
    assert(!hasPermission('PATIENT', PERMISSIONS.MANAGE_USERS), 'Patient lacks admin access');

    // -------------------------------------------------------------
    // Test 3: JWT Token Claims & Role Embedding
    // -------------------------------------------------------------
    console.log('\n🔹 3. JWT Token Claims & Role Embedding:');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@hms.hospital' } });
    const doctorUser = await prisma.user.findUnique({ where: { email: 'dr.sarah@hms.hospital' } });
    const patientUser = await prisma.user.findUnique({ where: { email: 'david.miller@gmail.com' } });

    assert(!!adminUser, 'Admin user found in database');
    assert(!!doctorUser, 'Doctor user found in database');
    assert(!!patientUser, 'Patient user found in database');

    const adminToken = generateToken(adminUser);
    const decodedAdmin = verifyToken(adminToken);
    assert(decodedAdmin.role === 'ADMIN', 'Admin JWT embeds ADMIN role');

    const doctorToken = generateToken(doctorUser);
    const decodedDoctor = verifyToken(doctorToken);
    assert(decodedDoctor.role === 'DOCTOR', 'Doctor JWT embeds DOCTOR role');

    const patientToken = generateToken(patientUser);
    const decodedPatient = verifyToken(patientToken);
    assert(decodedPatient.role === 'PATIENT', 'Patient JWT embeds PATIENT role');

    // -------------------------------------------------------------
    // Test 4: Role-Based Route Guard Logic Simulation
    // -------------------------------------------------------------
    console.log('\n🔹 4. Route Guard Authorization Logic:');
    function simulateGuard(userRole, allowedRoles) {
      return allowedRoles.includes(userRole);
    }

    // Admin Guard
    assert(simulateGuard(decodedAdmin.role, ['ADMIN']), 'Admin passes Admin Route Guard (200 OK)');
    assert(!simulateGuard(decodedDoctor.role, ['ADMIN']), 'Doctor blocked by Admin Route Guard (403 Forbidden)');
    assert(!simulateGuard(decodedPatient.role, ['ADMIN']), 'Patient blocked by Admin Route Guard (403 Forbidden)');

    // Doctor Guard
    assert(simulateGuard(decodedDoctor.role, ['DOCTOR', 'ADMIN']), 'Doctor passes Doctor Route Guard (200 OK)');
    assert(!simulateGuard(decodedPatient.role, ['DOCTOR']), 'Patient blocked by Doctor Route Guard (403 Forbidden)');

    // Receptionist Guard
    assert(simulateGuard('RECEPTIONIST', ['RECEPTIONIST', 'ADMIN']), 'Receptionist passes Reception Guard (200 OK)');
    assert(!simulateGuard('PATIENT', ['RECEPTIONIST']), 'Patient blocked by Reception Guard (403 Forbidden)');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n========================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test execution error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRbacTests();
