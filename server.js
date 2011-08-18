var express = require('express')
  , Sacrum = require('./sacrum')
  , Fragile = require('./fragile')

Fragile.init()

var app = express.createServer()

app.use(express.logger())
app.use(express.bodyParser())
app.use(express.static(__dirname));

app.all('*', function(req, res) {
  try {
    var match = Sacrum.resolve(req.url)
    var args = match.args
    if (req.method == 'POST') {
      args.push(req.body)
    }
    var el = match.func.apply(null, args)
    var html = el.toString(true)
    // TODO Add information required to hook up event handlers on load
    res.send(html)
  }
  catch (e) {
    if (e instanceof Sacrum.Resolver404) {
      res.send('<h1>404 Not Found</h1>' + e, 404)
    }
    else {
      res.send('<h1>500 Server Error</h1>' + e, 500)
    }
  }
})

app.listen(8000)
console.log('Fragile running on http://127.0.0.1:8000')
