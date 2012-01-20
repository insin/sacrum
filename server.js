var express = require('express')

var urlresolve = require('urlresolve')

var Sacrum = require('./lib/sacrum')
  , URLConf = Sacrum.URLConf
  , Fragile = require('./fragile/index')

Fragile.init()

var app = express.createServer()

app.use(express.logger())
app.use(express.bodyParser())
app.use(express.static(__dirname));

app.all('*', function(req, res) {
  try {
    var match = URLConf.resolve(req.url)
    var args = match.args
    if (req.method == 'POST') {
      args.push(req.body)
    }
    var response = match.func.apply(null, args)
    if (response instanceof Sacrum.Redirect) {
      console.log('Redirect', response)
      res.redirect(response.path)
    }
    else {
      // Assuming a DOMBuilder HTMLFragment as default return value for now
      var html = response.toString(true)
      // TODO Add information required to hook up event handlers on load
      res.send(html)
    }
  }
  catch (e) {
    if (e instanceof urlresolve.Resolver404) {
      res.send('<h1>404 Not Found</h1>' + e.toDOM(), 404)
    }
    else {
      res.send('<h1>500 Server Error</h1>' + e.toDOM(), 500)
    }
  }
})

app.listen(8000)
console.log('Fragile running on http://127.0.0.1:8000')
