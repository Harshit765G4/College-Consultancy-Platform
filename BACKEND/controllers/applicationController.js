// controllers/applicationController.js
const db = require('../models');
const Application = db.Application;
const User = db.User;
const College = db.College;
const FeeStructure = db.FeeStructure; // Direct import of the model
const Document = db.Document;
const path = require('path');
const fs = require('fs');


// --- NEW: Resubmission request endpoint ---
// @route   POST /api/applications/:id/request-resubmit
// @desc    Request to resubmit an application
// @access  Private (Student)
exports.requestResubmission = async (req, res) => {
    try {
        const application = await Application.findByPk(req.params.id);

        if (!application) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        if (application.studentId !== req.user.id) {
            return res.status(403).json({ msg: 'Authorization denied: You do not own this application' });
        }

        if (application.status !== 'pending' && application.status !== 'rejected') {
            return res.status(400).json({ msg: 'Cannot request resubmission for this application.' });
        }

        application.resubmissionRequested = true;
        await application.save();

        res.json({ msg: 'Resubmission request has been sent successfully.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// @route   POST /api/applications
// @desc    Submit a new application
// @access  Private (Student)
exports.submitApplication = async (req, res) => {
    const { collegeId, programOfInterest } = req.body;
    const studentId = req.user.id;

    try {
        // Check for duplicate
        const existingApplication = await Application.findOne({
            where: { studentId, collegeId, programOfInterest }
        });
        if (existingApplication) {
            return res.status(400).json({ msg: 'You have already applied to this program at this college.' });
        }

        const newApplication = await Application.create({
            studentId,
            collegeId,
            programOfInterest,
            status: 'pending'
        });
        res.status(201).json(newApplication);
    } catch (err) {
        console.error('Error submitting application:', err.message);
        res.status(500).send('Server error');
    }
};


// @route   GET /api/applications/me
// @desc    Get all applications for the logged-in student
// @access  Private (Student)
exports.getStudentApplications = async (req, res) => {
    try {
        const applications = await Application.findAll({
            where: { studentId: req.user.id },
            include: [
                { model: College, as: 'college', attributes: ['name', 'location'] },
                { model: FeeStructure, as: 'approvedFeeStructure', attributes: ['programName', 'totalFee', 'tuitionFee', 'accommodationFee', 'miscFees'], required: false },
                { model: Document, as: 'documents', attributes: ['id', 'documentType', 'originalFileName', 'filePath'] }
            ],
            order: [['submissionDate', 'DESC']]
        });
        res.json(applications);
    } catch (err) {
        console.error('Error getting student applications:', err.message);
        res.status(500).send('Server error');
    }
};


// @route   GET /api/applications
// @desc    Get all applications (for admin)
// @access  Private (Admin)
exports.getAllApplications = async (req, res) => {
    try {
        const applications = await Application.findAll({
            include: [
                { model: User, as: 'student', attributes: ['fullName', 'email'] },
                { model: College, as: 'college', attributes: ['name', 'location'] },
                { model: FeeStructure, as: 'approvedFeeStructure', attributes: ['programName', 'totalFee'], required: false },
                { model: User, as: 'adminReviewer', attributes: ['fullName'], required: false }
            ],
            order: [['submissionDate', 'DESC']]
        });
        res.json(applications);
    } catch (err) {
        console.error('Error getting all applications (admin):', err.message);
        res.status(500).send('Server error');
    }
};


// @route   GET /api/applications/:id
// @desc    Get single application by ID (for admin/student if theirs)
// @access  Private (Admin/Student)
exports.getApplicationById = async (req, res) => {
    try {
        const application = await Application.findByPk(req.params.id, {
            include: [
                { model: User, as: 'student', attributes: { exclude: ['password'] } },
                { model: College, as: 'college' },
                { model: FeeStructure, as: 'approvedFeeStructure', required: false },
                { model: User, as: 'adminReviewer', attributes: ['fullName'], required: false },
                { model: Document, as: 'documents', attributes: ['id', 'documentType', 'originalFileName', 'filePath'] }
            ]
        });

        if (!application) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        // Admin can view any, student only their own
        if (req.user.role !== 'admin' && application.studentId !== req.user.id) {
            return res.status(403).json({ msg: 'Access denied: Not authorized to view this application' });
        }

        res.json(application);
    } catch (err) {
        console.error('Error getting application by ID:', err.message);
        res.status(500).send('Server error');
    }
};


// @route   PUT /api/applications/:id/status
// @desc    Update application status (Admin only)
// @access  Private (Admin)
exports.updateApplicationStatus = async (req, res) => {
    const { status, adminNotes, feeStructureId } = req.body;
    const applicationId = req.params.id;

    try {
        let application = await Application.findByPk(applicationId);
        if (!application) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        // Admin only can update
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Only administrators can update application status' });
        }

        application.status = status;
        application.adminNotes = adminNotes || application.adminNotes;
        application.reviewedByAdminId = req.user.id;

        // If approved, optionally assign a fee structure and make it visible
        if (status === 'approved' && feeStructureId) {
            const fee = await FeeStructure.findByPk(feeStructureId);
            if (!fee || fee.collegeId !== application.collegeId) {
                return res.status(400).json({ msg: 'Invalid fee structure ID for this college.' });
            }
            application.feeStructureId = feeStructureId;
            if (!fee.isVisibleToStudents) {
                fee.isVisibleToStudents = true;
                await fee.save();
            }
        } else if (status !== 'approved') {
            application.feeStructureId = null;
        }

        await application.save();
        res.json(application);
    } catch (err) {
        console.error('Error updating application status:', err.message);
        res.status(500).send('Server error');
    }
};


// @route   POST /api/applications/:id/documents
// @desc    Upload document(s) for an application
// @access  Private (Student)
exports.uploadDocument = async (req, res) => {
    const applicationId = req.params.id;
    const userId = req.user.id;
    const { documentType } = req.body;

    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }
    if (!documentType) {
        fs.unlink(req.file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
        });
        return res.status(400).json({ msg: 'Document type is required' });
    }

    try {
        const application = await Application.findByPk(applicationId);
        if (!application) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file:", err);
            });
            return res.status(404).json({ msg: 'Application not found' });
        }
        if (application.studentId !== userId) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Error deleting file:", err);
            });
            return res.status(403).json({ msg: 'Access denied: Not authorized to upload documents for this application' });
        }

        const newDocument = await Document.create({
            applicationId,
            userId,
            documentType,
            filePath: req.file.path,
            originalFileName: req.file.originalname
        });

        res.status(201).json(newDocument);
    } catch (err) {
        console.error('Error uploading document:', err.message);
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting file after DB error:", unlinkErr);
            });
        }
        res.status(500).send('Server error');
    }
};


