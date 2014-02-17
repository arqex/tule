'use strict';

var mongojs = require('mongojs'),
    _       = require('underscore'),
    config  = require('config'),
    defaults = {
        fields: {},
        tableFields: []
    }
;

module.exports = {
    getConfig: function(req, res){
        var db      = req.app.db,
            type    = req.params.type
        ;

        db.collection(config.mon.settingsCollection).findOne({type:type}, function(err, settings){
            if(err){
                console.log(err);
                return res.send(400, {error: 'Internal error.'});
            }

            if(!_.isObject(settings))
                return res.json(defaults);

            return res.json(_.extend({}, defaults, settings));
        });
    },

    updateConfig: function(req, res){
        var db      = req.app.db,
            name    = req.params.name,
            doc     = req.body
        ;

        // Creates object id
        doc['_id'] = new mongojs.ObjectId(doc['_id']);

        if(!name)
            res.send(400, {error: 'No document name given.'});

        if(name != doc.name) {
            res.send(400, {error: 'No name matches.'});
        }

        db.collection(config.mon.settingsCollection).save(doc, function(err, saved) {
          if( err || !saved ) return res.send(400, {error: 'Internal error'});
          return res.json(doc);
      });

    },

    createConfig: function(req, res){
        var name = req.params.name,
            doc = req.body
        ;
        if(!name)
            res.send(400, {error: 'No document name given.'});

        doc.name = name;

        req.app.db.collection(config.mon.settingsCollection).insert(doc, function(err, newDoc){
            if(err){
                console.log(err);
                return res.send(400, {error: 'Internal error'});
            }
            res.json(newDoc);
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

        req.app.db.collection(type).remove(
            {name: mongojs.ObjectId(name)},
            function(err){
                if(err){
                    console.log(err);
                    res.send(400, {error: 'Internal Error'});
                }
                res.send(200, {}); // Empty hash needed for trigger backbone's success callback
            }
        );
    }
}