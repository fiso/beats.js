"use strict";
var express = require('express');
var app = express();

app.use(express.static("public"));

app.listen(1338, function () {
    console.log("Development server running");
});
