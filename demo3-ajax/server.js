const express = require('express')
const fs = require('fs')
const PORT = 3003
const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

const server = express()
server.get('/', (req, res) => {
  const html = fs.readFileSync('./index.html')
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
}) 

server.get('/api', (req, res) => {
  res.status(200)
  res.set('Content-Type', 'applicatiion/json')
  res.send(data)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})