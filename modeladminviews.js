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

/**
 * Creates a new object which extends ModelAdminViews, with the given
 * attributes.
 * @param {Object} attrs instance attributes.
 */
ModelAdminViews.extend = function(attrs) {
  console.log('AdminViews.extend', attrs.name)
  var F = function(attrs) {
    ModelAdminViews.call(this, attrs)
  }
  inherits(F, ModelAdminViews)
  var views = new F(attrs)
  // Push the new views to the base Views constructor so they will have their
  // init method called by Views.initAll.
  Views._created.push(views)
  return views
}

// ModelAdminViews default implementation
extend(ModelAdminViews.prototype, {
  /**
   * Overrides render to pass in template variables which are required for CRUD
   * templates.
   */
  render: function(templateName, context, events) {
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
    this.log('init')
    if (this.elementId) {
      this.el = document.getElementById(this.elementId)
    }
  }

  /**
   * Displays a list of Model instances.
   */
, list: function() {
    this.log('list')

    // HACK
    // This is a temporary hack until DOMBuilder's template loader is updated to
    // be able to override templates by specifying a same-named template in a
    // different context - these views shouldn't really know anything about the
    // contents of fragile.js.
    replace('admin-header', this.render('admin:header'
      , { modelName: this.storage.model._meta.namePlural
        , adminURL: reverse('admin_index')
        , listURL: reverse(format('admin_%s_list', this.namespace))
        }
      ))

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
    this.log('detail')
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
    console.log(arguments)
    this.log('add')
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
    this.log('edit')
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
    this.log('preDelete')
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

function detailColumns(options) {
  options = extend({width: '110px', columns: 2}, options || {})
  var cols = []
  for (var i = 0; i < options.columns; i++) {
    cols.push(template.COL({width: options.width}))
    cols.push(template.COL())
  }
  return template.COLGROUP(cols)
}

function buttonSpacer(text) {
  return template.SPAN({'class': 'spacer'}, text || ' or ')
}

$template('admin:base'
, DIV({'id': 'admin-header'}
  , $block('breadCrumbs')
  )
, DIV({'id': 'admin-content'}
  , $block('contents')
  )
)

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
