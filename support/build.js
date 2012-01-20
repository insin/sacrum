var path = require('path')

var buildumb = require('buildumb')

buildumb.build({
  root: path.normalize(path.join(__dirname, '..'))
, modules: {
    'node_modules/isomorph/lib/is.js'           : ['./is', 'isomorph/lib/is']
  , 'node_modules/isomorph/lib/array.js'        : ['./array', 'isomorph/lib/array']
  , 'node_modules/isomorph/lib/format.js'       : ['./format', 'isomorph/lib/format']
  , 'node_modules/isomorph/lib/func.js'         : ['./func', 'isomorph/lib/func']
  , 'node_modules/isomorph/lib/object.js'       : ['./object', 'isomorph/lib/object']
  , 'node_modules/isomorph/lib/re.js'           : ['./re', 'isomorph/lib/re']
  , 'node_modules/isomorph/lib/querystring.js'  : ['./querystring', 'isomorph/lib/querystring']
  , 'node_modules/isomorph/lib/isomorph.js'     : 'isomorph'
  , 'node_modules/Concur/lib/concur.js'         : 'Concur'
  , 'node_modules/urlresolve/lib/urlresolve.js' : 'urlresolve'
  , 'lib/sacrum/sacrum.js'                      : ['./sacrum/sacrum', './sacrum']
  , 'lib/sacrum/admin.js'                       : './sacrum/admin'
  , 'lib/sacrum.js'                             : ['sacrum', '../lib/sacrum']
  , 'fragile/fragile.js'                        : 'fragile'
  }
, exports: {
    'Sacrum': 'sacrum'
  , 'Fragile': 'fragile'
  }
, output: 'fragile.js'
, compress: 'fragile.min.js'
})
