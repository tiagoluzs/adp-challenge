module.exports = (app) => {
  return {
    validate: (req,res,next) => {
      if(req.query['key']=='adp') {
        next();
      } else {
        res.status(403).json({
          error: true
        });
      }
    }
  }
};
