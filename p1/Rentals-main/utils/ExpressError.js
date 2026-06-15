class ExpressError extends Error {
  constructor(statusCode, message) {  
    super(message);                  
    this.statusCode = statusCode;    
    this.name = "ExpressError";      
    if (Error.captureStackTrace) {   
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ExpressError;      