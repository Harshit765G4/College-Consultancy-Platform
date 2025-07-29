const db = require('../models');
const College = db.College;
const FeeStructure = db.FeeStructure;

// @route   GET /api/colleges
// @desc    Get all colleges
// @access  Public
exports.getAllColleges = async (req, res) => {
    try {
        const colleges = await College.findAll({
            attributes: ['id', 'name', 'location', 'description', 'imageUrl', 'contactEmail', 'websiteUrl']
        });
        res.json(colleges);
    } catch (err) {
        console.error('Error getting all colleges:', err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET /api/colleges/:id
// @desc    Get single college by ID
// @access  Public
exports.getCollegeById = async (req, res) => {
    try {
        const college = await College.findByPk(req.params.id, {
            attributes: ['id', 'name', 'location', 'description', 'imageUrl', 'contactEmail', 'websiteUrl'],
            include: [{
                model: FeeStructure,
                as: 'feeStructures',
                attributes: ['id', 'programName', 'tuitionFee', 'accommodationFee', 'miscFees', 'totalFee', 'isVisibleToStudents']
            }]
        });
        if (!college) {
            return res.status(404).json({ msg: 'College not found' });
        }
        res.json(college);
    } catch (err) {
        console.error('Error getting college by ID:', err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/colleges
// @desc    Add a new college
// @access  Private (Admin/College Admin)
exports.addCollege = async (req, res) => {
    const { name, location, description, imageUrl, contactEmail, websiteUrl, adminUserId } = req.body;

    try {
        const newCollege = await College.create({
            name,
            location,
            description,
            imageUrl,
            contactEmail,
            websiteUrl,
            adminUserId: req.user.role === 'admin' ? adminUserId : req.user.id // If admin, they can assign; otherwise, college admin assigns to self
        });
        res.status(201).json(newCollege);
    } catch (err) {
        console.error('Error adding college:', err.message);
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/colleges/:id
// @desc    Update a college
// @access  Private (Admin/College Admin)
exports.updateCollege = async (req, res) => {
    const { name, location, description, imageUrl, contactEmail, websiteUrl } = req.body;
    const collegeId = req.params.id;

    try {
        let college = await College.findByPk(collegeId);
        if (!college) {
            return res.status(404).json({ msg: 'College not found' });
        }

        // Authorization check: Only admin or the assigned college admin can update
        if (req.user.role !== 'admin' && college.adminUserId !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied: Not authorized to update this college' });
        }

        college.name = name || college.name;
        college.location = location || college.location;
        college.description = description || college.description;
        college.imageUrl = imageUrl || college.imageUrl;
        college.contactEmail = contactEmail || college.contactEmail;
        college.websiteUrl = websiteUrl || college.websiteUrl;

        await college.save();
        res.json(college);
    } catch (err) {
        console.error('Error updating college:', err.message);
        res.status(500).send('Server error');
    }
};

// @route   DELETE /api/colleges/:id
// @desc    Delete a college
// @access  Private (Admin only)
exports.deleteCollege = async (req, res) => {
    try {
        const college = await College.findByPk(req.params.id);
        if (!college) {
            return res.status(404).json({ msg: 'College not found' });
        }

        // Only admin can delete
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Only administrators can delete colleges' });
        }

        await college.destroy();
        res.json({ msg: 'College removed' });
    } catch (err) {
        console.error('Error deleting college:', err.message);
        res.status(500).send('Server error');
    }
};

// @route   POST /api/colleges/:collegeId/fees
// @desc    Add fee structure for a college
// @access  Private (Admin/College Admin)
exports.addFeeStructure = async (req, res) => {
    const { programName, tuitionFee, accommodationFee, miscFees, totalFee, isVisibleToStudents } = req.body;
    const collegeId = req.params.collegeId;

    try {
        const college = await College.findByPk(collegeId);
        if (!college) {
            return res.status(404).json({ msg: 'College not found' });
        }

        // Authorization check: Only admin or the assigned college admin can add fees
        if (req.user.role !== 'admin' && college.adminUserId !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied: Not authorized to add fees for this college' });
        }

        const newFeeStructure = await FeeStructure.create({
            collegeId,
            programName,
            tuitionFee,
            accommodationFee,
            miscFees,
            totalFee,
            isVisibleToStudents: isVisibleToStudents || false
        });
        res.status(201).json(newFeeStructure);
    } catch (err) {
        console.error('Error adding fee structure:', err.message);
        res.status(500).send('Server error');
    }
};

// @route   PUT /api/colleges/:collegeId/fees/:feeId
// @desc    Update fee structure for a college
// @access  Private (Admin/College Admin)
exports.updateFeeStructure = async (req, res) => {
    const { programName, tuitionFee, accommodationFee, miscFees, totalFee, isVisibleToStudents } = req.body;
    const { collegeId, feeId } = req.params;

    try {
        let feeStructure = await FeeStructure.findByPk(feeId, {
            include: [{ model: College, as: 'college' }]
        });

        if (!feeStructure || feeStructure.college.id !== collegeId) {
            return res.status(404).json({ msg: 'Fee structure not found for this college' });
        }

        // Authorization check
        if (req.user.role !== 'admin' && feeStructure.college.adminUserId !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied: Not authorized to update this fee structure' });
        }

        feeStructure.programName = programName || feeStructure.programName;
        feeStructure.tuitionFee = tuitionFee || feeStructure.tuitionFee;
        feeStructure.accommodationFee = accommodationFee || feeStructure.accommodationFee;
        feeStructure.miscFees = miscFees || feeStructure.miscFees;
        feeStructure.totalFee = totalFee || feeStructure.totalFee;
        feeStructure.isVisibleToStudents = typeof isVisibleToStudents === 'boolean' ? isVisibleToStudents : feeStructure.isVisibleToStudents;

        await feeStructure.save();
        res.json(feeStructure);
    } catch (err) {
        console.error('Error updating fee structure:', err.message);
        res.status(500).send('Server error');
    }
};