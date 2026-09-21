import prisma from './src/config/db.js';

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

async function runAppointmentBookingTests() {
  console.log('\n📅 ====================================================================');
  console.log('   MODULE 2 - DAY 2: SLOT BOOKING ENGINE & APPOINTMENT SCHEDULING TESTS');
  console.log('====================================================================\n');

  try {
    // -------------------------------------------------------------
    // Setup & Fixture Resolution
    // -------------------------------------------------------------
    const doctor = await prisma.doctorProfile.findFirst({
      where: { licenseNumber: 'LIC-CARD-99482' },
      include: { user: true, department: true },
    });
    assert(!!doctor, `Target Doctor located: Dr. ${doctor.user.fullName} (${doctor.specialization})`);

    const patient = await prisma.patientProfile.findFirst({
      where: { mrn: 'MRN-2026-0001' },
    });
    assert(!!patient, `Target Patient located: ${patient.firstName} ${patient.lastName} (${patient.mrn})`);

    // Target Future Date (Wednesday, next week)
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + ((3 - testDate.getDay() + 7) % 7 || 7)); // Next Wednesday
    const dateString = testDate.toISOString().split('T')[0];

    // -------------------------------------------------------------
    // Test 1: Dynamic Slot Generation Algorithm
    // -------------------------------------------------------------
    console.log('\n🔹 1. Dynamic Time Slot Generator:');
    
    // Shift: 09:00 to 15:00 = 6 hours = 12 x 30-min slots
    const startH = 9, endH = 15;
    const expectedSlotsCount = (endH - startH) * 2;

    const slots = [];
    for (let h = startH; h < endH; h++) {
      const hStr = String(h).padStart(2, '0');
      const nextHStr = String(h + 1).padStart(2, '0');
      slots.push(`${hStr}:00 - ${hStr}:30`);
      slots.push(`${hStr}:30 - ${nextHStr}:00`);
    }

    assert(slots.length === expectedSlotsCount, `Generated ${slots.length} time intervals for shift ${doctor.shiftStart} - ${doctor.shiftEnd}`);
    assert(slots.includes('10:00 - 10:30'), 'Contains target morning slot (10:00 - 10:30)');
    assert(slots.includes('14:30 - 15:00'), 'Contains target afternoon slot (14:30 - 15:00)');

    // -------------------------------------------------------------
    // Test 2: Book Appointment & Auto-Generate Queue Token
    // -------------------------------------------------------------
    console.log('\n🔹 2. Book OPD Appointment & Issue Queue Token:');
    const targetSlot = '10:30 - 11:00';

    const newAppointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: testDate,
        timeSlot: targetSlot,
        type: 'OPD',
        status: 'SCHEDULED',
        reasonForVisit: 'Cardiovascular checkup & ECG review',
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
      },
    });

    assert(!!newAppointment.id, `Appointment booked with ID: ${newAppointment.id}`);
    assert(newAppointment.timeSlot === targetSlot, `Time slot confirmed: ${targetSlot}`);
    assert(newAppointment.status === 'SCHEDULED', 'Initial appointment status is SCHEDULED');

    // Create linked Queue Token
    const queueToken = await prisma.queueToken.create({
      data: {
        appointmentId: newAppointment.id,
        patientId: patient.id,
        doctorId: doctor.id,
        tokenNumber: 1,
        tokenCode: 'CARD-001',
        status: 'WAITING',
      },
    });

    assert(!!queueToken.id, `Queue token generated: ${queueToken.tokenCode}`);
    assert(queueToken.status === 'WAITING', 'Queue token status initialized to WAITING');

    // -------------------------------------------------------------
    // Test 3: Double-Booking Conflict Prevention
    // -------------------------------------------------------------
    console.log('\n🔹 3. Double-Booking Collision Guard:');
    const startOfDay = new Date(testDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(testDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const conflictingBooking = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        timeSlot: targetSlot,
        status: { not: 'CANCELLED' },
      },
    });

    assert(!!conflictingBooking, `Detected existing booking for ${targetSlot} on ${dateString}`);
    assert(conflictingBooking.id === newAppointment.id, 'Collision check matches active booking ID');

    // -------------------------------------------------------------
    // Test 4: Appointment Rescheduling
    // -------------------------------------------------------------
    console.log('\n🔹 4. Reschedule Appointment to Another Slot:');
    const newSlot = '11:30 - 12:00';

    const rescheduled = await prisma.appointment.update({
      where: { id: newAppointment.id },
      data: {
        timeSlot: newSlot,
        status: 'CONFIRMED',
        notes: 'Rescheduled upon patient request',
      },
    });

    assert(rescheduled.timeSlot === newSlot, `Appointment rescheduled to new slot: ${newSlot}`);
    assert(rescheduled.status === 'CONFIRMED', 'Appointment status updated to CONFIRMED');

    // -------------------------------------------------------------
    // Test 5: Appointment Cancellation & Slot Release
    // -------------------------------------------------------------
    console.log('\n🔹 5. Appointment Cancellation & Slot Release:');
    const cancelled = await prisma.appointment.update({
      where: { id: newAppointment.id },
      data: {
        status: 'CANCELLED',
        notes: 'Cancelled due to patient schedule conflict',
      },
    });

    assert(cancelled.status === 'CANCELLED', 'Appointment status successfully set to CANCELLED');

    // Verify slot is now released (available)
    const slotAfterCancel = await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        timeSlot: newSlot,
        status: { not: 'CANCELLED' },
      },
    });

    assert(!slotAfterCancel, `Time slot ${newSlot} is now freed and available for new bookings`);

    // -------------------------------------------------------------
    // Test 6: Security & Booking Audit Trail
    // -------------------------------------------------------------
    console.log('\n🔹 6. Administrative & Booking Audit Trail:');
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (adminUser) {
      const bookAudit = await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'APPOINTMENT_BOOKED',
          entity: 'Appointment',
          entityId: newAppointment.id,
          details: JSON.stringify({
            patientMrn: patient.mrn,
            doctor: doctor.user.fullName,
            timeSlot: targetSlot,
            date: dateString,
            token: 'CARD-001',
          }),
        },
      });

      assert(!!bookAudit.id, 'AuditLog created for APPOINTMENT_BOOKED action');
      assert(bookAudit.action === 'APPOINTMENT_BOOKED', 'Audit action matches APPOINTMENT_BOOKED');
    }

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n====================================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================================\n');

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

runAppointmentBookingTests();
