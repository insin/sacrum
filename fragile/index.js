// Server-specific code for Fragile

// Ensure Fragile is loaded first so the base admin template is defined
var Sacrum = require('../sacrum')
  , Fragile = require('./fragile')
  , DOMBuilder = require('DOMBuilder')

!function() { with (DOMBuilder.template) {

// Define a full-page base template
$template('fragile:base'
, $doctype(5)
, HTML(
    HEAD(
      TITLE('Fragile')
    , LINK({rel: 'stylesheet', type: 'text/css', href: '/fragile/fragile.css'})
    , SCRIPT({src: '/lib/DOMBuilder-2.1.0alpha1.js'})
    , SCRIPT({src: '/lib/newforms-0.0.4alpha1.js'})
    , SCRIPT({src: '/sacrum.js'})
    , SCRIPT({src: '/admin.js'})
    // You are now entering the Meta Zone
    , SCRIPT({src: '/fragile/fragile.js'})
    )
  , BODY(
      H1('Fragile')
    , P({ id: 'about'
        , innerHTML:
            'Fragile is the example app for <a href="https://github.com/insin/sacrum">Sacrum</a>, ' +
            'which provides components and conventions for writing single-page JavaScript apps ' +
            'which also run on Node.js for almost-free as good ol\' forms \'n links webapps.')
        })
    , P({ id: 'info'
        , innerHTML:
            'This section demonstrates use of reusable Admin views written with Sacrum, which ' +
            'makes use of <a href="https://github.com/insin/DOMBuilder">DOMBuilder</a> for ' +
            'templating and <a href="https://github.com/insin/newforms">newforms</a> for form ' +
            'display and validation.'
        })
    , $block('fullContents')
    , DIV({id: 'forkme'}
      , A({href: 'https://github.com/insin/sacrum/'}
        , IMG({ style: 'position: absolute; top: 0; right: 0; border: 0;'
              , src: '/fragile/forkme.png'
              , alt: 'Fork me on GitHub'
              })
        )
      )
    )
  )
)

// Override the base admin template to use the full-page base template
$template({name: 'admin:base', extend: 'fragile:base'}
, $block('fullContents'
  , DIV({'id': 'admin'}
    , DIV({'id': 'admin-header'}
      , $block('breadCrumbs'
        , H2(
            A({href: $url('admin_index'), click: $resolve}, 'Admin')
          , $if('ns'
            , ' \u2192 '
            , A({href: $url('admin_{{ ns }}_list'), click: $resolve}, '{{ model.namePlural }}')
            )
          )
        )
      )
    , DIV({'id': 'admin-content'}
      , $block('contents')
      )
    )
  )
)

}}()

module.exports = Fragile
