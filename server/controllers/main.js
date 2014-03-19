var path = require('path');


module.exports = function(req, res){
    var viewsPath = path.resolve('server/views');
    res.sendfile(viewsPath + '/' + 'main.html');
};