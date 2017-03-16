//jshint node: true, esnext: true
"use strict";

var fs = require("fs");
var filedata = fs.readFileSync(process.argv[2],"UTF-8").toString().split("\r\n");
var logs = [];
var regex = /\[([0-9]+)\/([A-Za-z]+)\/([0-9]+):([0-9]+):([0-9]+):([0-9]+) \+0+\] "GET (\/[a-z]+\.html) ?[\?|#]?[A-Za-z\=]+?[ |\=]?[a-z]?[A-Za-z]+\/[0-9]\.[0-9]" ([0-9]+)/;

function dateOfLog(log){
	var dateLog = new Date(parseInt(log[3]), ("JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(log[2])) / 3, parseInt(log[1]), parseInt(log[4]) + 2, parseInt(log[5]));
	return dateLog.toJSON().substring(0, 16);
}

function addMinutes(log, minutes) {
	var dateLog = new Date(parseInt(log[3]), ("JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(log[2])) / 3, parseInt(log[1]), parseInt(log[4]) + 2, parseInt(log[5]));
    return new Date(dateLog.getTime() + minutes * 60000).toJSON().substring(0, 16);
}

var arr = [];
for(var i in filedata){
	logs.push(regex.exec(filedata[i]));
	arr.push(dateOfLog(logs[i]));
}

var start = "";
var end = "";
var min = 1;
for(var i in process.argv){
	if(process.argv[i] === "--start"){
		start = process.argv[parseInt(i) + 1];
	}
	else if(process.argv[i] === "--end"){
		end = process.argv[parseInt(i) + 1];
	}
	else if(process.argv[i] === "--interval" && !(isNaN(process.argv[parseInt(i) + 1]))){
		min = process.argv[parseInt(i) + 1];
	}
}

var indexOfFirstLog = arr.indexOf(start);
if(indexOfFirstLog < 0){
	indexOfFirstLog = arr[0];
}
var indexOfLastLog = arr.indexOf(end);
if(indexOfLastLog < 0){
	indexOfLastLog = arr.length - 1;
}

var map = new Map();

var endpoints = [];
for(var i = indexOfFirstLog; i <= indexOfLastLog; i++){
	if(endpoints.indexOf(logs[i][7]) < 0){
		endpoints.push(logs[i][7]);
	}
}

endpoints.sort();

map.set("endpoint", endpoints);

var LogsForEndpoint = [];
var nrOfLogsByEndPoint = [];
var LogsSortedByEndPoints = endpoints.map(function(endpoint){
	var logsByEndPoint = [];
	for(var i = indexOfFirstLog; i <= indexOfLastLog; i++){
		if((logs[i][7] == endpoint) && (typeof(logs[i][8]) === 'string')){
			logsByEndPoint.push(logs[i]);
			LogsForEndpoint.push((logs[i]));
		}
	}
	nrOfLogsByEndPoint.push(logsByEndPoint.length);
	return logsByEndPoint;
});

map.set("nrOfLogsForEndpoint", nrOfLogsByEndPoint);
map.set("logs", LogsForEndpoint);

var currentTime = dateOfLog(logs[indexOfFirstLog]);
var index = 0;
var r = 1;
while(currentTime <= dateOfLog(logs[indexOfLastLog])){
	for(var i in map.get("endpoint")){
		var nrOfLogs = 0;
		var nrOfSucceededLogs = 0;
		for(var j = index; j < index + map.get("nrOfLogsForEndpoint")[i]; j++){
			var currentTime2 = addMinutes(logs[indexOfFirstLog], parseInt(min) * r);
			if((dateOfLog(map.get("logs")[j]) >= currentTime) && (dateOfLog(map.get("logs")[j]) < currentTime2) && (map.get("logs")[j][8][0] == 2)){
				nrOfSucceededLogs++;
			}
			if((dateOfLog(map.get("logs")[j]) >= currentTime) && (dateOfLog(map.get("logs")[j]) < currentTime2)){
				nrOfLogs++;
			}
		}
		if(nrOfLogs === 0){
			break;
		}
		else{
			console.log(currentTime + " " + min + " " + map.get("endpoint")[i] + " " + (nrOfSucceededLogs / nrOfLogs * 100).toFixed(2));
			index += parseInt(map.get("nrOfLogsForEndpoint")[i]);
		}
	}
	index = 0;
	currentTime = addMinutes(logs[indexOfFirstLog], parseInt(min) * r);
	r++;
}