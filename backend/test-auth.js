import prisma from './src/config/db.js';
import { hashPassword, comparePassword, validatePasswordStrength } from './src/utils/password.js';
import { generateToken, verifyToken, decodeToken } from './src/utils/jwt.js';

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

async function runTests() {
  console.log('\n🏥 ========================================================');
  console.log('   MODULE 1 - DAY 2: JWT AUTH & PASSWORD HASHING TESTS');
  console.log('========================================================\n');

  try {
    // -------------------------------------------------------------
    // Test 1: Password Strength Validation
    // -------------------------------------------------------------
    console.log('🔹 1. Password Strength Validation:');
    const weakCheck = validatePasswordStrength('123');
    assert(!weakCheck.isValid, 'Rejects short password ("123")');

    const strongCheck = validatePasswordStrength('Secure#2026Password');
    assert(strongCheck.isValid, 'Accepts strong password ("Secure#2026Password")');
    assert(strongCheck.score >= 4, `Calculates high strength score (${strongCheck.score}/5)`);

    // -------------------------------------------------------------
    // Test 2: BCrypt Hashing & Comparison
    // -------------------------------------------------------------
    console.log('\n🔹 2. BCrypt Password Hashing & Comparison:');
    const rawPass = 'DoctorSecret@2026';
    const hash = await hashPassword(rawPass);

    assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Generates valid BCrypt salted hash string');
    assert(hash !== rawPass, 'Password is cryptographically hashed (not stored plain text)');

    const matchSuccess = await comparePassword(rawPass, hash);
    assert(matchSuccess === true, 'comparePassword matches correct password with hash');

    const matchFail = await comparePassword('WrongPassword!', hash);
    assert(matchFail === false, 'comparePassword rejects incorrect password');

    // -------------------------------------------------------------
    // Test 3: JWT Token Generation & Verification
    // -------------------------------------------------------------
    console.log('\n🔹 3. JWT Token Generation & Verification:');
    const mockUser = {
      id: 'usr_test_12345',
      email: 'dr.test@hms.hospital',
      fullName: 'Dr. Test Specialist',
      role: 'DOCTOR',
    };

    const token = generateToken(mockUser, '1h');
    assert(typeof token === 'string' && token.split('.').length === 3, 'Generates valid 3-part signed JWT token');

    const decoded = verifyToken(token);
    assert(decoded.id === mockUser.id, 'Decoded token contains matching user ID');
    assert(decoded.email === mockUser.email, 'Decoded token contains matching user email');
    assert(decoded.role === mockUser.role, 'Decoded token contains matching user role');
    assert(decoded.iss === 'Smart-Hospital-Management-System', 'Decoded token has expected issuer claim');

    const decodedRaw = decodeToken(token);
    assert(decodedRaw.header.alg === 'HS256', 'Token uses HS256 HMAC algorithm');

    // -------------------------------------------------------------
    // Test 4: Database User Credentials Verification
    // -------------------------------------------------------------
    console.log('\n🔹 4. Database Seed Users & Role Verification:');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@hms.hospital' },
    });
    assert(!!adminUser, 'Admin user exists in database');
    if (adminUser) {
      assert(adminUser.role === 'ADMIN', 'Admin has ADMIN role');
      const adminPassValid = await comparePassword('Admin@12345', adminUser.passwordHash);
      assert(adminPassValid, 'Admin password hash verified with Admin@12345');
    }

    const doctorUser = await prisma.user.findUnique({
      where: { email: 'dr.sarah@hms.hospital' },
      include: { doctorProfile: true },
    });
    assert(!!doctorUser, 'Doctor user exists in database');
    if (doctorUser) {
      assert(doctorUser.role === 'DOCTOR', 'Doctor has DOCTOR role');
      assert(!!doctorUser.doctorProfile, 'Doctor has linked DoctorProfile');
      const doctorPassValid = await comparePassword('Password@123', doctorUser.passwordHash);
      assert(doctorPassValid, 'Doctor password hash verified with Password@123');
    }

    const patientUser = await prisma.user.findUnique({
      where: { email: 'david.miller@gmail.com' },
      include: { patientProfile: true },
    });
    assert(!!patientUser, 'Patient user exists in database');
    if (patientUser) {
      assert(patientUser.role === 'PATIENT', 'Patient has PATIENT role');
      assert(!!patientUser.patientProfile?.mrn, `Patient has auto-assigned MRN: ${patientUser.patientProfile?.mrn}`);
    }

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

runTests();
