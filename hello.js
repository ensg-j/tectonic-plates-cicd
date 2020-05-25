var express = require('express');
var formidable = require('formidable');
var fs = require('fs');

var app = express();

app.use(express.static(__dirname + '/ressources'));


app.get('/', function (req, res){
    res.sendFile(__dirname + '/ressources/index_form.html');
});

app.post('/', function (req, res){
  var form = new formidable.IncomingForm();

  form.parse(req, function(err, fields, files) {
    //res.writeHead(200, {'content-type': 'text/html'});

    fs.readFile(files.upload.path, function (err, data) {
      fs.writeFile('ressources/currentfile.geojson',data,function (err) 
        if (err) throw err;
        console.log('File is created successfully.');
      });
      
      
    });
  });

  res.redirect("/currentglobe");
});



app.get('/currentglobe', function (req, res){
  res.sendFile(__dirname + '/ressources/index_globe.html');
});

app.listen(3000);

