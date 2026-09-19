import prisma from '../config/db.js';

/**
 * GET /api/ipd/wards
 * Retrieve list of wards with bed status counts
 */
export async function getWards(req, res) {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        department: true,
        beds: {
          include: {
            allocations: {
              where: { dischargedAt: null },
              include: { patient: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedWards = wards.map((ward) => {
      const availableBeds = ward.beds.filter((b) => b.status === 'AVAILABLE').length;
      const occupiedBeds = ward.beds.filter((b) => b.status === 'OCCUPIED').length;
      const maintenanceBeds = ward.beds.filter((b) => b.status === 'MAINTENANCE').length;
      const reservedBeds = ward.beds.filter((b) => b.status === 'RESERVED').length;

      return {
        ...ward,
        totalBedsCount: ward.beds.length,
        availableBeds,
        occupiedBeds,
        maintenanceBeds,
        reservedBeds,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedWards.length,
      wards: formattedWards,
    });
  } catch (error) {
    console.error('Error fetching wards:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch wards', error: error.message });
  }
}

/**
 * POST /api/ipd/wards
 * Create a new hospital ward
 */
export async function createWard(req, res) {
  try {
    const { name, code, departmentId, type = 'General', floor = '1st Floor', totalBeds = 0 } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Ward name and code are required.' });
    }

    const existingCode = await prisma.ward.findUnique({ where: { code: code.trim().toUpperCase() } });
    if (existingCode) {
      return res.status(409).json({ success: false, message: `Ward code '${code}' already exists.` });
    }

    const ward = await prisma.ward.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        departmentId: departmentId || null,
        type: type.trim(),
        floor: floor.trim(),
        totalBeds: parseInt(totalBeds, 10),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Ward created successfully.',
      ward,
    });
  } catch (error) {
    console.error('Error creating ward:', error);
    return res.status(500).json({ success: false, message: 'Failed to create ward', error: error.message });
  }
}

/**
 * GET /api/ipd/beds
 * Retrieve beds with filter by wardId or status
 */
export async function getBeds(req, res) {
  try {
    const { wardId, status } = req.query;

    const where = {};
    if (wardId) where.wardId = wardId;
    if (status) where.status = status.toUpperCase();

    const beds = await prisma.bed.findMany({
      where,
      include: {
        ward: true,
        allocations: {
          where: { dischargedAt: null },
          include: {
            patient: true,
          },
        },
      },
      orderBy: { bedNumber: 'asc' },
    });

    return res.status(200).json({
      success: true,
      count: beds.length,
      beds,
    });
  } catch (error) {
    console.error('Error fetching beds:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch beds', error: error.message });
  }
}

/**
 * POST /api/ipd/beds
 * Add a bed to a ward
 */
export async function createBed(req, res) {
  try {
    const { wardId, bedNumber, dailyCharge = 100.0, status = 'AVAILABLE' } = req.body;

    if (!wardId || !bedNumber) {
      return res.status(400).json({ success: false, message: 'Ward ID and bed number are required.' });
    }

    const ward = await prisma.ward.findUnique({ where: { id: wardId } });
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Referenced ward not found.' });
    }

    const cleanBedNumber = bedNumber.trim().toUpperCase();

    const existingBed = await prisma.bed.findUnique({
      where: {
        wardId_bedNumber: {
          wardId,
          bedNumber: cleanBedNumber,
        },
      },
    });

    if (existingBed) {
      return res.status(409).json({ success: false, message: `Bed ${cleanBedNumber} already exists in this ward.` });
    }

    const bed = await prisma.bed.create({
      data: {
        wardId,
        bedNumber: cleanBedNumber,
        dailyCharge: parseFloat(dailyCharge),
        status: status.toUpperCase(),
      },
    });

    // Update ward totalBeds count
    await prisma.ward.update({
      where: { id: wardId },
      data: { totalBeds: ward.totalBeds + 1 },
    });

    return res.status(201).json({
      success: true,
      message: 'Bed created successfully.',
      bed,
    });
  } catch (error) {
    console.error('Error creating bed:', error);
    return res.status(500).json({ success: false, message: 'Failed to create bed', error: error.message });
  }
}