// @route   GET /api/applications/:id/documents/:docId/download
// @desc    Download a document
// @access  Private (Admin/College Admin/Student who owns it)
exports.downloadDocument = async (req, res) => {
    const { id: applicationId, docId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const document = await Document.findByPk(docId, {
            include: [{ model: Application, as: 'application' }]
        });

        if (!document) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        // Authorization:
        let authorized = false;
        if (userRole === 'admin') {
            authorized = true;
        } else if (userRole === 'college') {
            const college = await College.findOne({ where: { adminUserId: userId } });
            if (college && document.application && document.application.collegeId === college.id) {
                authorized = true;
            }
        } else if (userRole === 'student' && document.userId === userId) {
            authorized = true;
        }

        if (!authorized) {
            return res.status(403).json({ msg: 'Access denied: Not authorized to download this document' });
        }

        // filePath relative to your project root
        const filePath = path.join(__dirname, '..', '..', document.filePath);
        if (fs.existsSync(filePath)) {
            res.download(filePath, document.originalFileName);
        } else {
            console.error(`File not found at path: ${filePath}`);
            res.status(404).json({ msg: 'File not found on server' });
        }
    } catch (err) {
        console.error('Error downloading document:', err.message);
        res.status(500).send('Server error');
    }
};


// @route   POST /api/applications/:id/share-documents
// @desc    Simulate sharing documents with a college (Admin only)
// @access  Private (Admin)
exports.shareDocumentsWithCollege = async (req, res) => {
    const applicationId = req.params.id;
    const { collegeId } = req.body;

    try {
        const application = await Application.findByPk(applicationId, {
            include: [{ model: Document, as: 'documents' }]
        });

        if (!application) {
            return res.status(404).json({ msg: 'Application not found' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Only administrators can share documents' });
        }

        if (!application.documents || application.documents.length === 0) {
            return res.status(400).json({ msg: 'No documents found to share for this application.' });
        }

        const collegeToShare = await College.findByPk(collegeId || application.collegeId);
        if (!collegeToShare) {
            return res.status(404).json({ msg: 'Target college not found.' });
        }

        const documentNames = application.documents.map(doc => doc.originalFileName).join(', ');

        res.json({
            msg: `Documents (${documentNames}) for application ${applicationId} simulated as shared with ${collegeToShare.name} (${collegeToShare.contactEmail}).`,
            sharedDocuments: application.documents.map(doc => ({
                id: doc.id,
                fileName: doc.originalFileName,
                type: doc.documentType
            }))
        });
    } catch (err) {
        console.error('Error sharing documents:', err.message);
        res.status(500).send('Server error');
    }
};