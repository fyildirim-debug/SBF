const http = require('http');
http.get('http://localhost:80/api/seed-docs', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(data));
}).on('error', (e) => console.error(e.message));