/**
 * POST /api/ipd/allocations
 * Admit patient into a bed (allocate bed)
 */
export async function allocateBed(req, res) {
  try {
    const { bedId, patientId, notes = '' } = req.body;

    if (!bedId || !patientId) {
      return res.status(400).json({ success: false, message: 'Bed ID and Patient ID are required.' });
    }

    const bed = await prisma.bed.findUnique({ where: { id: bedId } });
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found.' });
    }

    if (bed.status === 'OCCUPIED') {
      return res.status(400).json({ success: false, message: 'Bed is currently occupied.' });
    }

    const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    // Check if patient already has active bed allocation
    const activeAllocation = await prisma.bedAllocation.findFirst({
      where: {
        patientId,
        dischargedAt: null,
      },
    });

    if (activeAllocation) {
      return res.status(400).json({
        success: false,
        message: 'Patient is already admitted into an IPD bed.',
      });
    }

    // Create allocation & update bed status to OCCUPIED
    const allocation = await prisma.bedAllocation.create({
      data: {
        bedId,
        patientId,
        notes: notes.trim(),
        admittedAt: new Date(),
      },
      include: {
        bed: { include: { ward: true } },
        patient: true,
      },
    });

    await prisma.bed.update({
      where: { id: bedId },
      data: { status: 'OCCUPIED' },
    });

    return res.status(201).json({
      success: true,
      message: `Patient ${patient.firstName} ${patient.lastName} admitted into bed ${bed.bedNumber}.`,
      allocation,
    });
  } catch (error) {
    console.error('Error allocating bed:', error);
    return res.status(500).json({ success: false, message: 'Failed to allocate bed', error: error.message });
  }
}

/**
 * POST /api/ipd/allocations/:id/discharge
 * Discharge patient from bed & calculate stay duration & charge
 */
export async function dischargeBed(req, res) {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const allocation = await prisma.bedAllocation.findUnique({
      where: { id },
      include: { bed: true, patient: true },
    });

    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation record not found.' });
    }

    if (allocation.dischargedAt) {
      return res.status(400).json({ success: false, message: 'Patient has already been discharged.' });
    }

    const dischargedAt = new Date();
    const admittedAt = new Date(allocation.admittedAt);

    // Calculate stay days (minimum 1 day for billing)
    const diffMs = Math.max(0, dischargedAt.getTime() - admittedAt.getTime());
    const daysStayed = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const totalBedCharge = daysStayed * allocation.bed.dailyCharge;

    const updatedAllocation = await prisma.bedAllocation.update({
      where: { id },
      data: {
        dischargedAt,
        notes: notes ? `${allocation.notes ? allocation.notes + ' | ' : ''}${notes}` : allocation.notes,
      },
      include: {
        bed: { include: { ward: true } },
        patient: true,
      },
    });

    // Mark bed status back to AVAILABLE
    await prisma.bed.update({
      where: { id: allocation.bedId },
      data: { status: 'AVAILABLE' },
    });

    return res.status(200).json({
      success: true,
      message: `Patient ${allocation.patient.firstName} ${allocation.patient.lastName} discharged successfully.`,
      dischargeDetails: {
        allocationId: id,
        daysStayed,
        dailyCharge: allocation.bed.dailyCharge,
        totalBedCharge,
        admittedAt,
        dischargedAt,
      },
      allocation: updatedAllocation,
    });
  } catch (error) {
    console.error('Error discharging bed allocation:', error);
    return res.status(500).json({ success: false, message: 'Failed to discharge bed', error: error.message });
  }
}

/**
 * GET /api/ipd/allocations/active
 * Retrieve list of all currently active IPD admissions
 */
export async function getActiveAllocations(req, res) {
  try {
    const allocations = await prisma.bedAllocation.findMany({
      where: { dischargedAt: null },
      include: {
        bed: {
          include: { ward: true },
        },
        patient: true,
      },
      orderBy: { admittedAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: allocations.length,
      allocations,
    });
  } catch (error) {
    console.error('Error fetching active allocations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch active allocations', error: error.message });
  }
}
