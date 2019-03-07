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
				download: true, 
				keep: true
			 }, function (er, data) {

				dateObj = new Date(); // get new date
				var filename_year = dateObj.getUTCFullYear();
				var filename_month = dateObj.getUTCMonth() + 1;
				if (filename_month < 10) {
					filename_month = `0${filename_month}`
				};
				var filename_day = dateObj.getUTCDate();
				if (filename_day < 10) {
					filename_day = `0${filename_day}`
				};
				var filename_hour = dateObj.getUTCHours();
				if (filename_hour < 10) {
					filename_hour = `0${filename_hour}`
				};
				var filename_min = dateObj.getUTCMinutes();
				if (filename_min < 10) {
					filename_min = `0${filename_min}`
				};
				var filename_sec = dateObj.getUTCSeconds();
				if (filename_sec < 10) {
					filename_sec = `0${filename_sec}`
				};
				var filename_date = `${filename_year}${filename_month}${filename_day}${filename_hour}${filename_min}${filename_sec}`;
				console.log('filename: ', filename_date);
				latestimage = '/media/pi/AVS/timelapse_photos/' + filename_date + '.jpg';
				var usbPath = '/dev/bus/usb/' + usbport[1] + '/' + usbport[2];
				fs.writeFile('/media/pi/AVS/timelapse_photos/' + filename_date + '.jpg', data, (err) => {
					if (err) {			//handle file system errors
						console.log('Error writing file, ', err);
					} else {
						var fileSizeInBytes = fs.statSync(latestimage)["size"];
						var fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
						console.log('Size of ' + filename_date + ': ' + fileSizeInMegabytes + 'mb');

						if (fileSizeInBytes < 1000) {

							fs.unlink('/media/pi/AVS/timelapse_photos/' + filename_date + '.jpg', (err) => {
								if (err) throw err;
								console.log('successfully deleted ', filename_date);
							  });

							exec('usbreset ' + usbPath, function (err, stdout, stderr) {

								if (stderr || stdout) {
									console.log('stdout: ' + stdout);
									console.log('stderr: ' + stderr);
								}

								else if (err !== null) {
									// crash if we can't get going again
									console.log('usbreset exec error: ' + err);

								}

								else {
									console.log("usbreset successfull");
								}

							});
						};
					}
				});

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

app.get('/reboot', function (req, res) {
	console.log('reboot');
	exec('sudo reboot ', function (err, stdout, stderr) {

		if (stderr || stdout) {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
		}

		else if (err !== null) {
			// crash if we can't get going again
		}

		else {
			console.log("rebooting...");
		}

	});
});


app.listen(port);
console.log('Server started on port ' + port);

module.exports = app; 