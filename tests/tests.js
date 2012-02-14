var path = require('path')

var qqunit = require('qqunit')

global.Sacrum = require('../lib/sacrum')

var tests = ['models.js'].map(function(t) { return path.join(__dirname, t) })

qqunit.Runner.run(tests, function(stats) {
  process.exit(stats.failed)
})
