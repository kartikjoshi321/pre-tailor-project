const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
var app = express();
var cors = require('cors');

const adminRoute = require('./routes/admin.routes')
const userRoute = require("./routes/user.routes");
const taylorRoute = require("./routes/tailor.routes");
const ustaadRoute = require("./routes/ustaad.routes");
const { dirname } = require('path');


//app.use(helmet());
app.use(cors())
app.use(bodyParser.json()); // use express
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/admin', adminRoute);
app.use('/user', userRoute);
app.use('/tailor', taylorRoute);
app.use('/ustaad', ustaadRoute);

app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use('/template', express.static(path.join(__dirname, 'template')));

app.use('', express.static(path.join(__dirname, 'dist', 'tailorLanding')));
app.get('', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'tailorLanding', 'index.html'));
});


app.use('/adminpanel', express.static(path.join(__dirname, 'dist', 'tailorAdmin')))
app.get('/adminpanel/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'tailorAdmin', 'index.html'));
});

app.get('/ping', (req, res) => {
    res.end(`<html><head><title>Tailor App</title></head><body><h1 align="center">Tailor Application On Work</h1></body></html>`);
});

app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is connected....`);
});

