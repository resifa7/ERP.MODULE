function timeoutMiddleware(req, res, next) {
    const timeout = setTimeout(() => {
      console.error('Request timeout', req.originalUrl);
      
      if (!res.headersSent) {
        res.status(503).send('Request timeout. Please try again later.');
      }
    }, 45000);
    
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    next();
  }
  
  module.exports = timeoutMiddleware;