const http = require('http')
const fs = require('fs')
const PORT = 3000

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    const html = fs.readFileSync('./index.html', 'utf-8')
    res.statusCode = 200
    res.setHeader('Content-type', 'text/html;')
    res.end(html)
  }
})

server.listen(PORT, () => {
  console.log(`server is runnig at http://localhost:${PORT}`);
})