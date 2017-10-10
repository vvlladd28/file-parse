var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var File = require(path.join(__dirname, 'bin/workFile'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', function(req, res){
    // create an incoming form object
    var form = new formidable.IncomingForm();
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;
    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/uploads');
    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function(field, file) {
        fs.rename(file.path, path.join(form.uploadDir, file.name));
    });
    // log any errors that occur
    form.on('error', function(err) {
        console.log('An error has occured: \n' + err);
    });
    // once all the files have been uploaded, send a response to the client
    form.on('end', function(field, file) {
        res.end('success');
    });
    form.parse(req, function(err, fields, files) {
        console.log(fields);
        console.log(files);
        if(fields.database == 'PostgreSQL') {
            if (files.uploads.length == undefined) {
                var file = new File(files.uploads);
                file.pgParse();
                file.deleteFile();
            } else {
                files.uploads.forEach(function (item) {
                    var file = new File(item);
                    file.pgParse();
                    file.deleteFile();
                });
            }
        } else {
            if (files.uploads.length == undefined) {
                var file = new File(files.uploads);
                file.mdParse();
                file.deleteFile();
            } else {
                files.uploads.forEach(function (item) {
                    var file = new File(item);
                    file.mdParse();
                    file.deleteFile();
                });
            }
        }
    });

});

module.exports = app;