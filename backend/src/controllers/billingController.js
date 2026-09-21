import prisma from '../config/db.js';
import { generateInvoiceNumber } from '../utils/mrnGenerator.js';

/**
 * GET /api/billing/unbilled-charges/:patientId
 * Aggregates all unbilled charges for a patient across:
 * 1. Outpatient Consultations
 * 2. Laboratory / Diagnostic Orders
 * 3. Prescribed Medications
 * 4. Inpatient (IPD) Bed Allocations & Room Stay
 */
export async function getUnbilledCharges(req, res) {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const unbilledItems = [];

    // 1. Consultation Fees
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: { include: { user: true } } },
    });

    for (const appt of appointments) {
      const fee = appt.doctor?.consultationFee || 100.0;
      unbilledItems.push({
        description: `Physician Consultation - ${appt.doctor?.user?.fullName || 'Attending Physician'} (${appt.type || 'OPD'})`,
        category: 'CONSULTATION',
        quantity: 1,
        unitPrice: fee,
        totalPrice: fee,
        referenceId: appt.id,
        date: appt.appointmentDate,
      });
    }

    // 2. Diagnostic & Lab Test Orders
    const labOrders = await prisma.labOrder.findMany({
      where: { patientId },
    });

    for (const lab of labOrders) {
      let testFee = 60.0;
      if (lab.category === 'Radiology' || lab.category === 'Imaging') {
        testFee = 150.0;
      } else if (lab.category === 'Biochemistry' || lab.category === 'Pathology') {
        testFee = 85.0;
      }

      unbilledItems.push({
        description: `Diagnostic Test (${lab.category}) - ${lab.testName}`,
        category: 'LAB',
        quantity: 1,
        unitPrice: testFee,
        totalPrice: testFee,
        referenceId: lab.id,
        date: lab.requestedAt,
      });
    }

    // 3. Prescribed Medicines
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: { items: true },
    });

    const medicineCatalog = await prisma.medicine.findMany();
    const medMap = new Map();
    medicineCatalog.forEach((m) => medMap.set(m.name.toLowerCase(), m.unitPrice));

    for (const rx of prescriptions) {
      for (const item of rx.items) {
        let price = medMap.get(item.medicineName.toLowerCase()) || 15.0;
        // Estimate quantity based on duration if present e.g. "5 days", default 10
        const qtyMatch = item.duration ? parseInt(item.duration, 10) : 10;
        const qty = !isNaN(qtyMatch) && qtyMatch > 0 ? qtyMatch : 10;
        const total = price * qty;

        unbilledItems.push({
          description: `Pharmacy Dispensing - ${item.medicineName} (${item.dosage}, ${item.frequency})`,
          category: 'PHARMACY',
          quantity: qty,
          unitPrice: price,
          totalPrice: parseFloat(total.toFixed(2)),
          referenceId: item.id,
          date: rx.issuedDate,
        });
      }
    }

    // 4. IPD Bed Allocation Stay Charges
    const bedAllocations = await prisma.bedAllocation.findMany({
      where: { patientId },
      include: { bed: { include: { ward: true } } },
    });

    for (const alloc of bedAllocations) {
      const admittedAt = new Date(alloc.admittedAt);
      const endAt = alloc.dischargedAt ? new Date(alloc.dischargedAt) : new Date();

      const diffMs = Math.max(0, endAt.getTime() - admittedAt.getTime());
      const daysStayed = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const dailyRate = alloc.bed?.dailyCharge || 200.0;
      const totalCharge = daysStayed * dailyRate;

      unbilledItems.push({
        description: `IPD Bed Stay - ${alloc.bed?.ward?.name || 'Ward'} (Bed ${alloc.bed?.bedNumber || 'N/A'}) - ${daysStayed} Day(s)`,
        category: 'ROOM_CHARGE',
        quantity: daysStayed,
        unitPrice: dailyRate,
        totalPrice: parseFloat(totalCharge.toFixed(2)),
        referenceId: alloc.id,
        date: alloc.admittedAt,
      });
    }

    const subTotal = unbilledItems.reduce((sum, item) => sum + item.totalPrice, 0);

    return res.status(200).json({
      success: true,
      patient: {
        id: patient.id,
        mrn: patient.mrn,
        fullName: `${patient.firstName} ${patient.lastName}`,
        phone: patient.phone,
        insuranceProvider: patient.insuranceProvider,
        insurancePolicyNo: patient.insurancePolicyNo,
      },
      itemCount: unbilledItems.length,
      unbilledItems,
      estimatedSubTotal: parseFloat(subTotal.toFixed(2)),
    });
  } catch (error) {
    console.error('Error fetching unbilled charges:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch unbilled charges', error: error.message });
  }
}

/**
 * POST /api/billing/invoices
 * Generate a formal itemized Invoice for a patient
 */
