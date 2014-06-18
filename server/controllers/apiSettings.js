'use strict';

var _       = require('underscore'),
    config  = require('config'),
    db = require(config.path.modules + '/db/dbManager').getInstance()
;

module.exports = {
    getConfig: function(req, res){
        var name = req.params.name;

        db.collection(config.mon.settingsCollection).findOne({name:name}, function(err, settings){
            if(err){
                console.log(err);
                return res.send(400, {error: 'Internal error.'});
            }

            if(!_.isObject(settings))
                return res.send(404);

            return res.json(settings);
        });
    },

    updateConfig: function(req, res){
        var name    = req.params.name,
            doc     = req.body
        ;

        if(!name)
            res.send(400, {error: 'No document name given.'});

        if(name != doc.name) {
            res.send(400, {error: 'No name matches.'});
        }

        db.collection(config.mon.settingsCollection).save(doc, function(err, saved) {
          if( err || !saved ) return res.send(400, {error: 'Internal error'});
          db.collection(config.mon.settingsCollection).findOne({name:name}, function(err, settings){
            console.log(settings);
          });
          return res.json(doc);
      });

    },

    createConfig: function(req, res){
        var name = req.params.name,
            doc  = req.body
        ;

        if(!name)
            res.send(400, {error: 'No name specified'});

        doc.name = name;

        db.collection(config.mon.settingsCollection).insert(doc, function(err, newDoc){
            if(err){
                console.log(err);
                return res.send(400, {error: 'Internal error while inserting document'});
            }
            return res.json(newDoc[0]);
        });
    },

    removeConfig: function(req, res) {
        var name = req.params.name,
            type = req.params.type
        ;

        if(!name)
            res.send(400, {error: 'No document name given.'});
        if(!type)
            res.send(400, {error: 'No document type given.'});

        db.collection(type).remove(
            {name: name},
            function(err){
                if(err){
                    console.log(err);
                    res.send(400, {error: 'Internal Error'});
                }
                res.send(200, {});
            }
        );
    }
}