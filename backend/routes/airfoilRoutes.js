const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getAirfoils,
  calculate,
  processCustomAirfoil,
  uploadAirfoilFile,
  compareAirfoils,
  getQuiz
} = require('../controllers/airfoilController');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (ext === 'dat' || ext === 'txt' || ext === 'csv') {
      cb(null, true);
    } else {
      cb(new Error('Only .dat, .txt, and .csv files are allowed'));
    }
  }
});

router.get('/airfoils', getAirfoils);
router.post('/calculate', calculate);
router.post('/airfoil/custom', processCustomAirfoil);
router.post('/airfoil/upload', upload.single('file'), uploadAirfoilFile);
router.post('/compare', compareAirfoils);
router.get('/quiz', getQuiz);

module.exports = router;
