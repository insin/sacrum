!function(__global__, server) {

var DOMBuilder = (server ? require('DOMBuilder') : __global__.DOMBuilder)
  , Sacrum = (server ? require('./sacrum') : __global__.Sacrum)
  , extend = Sacrum.util.extend, format = Sacrum.util.format
  , Views = Sacrum.Views
  , patterns = Sacrum.patterns, url = Sacrum.url, reverse = Sacrum.reverse

// ============================================================= Admin Views ===

/**
 * Views which use created ModelAdminView instances to display an admin section.
 */
var AdminViews = new Views({
  name: 'AdminViews'
, elementId: 'admin'

  /** ModelAdminViews which have been registered for display. */
, modelViews: []

, init: function() {
    this.log('init')
    if (!server) {
      this.el = document.getElementById(this.elementId)
    }

    // Hook ap all ModelAdminViews which have been created
    for (var i = 0, l = ModelAdminViews.instances.length; i < l; i++) {
      var mv = ModelAdminViews.instances[i]
      // Give all instances our element to display their content in
      mv.el = this.el
      this.modelViews.push(mv)
    }
  }

  /**
   * Lists registered ModelAdminViews.
   */
, index: function() {
    this.log('index')
    var models = []
    for (var i = 0, l = this.modelViews.length, mv; i < l; i++) {
      var mv = this.modelViews[i]
      models.push({
        name: mv.storage.model._meta.namePlural
      , listURL: reverse(mv.urlName('list'))
      })
    }
    return this.display('admin:index', {models: models})
  }

  /**
   * Creates a URL pattern for the index view and roots each ModelAdminViews
   * instance under a URL based on its namespace.
   */
, getURLs: function() {
    var urlPatterns = patterns(this
      , url('', 'index', 'admin_index')
      )
    for (var i = 0, l = this.modelViews.length; i < l; i++) {
      var mv = this.modelViews[i]
      urlPatterns.push( url(format('%s/', mv.namespace), mv.getURLs()) )
    }
    return urlPatterns
  }
})

// --------------------------------------------------------- ModelAdminViews ---

/**
 * Views which take care of some of the repetitive work involved in creating
 * basic CRUD functionality for a particular Model. This specialised version of
 * Views expects to find the following instance properties:
 *
 *    namespace
 *       Unique namespace for the instance - used in base CRUD templates to
 *       ensure created element ids are unique and when looking up templates
 *       which override the base templates.
 *
 *    storage
 *       A Storage object used to create, retrieve, update and delete Model
 *       instances.
 *
 *    form
 *       A Form used to take and validate user input when creating and updating
 *       Model instances.
 *
 *    elementId (Optional)
 *       The id of the elements in which content should be displayed, if
 *       appropriate.
 *
 * @constructor
 * @param {Object} props instance properties.
 */
var ModelAdminViews = Views.extend({
  constructor: function(props) {
    ModelAdminViews.instances.push(this)
    Views.call(this, props)
  }

, name: 'ModelAdminViews'

  /**
   * Overrides render to pass in template variables which are required for Admin
   * templates.
   */
, render: function(templateName, context, events) {
    extend(context, {
      ns: this.namespace
    , model: this.storage.model._meta
    })
    return ModelAdminViews.__super__.render.call(this, templateName, context, events)
  }

  /**
   * Finds the content element for this ModelAdminViews and displays a list of
   * Model instances by default.
   */
, init: function() {
    this.log('init')
    if (!server && this.elementId) {
      this.el = document.getElementById(this.elementId)
    }
  }

  /**
   * Constructs a URL name based on this ModenAdminViews' namespace.
   */
, urlName: function(name) {
    return 'admin_' + this.namespace + '_' + name
  }

  /**
   * Displays a list of Model instances.
   */
, list: function() {
    this.log('list')
    var items = this.storage.all()
    return this.display([this.namespace + ':admin:list', 'admin:list']
      , { items: items
        , rowTemplates: [this.namespace + ':admin:listRow', 'admin:listRow']
        , addURL: reverse(this.urlName('add'))
        }
      )
  }

  /**
   * Displays the selected Model's details.
   */
, detail: function(id) {
    this.log('detail', id)
    item = this.storage.get(id)
    return this.display([this.namespace + ':admin:detail', 'admin:detail']
      , { item: item
        , editURL: reverse(this.urlName('edit'), [id])
        , deleteURL: reverse(this.urlName('delete'), [id])
        }
      )
  }

  /**
   * Displays the add Form, or validates user input and creates a new Model
   * instance or redisplays the form with errorsif form data was given.
   */
, add: function(data) {
    this.log('add', data)
    var form
    if (data) {
      form = this.form({data: data})
      if (form.isValid()) {
        this.storage.add(new this.storage.model(form.cleanedData))
        // TODO Redirect
        return this.list()
      }
      else if (!server) {
        // Look up the <tbody> containing the form rows and replace its contents
        // with the rendered invalid form.
        return this.replaceContents(format('%sFormBody', this.namespace),
                                    form.asTable())
      }
      // If we're on the server, fall through to rendering the complete template
    }
    else {
      form = this.form()
    }
    return this.display([this.namespace + ':admin:add', 'admin:add']
      , { form: form
        , submitURL: reverse(this.urlName('add'))
        , cancelURL: reverse(this.urlName('list'))
        }
      )
  }

  /**
   * Displays the edit Form, populated with the selected Model instance's data,
   * or validates user input and either updates the selected Model instance or
   * redisplays the form with errors if form data was given.
   */
, edit: function(id, data) {
    this.log('edit', id, data)
    var item = this.storage.get(id)
      , form
    if (data) {
      form = this.form({data: data, initial: item})
      if (form.isValid()) {
        extend(item, form.cleanedData)
        // TODO Redirect
        return this.list()
      }
      else if (!server) {
        // Look up the <tbody> containing the form rows and replace its contents
        // with the rendered invalid form.
        return this.replaceContents(format('%sFormBody', this.namespace),
                                    form.asTable())
      }
      // If we're on the server, fall through to rendering the complete template
    }
    else {
      form = this.form({initial: item})
    }
    return this.display([this.namespace + ':admin:edit', 'admin:edit']
      , { item: item
        , form: form
        , submitURL: reverse(this.urlName('edit'), [id])
        , cancelURL: reverse(this.urlName('detail'), [id])
        }
      )
  }

  /**
   * Displays the Confirm Deletion screen for the selected Model instance, or
   * performs deletion if form data was given.
   */
, delete_: function(id, data) {
    this.log('delete_', id, data)
    var item = this.storage.get(id)
    if (data) {
      this.storage.remove(item)
      // TODO Redirect
      return this.list()
    }
    else {
      return this.display([this.namespace + ':admin:delete', 'admin:delete']
        , { item: item
          , submitURL: reverse(this.urlName('delete'), [id])
          , cancelURL: reverse(this.urlName('detail'), [id])
          }
        )
    }
  }

  /**
   * Creates URL patterns which can be rooted at any desired URL.
   */
, getURLs: function() {
    return patterns(this
    , url('',            'list',    this.urlName('list'))
    , url('add/',        'add',     this.urlName('add'))
    , url(':id/edit/',   'edit',    this.urlName('edit'))
    , url(':id/delete/', 'delete_', this.urlName('delete'))
    , url(':id/',        'detail',  this.urlName('detail'))
    )
  }
}, {
  /** Constructor property to track created instances. */
  instances: []
})

// =============================================================== Templates ===

!function() { with (DOMBuilder.template) {

var template = DOMBuilder.template

$template('admin:base'
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

$template({name: 'admin:index', extend: 'admin:base'}, $block('contents'
, TABLE({'class': 'list'}
  , THEAD(TR(
      TH('Models')
    ))
  , TBODY($for('model in models'
    , $cycle(['odd', 'even'], {as: 'rowClass', silent: true})
    , TR({'class': '{{ rowClass }}'}
      , TD(A({href: '{{ model.listURL }}', click: $resolve},
          '{{ model.name }}'
        ))
      )
    ))
  )
))

// ------------------------------------------------ ModelAdminView Templates ---

/**
 * Creates a <colgroup> to ensure detail column headers are a particular width.
 */
function detailColumns(options) {
  options = extend({width: '110px', columns: 2}, options || {})
  var cols = []
  for (var i = 0; i < options.columns; i++) {
    cols.push(template.COL({width: options.width}))
    cols.push(template.COL())
  }
  return template.COLGROUP(cols)
}

/**
 * Creates a <span> to space buttons out with some text.
 */
function buttonSpacer(text) {
  return template.SPAN({'class': 'spacer'}, text || ' or ')
}

$template({name: 'admin:list', extend: 'admin:base'}, $block('contents'
, $block('itemTable'
  , TABLE({'class': 'list'}
    , THEAD(TR(
        $block('headers'
        , TH('{{ model.name }}')
        )
      ))
    , TBODY($for('item in items'
      , $cycle(['odd', 'even'], {as: 'rowClass', silent: true})
      , $include($var('rowTemplates'))
      ))
    )
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , A({href: '{{ addURL }}', 'class': 'button', click: $resolve}
      , 'Add {{ model.name }}'
      )
    )
  )
))

$template('admin:listRow'
, TR({id: '{{ ns }}-{{ item.id }}', 'class': '{{ rowClass }}'}
  , $url('admin_{{ ns }}_detail', ['{{ item.id }}'], {as: 'detailURL'})
  , TD(A({href: '{{ detailURL }}', click: $resolve}
    , $block('linkText', '{{ item }}')
    ))
  , $block('extraCells')
  )
)

$template({name: 'admin:detail', extend: 'admin:base'}, $block('contents'
, $block('top')
, $block('detail'
  , TABLE({'class': 'detail'}
    , detailColumns()
    , TBODY($block('detailRows'
      , TR(
          TH('{{ model.name }}:')
        , TD('{{ item }}')
        )
      ))
    )
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , A({href: '{{ editURL }}', click: $resolve, 'class': 'button'}, 'Edit')
    , buttonSpacer()
    , A({href: '{{ deleteURL }}', click: $resolve, 'class': 'button'}, 'Delete')
    )
  )
))

$template({name: 'admin:add', extend: 'admin:base'}, $block('contents'
, FORM({id: '{{ ns }}Form', method: 'POST', action: '{{ submitURL }}', submit: $resolve}
  , TABLE({'class': 'form detail'}
    , detailColumns({columns: 1})
    , TBODY({id: '{{ ns }}FormBody'}, $block('formRows'
      , $var('form.asTable')
      ))
    )
  , DIV({'class': 'controls'}
    , INPUT({'type': 'submit', value: 'Add {{ model.name }}', 'class': 'add'})
    , buttonSpacer()
    , A({href: '{{ cancelURL }}', click: $resolve, 'class': 'button cancel'}, 'Cancel')
    )
  )
))

$template({name: 'admin:edit', extend: 'admin:base'}, $block('contents'
, FORM({ id: '{{ ns }}Form', method: 'POST', action: '{{ submitURL }}', submit: $resolve}
  , TABLE({'class': 'form detail'}
    , detailColumns({columns: 1})
    , TBODY({id: '{{ ns }}FormBody'}, $block('formRows'
      , $var('form.asTable')
      ))
    )
  , DIV({'class': 'controls'}
    , INPUT({type: 'submit', value: 'Edit {{ model.name }}', 'class': 'edit'})
    , buttonSpacer()
    , A({href: '{{ cancelURL }}', click: $resolve, 'class': 'button cancel'}, 'Cancel')
    )
  )
))

$template({name: 'admin:delete', extend: 'admin:base'}, $block('contents'
, H2('Confirm Deletion')
, P('Are you sure you want to delete the {{ model.name }} "{{ item }}"?')
, DIV({'class': 'controls'}
  , FORM({action: '{{ submitURL }}', method: 'POST', submit: $resolve}
    , DIV(
        INPUT({type: 'submit', value: 'Delete {{ model.name }}', 'class': 'delete'})
      , buttonSpacer()
      , A({href: '{{ cancelURL }}', click: $resolve, 'class': 'button cancel'}, 'Cancel')
      )
    )
  )
))

}}()

// ================================================================== Export ===

Sacrum.Admin = {
  AdminViews: AdminViews
, ModelAdminViews: ModelAdminViews
}

}(this, !!(typeof module != 'undefined' && module.exports))
