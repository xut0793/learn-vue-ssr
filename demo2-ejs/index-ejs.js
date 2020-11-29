const express = require('express')
const fs = require('fs')
const ejs = require('ejs')
const PORT = 3001

const server = express()
server.get('/', (req, res) => {
  // fs.readFile 如果未指定编码，则在回调data返回原始缓冲区，而ejs.redner期望一个字符串。
  const template = fs.readFileSync('./index-template.ejs', 'utf-8') 

  const data = {
    title: 'demo2: 服务器使用 ejs 渲染 html 返回',
    list: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  }
  const html = ejs.render(template, data)

  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})