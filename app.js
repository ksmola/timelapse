var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var pug = require('pug');
var fs = require('fs');
var gphoto2 = require('gphoto2');
var GPhoto = new gphoto2.GPhoto2();

var port = 3000;
var app = express();

var list; //array holding list of cameras

GPhoto.setLogLevel(1);
GPhoto.on('log', function (level, domain, message) {
	console.log(domain, message);
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
	GPhoto.list(function (list) {
		if (list.length === 0) {
			console.log('nothing found');
			list[0] = {model: "no camera found"};
		}
		var camera = list[0];
		console.log('found: ', camera.model);
		res.render('index', {
			title: 'hello world',
			cameras: camera
		});
	});
});

app.post('/', function (req, res) {
	console.log(req.body);
	console.log('start!');
	var camera = req.body.cameralist;
	var inteval = req.body.interval;
	camera.takePicture({download: true}, function (er, data) {
		fs.writeFileSync(__dirname + '/picture.jpg', data);
	  });
});


app.listen(port);
console.log('Server started on port ' + port);

module.exports = app;