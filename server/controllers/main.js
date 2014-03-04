module.exports = function(req, res){
    path = require('path');

    var path = path.resolve('server/views');
    res.sendfile(path + '/' + 'main.html');
};