// ============================================================= Admin Views ===

/**
 * Views which use created ModelAdminView instances to display an admin section.
 */
var AdminViews = Views.extend({
  name: 'AdminViews'

, modelViews: []

, init: function() {
    this.debug('init')
    this.el = document.getElementById('admin')

    // Automatically hook ap all ModelAdminViews which have been created
    for (var i = 0, l = Views._created.length; i < l; i++) {
      if (Views._created[i] instanceof ModelAdminViews) {
        var views = Views._created[i]
        // Give all ModelAdminViews the same admin element to display content in
        views.el = this.el
        this.modelViews.push(views)
      }
    }
  }

  /**
   * Lists models for which ModelAdminViews have been created.
   */
, index: function() {
    this.debug('index')
    var models = []
    for (var i = 0, l = this.modelViews.length, mv; i < l; i++) {
      var mv = this.modelViews[i]
      models.push({
        name: mv.storage.model._meta.namePlural
      , listURL: reverse(format('admin_%s_list', mv.namespace))
      })
    }
    this.display('admin:index', {models: models})
  }

, getURLs: function() {
    var urlPatterns = patterns(this
      , url('', 'index', 'admin_index')
      )
    for (var i = 0, l = this.modelViews.length; i < l; i++) {
      var mv = this.modelViews[i]
      urlPatterns = urlPatterns.concat(patterns(null
        , url(format('%s/', mv.namespace), mv.getURLs())
        ))
    }
    return urlPatterns
  }
})

// --------------------------------------------------------- ModelAdminViews ---

/**
 * Views which take care of some of the repetitive work involved in creating
 * basic CRUD functionality for a particular Model. This specialised version of
 * Views expects to find the following instance attributes:
 *
 *    namespace
 *       Unique namespace for the instance - used in base CRUD templates to
 *       ensure created element ids are unique and when looking up templates
 *       which override the base templates.
 *
 *    elementId (Optional)
 *       The id of the elements in which content should be displayed, if
 *       appropriate.
 *
 *    storage
 *       A Storage object used to create, retrieve, update and delete Model
 *       instances.
 *
 *    form
 *       A Form used to take and validate user input when creating and updating
 *       Model instances.
 *
 * @constructor
 * @param {Object} attrs instance attributes.
 */
function ModelAdminViews(attrs) {
  Views.call(this, attrs)
}
inherits(ModelAdminViews, Views)
ModelAdminViews.extend = Views.extend

// ModelAdminViews default implementation
extend(ModelAdminViews.prototype, {
  name: 'ModelAdminViews'

  /**
   * Overrides render to pass in template variables which are required for CRUD
   * templates.
   */
, render: function(templateName, context, events) {
    extend(context, {
      ns: this.namespace
    , model: this.storage.model._meta
    })
    return Views.prototype.render.call(this, templateName, context, events)
  }

  /**
   * Finds the content element for this ModelAdminViews and displays a list of
   * Model instances by default.
   */
, init: function() {
    this.debug('init')
    if (this.elementId) {
      this.el = document.getElementById(this.elementId)
    }
  }

  /**
   * Displays a list of Model instances.
   */
, list: function() {
    this.debug('list')
    var items = this.storage.all()
    this.display([this.namespace + ':admin:list', 'admin:list']
      , { items: items
        , rowTemplates: [this.namespace + ':admin:listRow', 'admin:listRow']
        , addURL: reverse(format('admin_%s_add', this.namespace))
        }
      )
  }

  /**
   * Displays the selected Model's details.
   */
, detail: function(id) {
    this.debug('detail', id)
    item = this.storage.get(id)
    this.display([this.namespace + ':admin:detail', 'admin:detail']
      , { item: item
        , editURL: reverse(format('admin_%s_edit', this.namespace), [id])
        , deleteURL: reverse(format('admin_%s_delete', this.namespace), [id])
        }
      )
  }

  /**
   * Displays the add Form, or validates user input and creates a new Model
   * instance or redisplays the form with errorsif form data was given.
   */
, add: function(data) {
    this.debug('add', data)
    var form
    if (data) {
      form = this.form({data: data})
      if (form.isValid()) {
        this.storage.add(new this.storage.model(form.cleanedData))
        this.list()
      }
      else {
        replace(format('%sFormBody', this.namespace), form.asTable())
      }
    }
    else {
      this.display([this.namespace + ':admin:add', 'admin:add']
        , { form: this.form()
          , submitURL: reverse(format('admin_%s_add', this.namespace))
          , cancelURL: reverse(format('admin_%s_list', this.namespace))
          }
        )
    }
  }

  /**
   * Displays the edit Form, populated with the selected Model instance's data,
   * or validates user input and either updates the selected Model instance or
   * redisplays the form with errors if form data was given.
   */
, edit: function(id, data) {
    this.debug('edit', id, data)
    var item = this.storage.get(id)
      , form
    if (data) {
      form = this.form({data: data, initial: item})
      if (form.isValid()) {
        extend(item, form.cleanedData)
        this.list()
      }
      else {
        replace(format('%sFormBody', this.namespace), form.asTable())
      }
    }
    else {
      this.display([this.namespace + ':admin:edit', 'admin:edit']
        , { item: item
          , form: this.form({initial: item})
          , submitURL: reverse(format('admin_%s_edit', this.namespace), [id])
          , cancelURL: reverse(format('admin_%s_detail', this.namespace), [id])
          }
        )
    }
  }

  /**
   * Displays the Confirm Deletion screen for the selected Model instance, or
   * performs deletion if form data was given.
   */
, delete_: function(id, data) {
    this.debug('delete_', id, data)
    var item = this.storage.get(id)
    if (data) {
      this.storage.remove(item)
      this.list()
    }
    else {
      this.display([this.namespace + ':admin:delete', 'admin:delete']
        , { item: item
          , submitURL: reverse(format('admin_%s_delete', this.namespace), [id])
          , cancelURL: reverse(format('admin_%s_detail', this.namespace), [id])
          }
        )
    }
  }

  /**
   * URL patterns which can be mounted at any desired URL using include().
   */
, getURLs: function() {
    return patterns(this
    , url('',            'list',    'admin_' + this.namespace + '_list')
    , url('add/',        'add',     'admin_' + this.namespace + '_add')
    , url(':id/edit/',   'edit',    'admin_' + this.namespace + '_edit')
    , url(':id/delete/', 'delete_', 'admin_' + this.namespace + '_delete')
    , url(':id/',        'detail',  'admin_' + this.namespace + '_detail')
    )
  }
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
        , ' : '
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
