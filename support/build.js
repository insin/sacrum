var path = require('path')

var buildumb = require('buildumb')

buildumb.build({
  root: path.normalize(path.join(__dirname, '..'))
, modules: {
  // isomorph
    'node_modules/isomorph/is.js'          : ['./is', 'isomorph/is']
  , 'node_modules/isomorph/array.js'       : ['./array', 'isomorph/array']
  , 'node_modules/isomorph/format.js'      : ['./format', 'isomorph/format']
  , 'node_modules/isomorph/func.js'        : ['./func', 'isomorph/func']
  , 'node_modules/isomorph/object.js'      : ['./object', 'isomorph/object']
  , 'node_modules/isomorph/re.js'          : ['./re', 'isomorph/re']
  , 'node_modules/isomorph/querystring.js' : ['./querystring', 'isomorph/querystring']
  , 'node_modules/isomorph/copy.js'        : ['./copy', 'isomorph/copy']
  , 'node_modules/isomorph/time.js'        : ['./time', 'isomorph/time']
  , 'node_modules/isomorph/index.js'       : 'isomorph'
  // concur
  , 'node_modules/Concur/lib/concur.js' : 'Concur'
  // urlresolve
  , 'node_modules/urlresolve/lib/urlresolve.js' : 'urlresolve'
  // DOMBuilder
  , 'node_modules/DOMBuilder/lib/dombuilder/core.js'         : ['./dombuilder/core', './core']
  , 'node_modules/DOMBuilder/lib/dombuilder/dom.js'          : './dombuilder/dom'
  , 'node_modules/DOMBuilder/lib/dombuilder/html.js'         : './dombuilder/html'
  , 'node_modules/DOMBuilder/lib/dombuilder/template.js'     : './dombuilder/template'
  , 'node_modules/DOMBuilder/support/DOMBuilder.template.js' : 'DOMBuilder'
  // validators + deps
  , 'node_modules/newforms/node_modules/validators/node_modules/punycode/punycode.js' : 'punycode'
  , 'node_modules/newforms/node_modules/validators/lib/errors.js'                     : './errors'
  , 'node_modules/newforms/node_modules/validators/lib/ipv6.js'                       : './ipv6'
  , 'node_modules/newforms/node_modules/validators/lib/validators.js'                 : ['./validators', 'validators']
  // newforms
  , 'node_modules/newforms/lib/util.js'       : './util'
  , 'node_modules/newforms/lib/widgets.js'    : './widgets'
  , 'node_modules/newforms/lib/fields.js'     : './fields'
  , 'node_modules/newforms/lib/forms.js'      : './forms'
  , 'node_modules/newforms/lib/formsets.js'   : './formsets'
  , 'node_modules/newforms/lib/models.js'     : './models'
  , 'node_modules/newforms/lib/newforms.js'   : 'newforms'
  // sacrum
  , 'lib/sacrum/sacrum.js' : ['./sacrum/sacrum', './sacrum']
  , 'lib/sacrum/admin.js'  : './sacrum/admin'
  , 'lib/sacrum.js'        : 'sacrum'
  }
, exports: {
    'Sacrum': 'sacrum'
  }
, output: 'sacrum.js'
, compress: 'sacrum.min.js'
})
