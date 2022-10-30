const app = require('../services/userAccounts.service');

const get = function(req, res){
    res.send(app.get(req.params._id));
}

const getAll = function(req, res){
    res.send(app.getAll());
}

module.exports = {
    get,
    getAll
};