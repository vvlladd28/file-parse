'use strict';
var csv = require('fast-csv');
var fs = require('fs');
var xml2js = require('xml2js');
var pool = require('./pgdb');
var MongoClient = require('mongodb').MongoClient;

function workFile(fileObj){
    this.file = fileObj;
    this.getTypeFile = function() {
        var partName = this.file.name.split('.');
        return partName[partName.length-1];
    };
    this.deleteFile = function () {
        fs.unlink(__dirname + '/../uploads/' + this.file.name, function(err){
            if(err)
                return console.log(err);
            console.log('file deleted successfully');
        });
    };
    this.pgParse = function() {
        switch (this.getTypeFile()) {
            case 'csv':{
                console.log("Work csv");
                var dataArr = [];
                fs.createReadStream(__dirname + '/../uploads/' + this.file.name)
                    .on('error', function (error) {
                        console.log("Caught", error);
                    })
                    .pipe(csv())
                    .on('data', function(data){
                        dataArr.push(data);
                    })
                    .on('end', function(){
                        queryPg(dataArr, 'csv');
                        console.log('Done');
                    });
                break;
            }
            case 'xml':{
                console.log("Work xml");
                var parser = new xml2js.Parser();
                fs.readFile(__dirname + '/../uploads/' + this.file.name, function(err, data) {
                    if(err)
                        return console.log(err);
                    parser.parseString(data, function (err, result) {
                        if(err)
                            return console.log(err);
                        queryPg(jsonXmlToArray(result), 'xml');
                        console.log('Done');
                    });
                });
                break;
            }
            case 'json':{
                console.log("Work json");
                var obj;
                fs.readFile(__dirname + '/../uploads/' + this.file.name, 'utf8', function (err, data) {
                    if (err) throw err;
                        queryPg(jsonToArray(data), 'json');
                    console.log('Done');
                });
                break;
            }
        }
    };
    this.mdParse = function() {
        switch (this.getTypeFile()) {
            case 'csv':{
                console.log("Work csv");
                var dataArr = [];
                fs.createReadStream(__dirname + '/../uploads/' + this.file.name)
                    .on('error', function (error) {
                        console.log("Caught", error);
                    })
                    .pipe(csv())
                    .on('data', function(data){
                        dataArr.push(data);
                    })
                    .on('end', function(){
                        queryMD(arrayToJson(dataArr), "csv");
                        console.log('Done');
                    });
                break;
            }
            case 'xml':{
                console.log("Work xml");
                var parser = new xml2js.Parser();
                fs.readFile(__dirname + '/../uploads/' + this.file.name, function(err, data) {
                    if(err)
                        return console.log(err);
                    parser.parseString(data, function (err, result) {
                        if(err)
                            return console.log(err);
                        queryMD(arrayToJson(jsonXmlToArray(result)), "xml");
                        console.log('Done');
                    });
                });
                break;
            }
            case 'json':{
                console.log("Work json");
                var obj;
                fs.readFile(__dirname + '/../uploads/' + this.file.name, 'utf8', function (err, data) {
                    if (err) throw err;
                    queryMD(JSON.parse(data), "json");
                    console.log('Done');
                });
                break;
            }
        }
    };
};

function jsonXmlToArray (json){
    var array = [];
    var obj = JSON.parse(JSON.stringify(json.dataset.record));
    obj.forEach(function (item) {
        array.push([item.company_name[0], item.job_title[0], item.longitude[0], item.latitude[0]]);
    });
    return array;
}

function jsonToArray (json){
    var obj = JSON.parse(json);
    var array = [];
    obj.forEach(function (item){
        array.push([item.company_name, item.job_title, item.longitude, item.latitude]);
    });
    return array;
}

function queryPg (dataArr, tableName){
    pool.connect(function(err,client,done) {
        if(err)
            console.log("not able to get connection "+ err);
        client.query('INSERT into ' + tableName + ' (company_name, job_title, longitude, latitude) VALUES' + createQuery(dataArr),function(err,result) {
            //call `done()` to release the client back to the pool
            done();
            if(err)
                console.log(err);
            console.log(result);
        });
    });
}

function createQuery (array){
    var temp = [];
    array.forEach(function (item){
        temp.push("('"+item[0]+"', '"+item[1]+"', "+item[2]+", "+item[3]+")");
    });
    return temp.join(', ');
}

function arrayToJson (array){
    var arr = [];
    array.forEach(function (item) {
        arr.push(JSON.parse(JSON.stringify({company_name:item[0],job_title:item[1],longitude:item[2],latitude:item[3]})));
    });
    return arr;
}

function queryMD(obj, collectName) {
    MongoClient.connect("mongodb://localhost:27017/lab", function(err, db) {
        if(err) throw err;
        db.collection(collectName).insertMany(obj, function(err, res) {
            if (err) throw err;
            console.log("insert success!!");
            db.close();
        });
    });
}

module.exports = workFile;