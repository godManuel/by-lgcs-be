const multer = require("multer");
const ErrorResponse = require("./errorResponse");

const storage = multer.diskStorage({});

const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new ErrorResponse("Only JPEG, JPG and PNG image files are allowed.", 400),
      false,
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

module.exports = upload;
