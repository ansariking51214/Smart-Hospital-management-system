/**
 * Utility functions for generating unique sequential identifiers in the Hospital Management System
 */

/**
 * Generates an auto-incremented Medical Record Number (MRN)
 * Format: MRN-YYYY-XXXX (e.g., MRN-2026-0001)
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<string>}
 */
export async function generateMRN(prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `MRN-${currentYear}-`;

  // Find the highest MRN for the current year
  const latestPatient = await prisma.patientProfile.findFirst({
    where: {
      mrn: {
        startsWith: prefix,
      },
    },
    orderBy: {
      mrn: 'desc',
    },
    select: {
      mrn: true,
    },
  });

  let nextSequence = 1;
  if (latestPatient && latestPatient.mrn) {
    const parts = latestPatient.mrn.split('-');
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}

/**
 * Generates an auto-incremented Prescription Number
 * Format: RX-YYYY-XXXX (e.g., RX-2026-0001)
 */
export async function generatePrescriptionNumber(prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `RX-${currentYear}-`;

  const latestRx = await prisma.prescription.findFirst({
    where: {
      prescriptionNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      prescriptionNumber: 'desc',
    },
    select: {
      prescriptionNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestRx && latestRx.prescriptionNumber) {
    const parts = latestRx.prescriptionNumber.split('-');
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}

/**
 * Generates an auto-incremented Invoice Number
 * Format: INV-YYYY-XXXX (e.g., INV-2026-0001)
 */
export async function generateInvoiceNumber(prisma) {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextSequence = 1;
  if (latestInvoice && latestInvoice.invoiceNumber) {
    const parts = latestInvoice.invoiceNumber.split('-');
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSequence = currentSeq + 1;
      }
    }
  }

  const paddedSeq = String(nextSequence).padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}
