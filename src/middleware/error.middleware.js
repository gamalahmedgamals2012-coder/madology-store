function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";
  const productionRuntime = isProductionRuntime();

  if (!productionRuntime) {
    console.error(error);
  } else if (statusCode >= 500) {
    console.error("[ERROR]", {
      message: error.message,
      statusCode,
      path: req.originalUrl
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(!productionRuntime && error.stack ? { stack: error.stack } : {})
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
  isProductionRuntime
};
