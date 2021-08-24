module.exports = (app) => {

  app.get('/icecream', app.modules.auth.validate, app.controllers.index.icecream);


};
