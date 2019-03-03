var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var pug = require('pug');
var fs = require('fs');
var gphoto2 = require('gphoto2');
var GPhoto = new gphoto2.GPhoto2();

var SegfaultHandler = require('segfault-handler'); // for debugging only
SegfaultHandler.registerHandler("crash.log");

var port = 3000;
var app = express();

var dateObj = new Date();

let camera = undefined;

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
		cameras: camera
	});
});

app.post('/', function (req, res) { //this starts recording
	// console.log(req.body);
	console.log('start!');
	var interval = req.body.interval;
	console.log(typeof camera);
	if (typeof camera !== 'undefined' && camera.length > 0) {
		camera[0].takePicture({ download: true }, function (er, data) {

			function getPicture(er, data) {
				dateObj = new Date(); // get new date
				var filename_year = dateObj.getUTCFullYear();
				var filename_month = dateObj.getUTCMonth() + 1;
				var filename_day = dateObj.getUTCDate();
				var filename_hour = dateObj.getUTCHours();
				var filename_min = dateObj.getUTCMinutes();
				var filename_sec = dateObj.getUTCSeconds();
				if (filename_sec < 10) {
					filename_sec = `0${filename_sec}`
				}

				var filename_date = `${filename_year}${filename_month}${filename_day}${filename_hour}${filename_min}${filename_sec}`;
				console.log('filename: ', filename_date);
				fs.writeFileSync('/home/pi/Pictures/' + filename_date + '.jpg', data); //TODO make this a dropdown menu
			};

			setInterval(() => getPicture(), interval * 1000);
		});
	}
	else {
		console.log("no camera found!");
	}
	res.render('index', {
		cameras: camera
	});
});


app.listen(port);
console.log('Server started on port ' + port);

module.exports = app;