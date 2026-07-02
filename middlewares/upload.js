const multer = require("multer");
const upload = require("../utils/multer");
const ErrorResponse = require("../utils/errorResponse");

const handleMulterError = (err, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return next(new ErrorResponse("File size must not exceed 5MB.", 400));

      case "LIMIT_FILE_COUNT":
        return next(new ErrorResponse("Too many files uploaded.", 400));

      case "LIMIT_UNEXPECTED_FILE":
        return next(new ErrorResponse("Unexpected file field.", 400));

      default:
        return next(new ErrorResponse(err.message, 400));
    }
  }

  return next(
    err instanceof ErrorResponse ? err : new ErrorResponse(err.message, 400),
  );
};

exports.uploadSingle = (field) => {
  return (req, res, next) => {
    upload.single(field)(req, res, (err) => {
      handleMulterError(err, next);
    });
  };
};

exports.uploadArray = (field) => {
  return (req, res, next) => {
    upload.array(field)(req, res, (err) => {
      handleMulterError(err, next);
    });
  };
};
