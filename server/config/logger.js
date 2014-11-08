var config = require('config'),
	log = require('winston')
;

// Warnings and errors are logged to a file
log.add(log.transports.File, {
	level: 'warn',
	timestamp: true,
	filename: config.path.logs + '/errors.log',
	maxsize: 10000000, // 10MB
	handleExceptions: true
} );

// Do not exit on exceptions
log.exitOnError = false;

module.exports = log;