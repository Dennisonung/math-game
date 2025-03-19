const express = require('express');
const app = express();

const server = require('http').createServer(app);

//turn off cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(express.static(__dirname));


app.listen(5500, () => {
    console.log('Server started on http://localhost:5500');
});