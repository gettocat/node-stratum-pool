var express = require('express'), app = express(), ejsLocals = require('ejs-locals'), controllers = require('./controllers')

app.engine('ejs', ejsLocals)
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))

app.get('/', controllers.index)
app.get('/worker/:address', controllers.worker)
app.get('/worker/:address/:worker', controllers.workerDetails)
//todo do all another cool stuff, like graphs and stats.

app.listen(3000)

module.exports = app;