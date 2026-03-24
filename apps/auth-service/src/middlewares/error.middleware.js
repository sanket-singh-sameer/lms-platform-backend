const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

const errorHandler = (err, req, res, next) => {
    // Keep this guard so Express recognizes this as error middleware even if next is unused.
    void next;

    const statusCode = err.statusCode || err.status || 500;

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            message: 'Invalid JSON payload'
        });
    }

    return res.status(statusCode).json({
        message: err.message || 'Internal server error'
    });
};

export {
    notFoundHandler,
    errorHandler
};