const express = require('express')
const fs = require('fs')
const PORT = 3004

const server = express()
server.get('/vue-render.js', (req, res) => {
  const js = fs.readFileSync('./vue-render.js')
  res.status(200)
  res.send(js)
})

// 这里使用 * 号匹配，并称到 /vue-router.js 下面，这样即使页面路由为 /list/99 或 /counter 也可渲染页面，不会报错
server.get('*', (req, res) => {
  const html = fs.readFileSync('./index.template.html', 'utf-8')
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})