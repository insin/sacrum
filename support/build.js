var path = require('path')

var buildumb = require('buildumb')

buildumb.build({
  root: path.normalize(path.join(__dirname, '..'))
, modules: {
  // isomorph
    'node_modules/isomorph/lib/is.js'           : ['./is', 'isomorph/lib/is']
  , 'node_modules/isomorph/lib/array.js'        : ['./array', 'isomorph/lib/array']
  , 'node_modules/isomorph/lib/format.js'       : ['./format', 'isomorph/lib/format']
  , 'node_modules/isomorph/lib/func.js'         : ['./func', 'isomorph/lib/func']
  , 'node_modules/isomorph/lib/object.js'       : ['./object', 'isomorph/lib/object']
  , 'node_modules/isomorph/lib/re.js'           : ['./re', 'isomorph/lib/re']
  , 'node_modules/isomorph/lib/querystring.js'  : ['./querystring', 'isomorph/lib/querystring']
  , 'node_modules/isomorph/lib/copy.js'         : ['./copy', 'isomorph/lib/copy']
  , 'node_modules/isomorph/lib/time.js'         : ['./time', 'isomorph/lib/time']
  , 'node_modules/isomorph/lib/isomorph.js'     : 'isomorph'
  // concur
  , 'node_modules/Concur/lib/concur.js'         : 'Concur'
  // urlresolve
  , 'node_modules/urlresolve/lib/urlresolve.js' : 'urlresolve'
  // DOMBuilder
  , 'node_modules/DOMBuilder/lib/dombuilder/core.js'         : ['./dombuilder/core', './core']
  , 'node_modules/DOMBuilder/lib/dombuilder/dom.js'          : './dombuilder/dom'
  , 'node_modules/DOMBuilder/lib/dombuilder/html.js'         : './dombuilder/html'
  , 'node_modules/DOMBuilder/lib/dombuilder/template.js'     : './dombuilder/template'
  , 'node_modules/DOMBuilder/support/DOMBuilder.template.js' : 'DOMBuilder'
  // newforms
  , 'node_modules/newforms/lib/util.js'       : './util'
  , 'node_modules/newforms/lib/validators.js' : './validators'
  , 'node_modules/newforms/lib/widgets.js'    : './widgets'
  , 'node_modules/newforms/lib/fields.js'     : './fields'
  , 'node_modules/newforms/lib/forms.js'      : './forms'
  , 'node_modules/newforms/lib/formsets.js'   : './formsets'
  , 'node_modules/newforms/lib/models.js'     : './models'
  , 'node_modules/newforms/lib/newforms.js'   : 'newforms'
  // sacrum
  , 'lib/sacrum/sacrum.js'                      : ['./sacrum/sacrum', './sacrum']
  , 'lib/sacrum/admin.js'                       : './sacrum/admin'
  , 'lib/sacrum.js'                             : ['sacrum', '../lib/sacrum']
  // fragile
  , 'fragile/fragile.js'                        : 'fragile'
  }
, exports: {
    'Sacrum': 'sacrum'
  , 'Fragile': 'fragile'
  }
, output: 'fragile.js'
, compress: 'fragile.min.js'
})