export async function createInvoice(req, res) {
  try {
    const {
      patientId,
      items = [],
      taxRate = 5.0,
      discount = 0.0,
      paymentStatus = 'PENDING',
      paymentMethod = null,
      notes = '',
    } = req.body;

    if (!patientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient ID and at least one billable item are required.' });
    }

    const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const invoiceNumber = await generateInvoiceNumber();

    // Calculate financials
    let subTotal = 0;
    const invoiceItemsData = items.map((item) => {
      const qty = parseInt(item.quantity || 1, 10);
      const unitPrice = parseFloat(item.unitPrice || 0);
      const totalPrice = parseFloat((qty * unitPrice).toFixed(2));
      subTotal += totalPrice;

      return {
        description: item.description || 'Medical Service / Item',
        category: item.category || 'MISC',
        quantity: qty,
        unitPrice,
        totalPrice,
      };
    });

    subTotal = parseFloat(subTotal.toFixed(2));
    const taxVal = parseFloat(taxRate) || 0;
    const discountVal = parseFloat(discount) || 0;

    const taxAmount = parseFloat(((subTotal * taxVal) / 100).toFixed(2));
    const totalAmount = parseFloat((subTotal + taxAmount - discountVal).toFixed(2));

    let paidAmount = 0.0;
    let balanceDue = totalAmount;

    if (paymentStatus === 'PAID') {
      paidAmount = totalAmount;
      balanceDue = 0.0;
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId,
        subTotal,
        taxRate: taxVal,
        taxAmount,
        discount: discountVal,
        totalAmount,
        paidAmount,
        balanceDue,
        paymentStatus: paymentStatus.toUpperCase(),
        paymentMethod: paymentMethod ? paymentMethod.trim() : null,
        paidAt: paymentStatus === 'PAID' ? new Date() : null,
        items: {
          create: invoiceItemsData,
        },
      },
      include: {
        patient: true,
        items: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} created successfully.`,
      invoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return res.status(500).json({ success: false, message: 'Failed to create invoice', error: error.message });
  }
}

/**
 * GET /api/billing/invoices
 * Retrieve all invoices with status filter & patient details
 */
export async function getInvoices(req, res) {
  try {
    const { patientId, paymentStatus, search } = req.query;

    const where = {};
    if (patientId) where.patientId = patientId;
    if (paymentStatus) where.paymentStatus = paymentStatus.toUpperCase();

    if (search && search.trim()) {
      where.OR = [
        { invoiceNumber: { contains: search.trim() } },
        { patient: { firstName: { contains: search.trim() } } },
        { patient: { lastName: { contains: search.trim() } } },
        { patient: { mrn: { contains: search.trim() } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        patient: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices', error: error.message });
  }
}

/**
 * GET /api/billing/invoices/:id
 * Fetch single invoice by ID with items
 */
export async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoice details', error: error.message });
  }
}

/**
 * POST /api/billing/invoices/:id/payment
 * Record full or partial payment against an invoice
 */
export async function recordPayment(req, res) {
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'Cash' } = req.body;

    const invoice = await prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const payVal = parseFloat(amount);
    if (isNaN(payVal) || payVal <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    const newPaidAmount = parseFloat((invoice.paidAmount + payVal).toFixed(2));
    const newBalanceDue = Math.max(0, parseFloat((invoice.totalAmount - newPaidAmount).toFixed(2)));

    let newStatus = 'PARTIAL';
    if (newBalanceDue === 0 || newPaidAmount >= invoice.totalAmount) {
      newStatus = 'PAID';
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        balanceDue: newBalanceDue,
        paymentStatus: newStatus,
        paymentMethod: paymentMethod.trim(),
        paidAt: newStatus === 'PAID' ? new Date() : invoice.paidAt,
      },
      include: {
        patient: true,
        items: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Payment of $${payVal.toFixed(2)} recorded. Updated status: ${newStatus}`,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    return res.status(500).json({ success: false, message: 'Failed to record payment', error: error.message });
  }
}

/**
 * GET /api/billing/invoices/:id/pdf-data
 * Returns printable invoice data object
 */
export async function getInvoicePdfData(req, res) {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const printableData = {
      hospital: {
        name: 'Smart Hospital Management System',
        subtext: 'Enterprise Cloud Healthcare Platform',
        taxId: 'TAX-8849-HMS',
        phone: '+1 (555) 019-9000',
        email: 'billing@smarthospital.org',
        address: '700 Healthcare Parkway, Suite 400, Metro City',
      },
      invoiceNumber: invoice.invoiceNumber,
      issuedDate: invoice.issuedDate,
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod || 'N/A',
      patient: {
        mrn: invoice.patient.mrn,
        fullName: `${invoice.patient.firstName} ${invoice.patient.lastName}`,
        gender: invoice.patient.gender,
        dob: invoice.patient.dateOfBirth,
        phone: invoice.patient.phone,
        address: `${invoice.patient.address || ''}, ${invoice.patient.city || ''}`,
        insurance: invoice.patient.insuranceProvider ? `${invoice.patient.insuranceProvider} (${invoice.patient.insurancePolicyNo})` : 'Self-Pay / None',
      },
      items: invoice.items.map((item) => ({
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        unitPrice: `$${item.unitPrice.toFixed(2)}`,
        totalPrice: `$${item.totalPrice.toFixed(2)}`,
      })),
      summary: {
        subTotal: `$${invoice.subTotal.toFixed(2)}`,
        taxRate: `${invoice.taxRate}%`,
        taxAmount: `$${invoice.taxAmount.toFixed(2)}`,
        discount: `$${invoice.discount.toFixed(2)}`,
        totalAmount: `$${invoice.totalAmount.toFixed(2)}`,
        paidAmount: `$${invoice.paidAmount.toFixed(2)}`,
        balanceDue: `$${invoice.balanceDue.toFixed(2)}`,
      },
    };

    return res.status(200).json({
      success: true,
      printableData,
    });
  } catch (error) {
    console.error('Error fetching printable PDF data:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch printable invoice data', error: error.message });
  }
}
