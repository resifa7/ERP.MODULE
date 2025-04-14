const multer = require("multer");
const path = require("path");
const fs = require("fs");

const isVercel = process.env.VERCEL === '1';

let storage;

if (isVercel) {
  storage = multer.memoryStorage();
} else {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
}

const upload = multer({ storage });

module.exports = upload;