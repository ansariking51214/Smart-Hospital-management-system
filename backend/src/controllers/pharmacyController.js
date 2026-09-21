import prisma from '../config/db.js';

/**
 * GET /api/pharmacy/medicines
 * Retrieve medicine catalog with search and low-stock filter
 */
export async function getMedicines(req, res) {
  try {
    const { search = '', lowStockOnly = 'false', category = '' } = req.query;

    const where = {};

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { genericName: { contains: search.trim() } },
        { manufacturer: { contains: search.trim() } },
      ];
    }

    if (category.trim()) {
      where.category = { contains: category.trim() };
    }

    let medicines = await prisma.medicine.findMany({
      where,
      include: {
        batches: true,
      },
      orderBy: { name: 'asc' },
    });

    if (lowStockOnly === 'true') {
      medicines = medicines.filter((m) => m.stockQuantity <= m.reorderLevel);
    }

    const formatted = medicines.map((m) => ({
      ...m,
      isLowStock: m.stockQuantity <= m.reorderLevel,
      totalBatchQuantity: m.batches.reduce((sum, b) => sum + b.quantity, 0),
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      medicines: formatted,
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch medicines', error: error.message });
  }
}

/**
 * POST /api/pharmacy/medicines
 * Create a new medicine entry
 */
export async function addMedicine(req, res) {
  try {
    const {
      name,
      genericName = '',
      category = 'General',
      manufacturer = '',
      unitPrice,
      stockQuantity = 0,
      reorderLevel = 10,
      dosageForm = 'Tablet',
    } = req.body;

    if (!name || unitPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Medicine name and unit price are required.' });
    }

    const newMedicine = await prisma.medicine.create({
      data: {
        name: name.trim(),
        genericName: genericName.trim(),
        category: category.trim(),
        manufacturer: manufacturer.trim(),
        unitPrice: parseFloat(unitPrice),
        stockQuantity: parseInt(stockQuantity, 10),
        reorderLevel: parseInt(reorderLevel, 10),
        dosageForm: dosageForm.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Medicine added successfully to pharmacy inventory.',
      medicine: newMedicine,
    });
  } catch (error) {
    console.error('Error adding medicine:', error);
    return res.status(500).json({ success: false, message: 'Failed to add medicine', error: error.message });
  }
}

/**
 * PUT /api/pharmacy/medicines/:id
 * Update medicine details or stock level
 */
export async function updateMedicine(req, res) {
  try {
    const { id } = req.params;
    const { name, genericName, category, manufacturer, unitPrice, stockQuantity, reorderLevel, dosageForm } = req.body;

    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (genericName !== undefined) data.genericName = genericName.trim();
    if (category !== undefined) data.category = category.trim();
    if (manufacturer !== undefined) data.manufacturer = manufacturer.trim();
    if (unitPrice !== undefined) data.unitPrice = parseFloat(unitPrice);
    if (stockQuantity !== undefined) data.stockQuantity = parseInt(stockQuantity, 10);
    if (reorderLevel !== undefined) data.reorderLevel = parseInt(reorderLevel, 10);
    if (dosageForm !== undefined) data.dosageForm = dosageForm.trim();

    const updated = await prisma.medicine.update({
      where: { id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: 'Medicine updated successfully.',
      medicine: updated,
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    return res.status(500).json({ success: false, message: 'Failed to update medicine', error: error.message });
  }
}

/**
 * DELETE /api/pharmacy/medicines/:id
 */
export async function deleteMedicine(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.medicine.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }

    await prisma.medicine.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete medicine', error: error.message });
  }
}

/**
 * GET /api/pharmacy/batches
 * List inventory batches
 */
export async function getBatches(req, res) {
  try {
    const batches = await prisma.inventoryBatch.findMany({
      include: {
        medicine: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    return res.status(200).json({
      success: true,
      count: batches.length,
      batches,
    });
  } catch (error) {
    console.error('Error fetching inventory batches:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory batches', error: error.message });
  }
}

/**
 * POST /api/pharmacy/batches
 * Add a new inventory batch & auto-update medicine total stock
 */
export async function addBatch(req, res) {
  try {
    const { medicineId, batchNumber, quantity, expiryDate, costPrice } = req.body;

    if (!medicineId || !batchNumber || !quantity || !expiryDate || costPrice === undefined) {
      return res.status(400).json({ success: false, message: 'All batch details are required.' });
    }

    const medicine = await prisma.medicine.findUnique({ where: { id: medicineId } });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Referenced medicine not found.' });
    }

    const qtyNum = parseInt(quantity, 10);

    const batch = await prisma.inventoryBatch.create({
      data: {
        medicineId,
        batchNumber: batchNumber.trim(),
        quantity: qtyNum,
        expiryDate: new Date(expiryDate),
        costPrice: parseFloat(costPrice),
      },
    });

    // Update main medicine stock
    const updatedMedicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: {
        stockQuantity: medicine.stockQuantity + qtyNum,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Batch added successfully and medicine stock updated.',
      batch,
      updatedMedicineStock: updatedMedicine.stockQuantity,
    });
  } catch (error) {
    console.error('Error adding batch:', error);
    return res.status(500).json({ success: false, message: 'Failed to add batch', error: error.message });
  }
}

/**
 * GET /api/pharmacy/stats
 * Pharmacy dashboard overview stats
 */
export async function getPharmacyStats(req, res) {
  try {
    const allMedicines = await prisma.medicine.findMany();
    const totalMedicines = allMedicines.length;

    const lowStockMedicines = allMedicines.filter((m) => m.stockQuantity <= m.reorderLevel);
    const totalInventoryValue = allMedicines.reduce((sum, m) => sum + m.stockQuantity * m.unitPrice, 0);

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringBatches = await prisma.inventoryBatch.count({
      where: {
        expiryDate: {
          lte: thirtyDaysFromNow,
        },
      },
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalMedicines,
        lowStockCount: lowStockMedicines.length,
        totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
        expiringBatchesCount: expiringBatches,
      },
    });
  } catch (error) {
    console.error('Error fetching pharmacy stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch pharmacy stats', error: error.message });
  }
}
