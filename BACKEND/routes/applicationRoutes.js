// routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure the uploads directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Files will be stored in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// ------ Student routes ------

// Submit a new application
router.post(
    '/',
    authMiddleware,
    authMiddleware.authorize('student'),
    applicationController.submitApplication
);

// Get all applications of the logged-in student
router.get(
    '/me',
    authMiddleware,
    authMiddleware.authorize('student'),
    applicationController.getStudentApplications
);

// Request resubmission (New route)
router.post(
    '/:id/request-resubmit',
    authMiddleware,
    authMiddleware.authorize('student'),
    applicationController.requestResubmission
);

// Upload a document for the application
router.post(
    '/:id/documents',
    authMiddleware,
    authMiddleware.authorize('student'),
    upload.single('document'),
    applicationController.uploadDocument
);

// Download a specific document from an application
router.get(
    '/:id/documents/:docId/download',
    authMiddleware,
    authMiddleware.authorize(['student', 'admin', 'college']),
    applicationController.downloadDocument
);

// ------ Admin routes ------

// Get all applications (admin only)
router.get(
    '/',
    authMiddleware,
    authMiddleware.authorize('admin'),
    applicationController.getAllApplications
);

// Get a specific application (admin or student who owns it)
router.get(
    '/:id',
    authMiddleware,
    authMiddleware.authorize(['admin', 'student']),
    applicationController.getApplicationById
);

// Set/update the application's status
router.put(
    '/:id/status',
    authMiddleware,
    authMiddleware.authorize('admin'),
    applicationController.updateApplicationStatus
);

// Share application documents with a college
router.post(
    '/:id/share-documents',
    authMiddleware,
    authMiddleware.authorize('admin'),
    applicationController.shareDocumentsWithCollege
);

module.exports = router;
