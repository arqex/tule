require.config({
    paths: {
        /* Masters */
        'jquery': '../bower_components/jquery/jquery',
        'underscore': '../bower_components/underscore/underscore',
        'backbone': '../bower_components/backbone/backbone',
        'text': '../bower_components/requirejs-text/text',

        /* jQuery UI */
        'jquery.ui.core': '../bower_components/jqueryui/ui/jquery.ui.core',
        'jquery.ui.mouse': '../bower_components/jqueryui/ui/jquery.ui.mouse',
        'jquery.ui.position': '../bower_components/jqueryui/ui/jquery.ui.position',
        'jquery.ui.widget': '../bower_components/jqueryui/ui/jquery.ui.widget',

        'jquery.ui.draggable': '../bower_components/jqueryui/ui/jquery.ui.draggable',
        'jquery.ui.droppable': '../bower_components/jqueryui/ui/jquery.ui.droppable',        
        'jquery.ui.resizable': '../bower_components/jqueryui/ui/jquery.ui.resizable',
        'jquery.ui.selectable': '../bower_components/jqueryui/ui/jquery.ui.selectable',
        'jquery.ui.sortable': '../bower_components/jqueryui/ui/jquery.ui.sortable',
        
        'jquery.ui.datepicker': '../bower_components/jqueryui/ui/jquery.ui.datepicker',
        'jquery.ui.slider': '../bower_components/jqueryui/ui/jquery.ui.slider',        
        'jquery.ui.tooltip': '../bower_components/jqueryui/ui/jquery.ui.tooltip',
        
        /* jQuery UI i18n */
        'jquery.ui.datepicker-en': '../bower_components/jqueryui/ui/i18n/jquery.ui.datepicker-en'
    },
    shim: {
        /* Masters */
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },

        /* jQuery UI */        
        'jquery.ui.core': {
            deps: ['jquery']
        },
        'jquery.ui.mouse': {
            deps: ['jquery.ui.widget']
        },
        'jquery.ui.position': {
            deps: ['jquery']
        },
        'jquery.ui.widget': {
            deps: ['jquery']
        },


        'jquery.ui.draggable': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget'
            ]
        },
        'jquery.ui.droppable': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget',
                'jquery.ui.draggable'
            ]
        },
        'jquery.ui.resizable': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget'
            ]
        },
        'jquery.ui.selectable': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget'
            ]
        },        
        'jquery.ui.sortable': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget'
            ]
        },


        'jquery.ui.datepicker': {
            deps: ['jquery.ui.core']
        },
        'jquery.ui.slider': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.mouse',
                'jquery.ui.widget'
            ]
        },
        'jquery.ui.tooltip': {
            deps: [
                'jquery.ui.core',
                'jquery.ui.widget',
                'jquery.ui.position'
            ]
        },
        
        /* jQuery UI i18n */
        'jquery.ui.datepicker-en': {
            deps: ['jquery.ui.datepicker']
        }
    }
});

require(['app'], function(App) {
    App.init();
});