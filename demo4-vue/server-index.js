const express = require('express')
const fs = require('fs')
const PORT = 3004

const server = express()
server.get('/', (req, res) => {
  const html = fs.readFileSync('./index.html', 'utf-8')
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})