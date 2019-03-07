var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var pug = require('pug');
var fs = require('fs');
var gphoto2 = require('gphoto2');
var GPhoto = new gphoto2.GPhoto2();
var exec = require('child_process').exec;

var SegfaultHandler = require('segfault-handler'); // for debugging only
SegfaultHandler.registerHandler("crash.log");

var port = 3000;
var app = express();

var dateObj = new Date();

let camera = undefined;

var usbport = undefined;
var message = undefined;
var interval = undefined;
var intervalID = undefined;
var latestimage = undefined;

GPhoto.setLogLevel(1);
GPhoto.on('log', function (level, domain, message) {
	console.log(domain, message);
});

// get all cameras and store in camera
GPhoto.list(function (cameras) {
	camera = cameras;
});

function takePicture(cam, dir) {
}

//Middleware
app.use(function (req, res, next) {
	//console.log('Time: ', Date.now());
	next();
});

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//Routes
app.get('/', function (req, res) {
	console.log('Month: ' + dateObj.getMonth() + ' Day: ' + dateObj.getUTCDate() + ' Year: ' + dateObj.getFullYear());
	res.render('index', {
		cameras: camera,
		message: message,
		interval: interval,
		image: latestimage
	});
});

app.post('/', function (req, res) { //this starts recording
	console.log('start!');
	error = null;
	interval = req.body.interval;
	if (interval < 5) {
		interval = 5;
	}
	console.log(typeof camera);
	usbport = camera[0].port.match(/usb:([0-9]+),([0-9]+)/);
	console.log('Camera USB port: ' + usbport + '\n');
	message = 'Recording Active! Interval: ' + interval + ' s';
	if (typeof camera !== 'undefined' && camera.length > 0) {
		function getPicture() {
			camera[0].takePicture({
				download: false, 
				keep: true
			}, function (er, path) {
				console.log(path);

			});
		};
		intervalID = setInterval(() => getPicture(), interval * 1000); //TODO limit interval to 4 seconds? 
	}
	else {
		console.log("no camera found!");
	}
	res.render('index', {
		message: message,
		interval: interval,
		cameras: camera,
		image: latestimage
	});
});

app.post('/stop', function (req, res) {
	console.log('stop');
	clearInterval(intervalID);
	error = 'Recording stopped';
	message = null;
	interval = null;
	res.render('index', {
		error: error,
		cameras: camera
	});
});


app.listen(port);
console.log('Server started on port ' + port);

module.exports = app; 