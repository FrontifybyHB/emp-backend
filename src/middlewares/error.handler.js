import config from '../config/config.js'

const NODE_ENV = config.NODE_ENV;


export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;

    console.error(err);

    const responsePayload = {
        message: err.message || 'Internal Server Error',
    };

    // Include stack trace only in development mode
    if (NODE_ENV === 'development') {
        responsePayload.stack = err.stack;
    }

    res.status(statusCode).json(responsePayload);
}