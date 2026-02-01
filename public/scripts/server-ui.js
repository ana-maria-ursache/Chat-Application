const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
    console.log(`UI Server rulează la http://localhost:${PORT}`);
});
