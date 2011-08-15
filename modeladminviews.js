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
    this.display([this.namespace + ':admin:list', 'admin:list']
      , { items: this.storage.all()
        , rowTemplates: [this.namespace + ':admin:listRow', 'admin:listRow']
        }
      , { select: this.select
        , add: this.add
        }
      )
  }

  /**
   * Selects a Model instance and displays its details.
   */
, select: function(e) {
    this.log('select')
    var id = e.target.getAttribute('data-id')
    this.selectedItem = this.storage.get(id)
    this.detail()
  }

  /**
   * Displays the selected Model's details.
   */
, detail: function() {
    this.log('detail')
    this.display([this.namespace + ':admin:detail', 'admin:detail']
      , { item: this.selectedItem }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

  /**
   * Displays the add Form.
   */
, add: function() {
    this.log('add')
    this.display([this.namespace + ':admin:add', 'admin:add']
      , { form: this.form() }
      , { submit: this.createItem
        , cancel: this.list
        }
      )
  }

  /**
   * Validates user input and either creates a new Model instance or redisplays
   * the form with errors.
   */
, createItem: function(e) {
    this.log('createItem')
    e.preventDefault()
    var form = this.form({ data: forms.formData(this.namespace + 'Form') })
    if (form.isValid()) {
      this.storage.add(new this.storage.model(form.cleanedData))
      this.list()
    }
    else {
      replace(this.namespace + 'FormBody', form.asTable())
    }
  }

  /**
   * Displays the edit Form, populated with the selected Model instance's data.
   */
, edit: function() {
    this.log('edit')
    this.display([this.namespace + ':admin:edit', 'admin:edit']
      , { item: this.selectedItem
        , form: this.form({ initial: this.selectedItem })
        }
      , { submit: this.updateItem
        , cancel: this.detail
        }
      )
  }

  /**
   * Validates user input and either updates the selected Model instance or
   * redisplays the form with errors.
   */
, updateItem: function(e) {
    this.log('updateItem')
    e.preventDefault()
    var form = this.form({ data: forms.formData(this.namespace + 'Form')
                         , initial: this.selectedItem
                         })
    if (form.isValid()) {
      extend(this.selectedItem, form.cleanedData)
      this.selectedItem = null
      this.list()
    }
    else {
      replace(this.namespace + 'FormBody', form.asTable())
    }
  }

  /**
   * Displays the Confirm Deletion screen for the selected Model instance.
   */
, preDelete: function() {
    this.log('preDelete')
    this.display([this.namespace + ':admin:delete', 'admin:delete']
      , { item: this.selectedItem }
      , { confirmDelete: this.confirmDelete
        , cancel: this.detail
        }
      )
  }

  /**
   * Deletes the selected Model instance and returns to the list display.
   */
, confirmDelete: function(e) {
    this.log('confirmDelete')
    e.preventDefault()
    this.storage.remove(this.selectedItem)
    this.selectedItem = null
    this.list()
  }

  /**
   * URL patterns which can be mounted at any desired URL using include().
   */
, getURLs: function() {
    return patterns(this
    , url('',            'list',   'admin_' + this.namespace + '_list')
    , url('add/',        'add',    'admin_' + this.namespace + '_add')
    , url(':id/edit/',   'edit',   'admin_' + this.namespace + '_edit')
    , url(':id/delete/', 'delete', 'admin_' + this.namespace + '_delete')
    , url(':id/',        'detail', 'admin_' + this.namespace + '_detail')
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

$template('admin:list'
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
    , SPAN({click: $func('events.add'), 'class': 'button'}
      , 'Add {{ model.name }}'
      )
    )
  )
)

$template('admin:listRow'
, TR({id: '{{ ns }}-{{ item.id }}', 'class': '{{ rowClass }}'}
  , TD({ click: $func('events.select')
       , 'data-id': '{{ item.id }}'
       , 'class': 'link'
       }
    , $block('linkText', '{{ item }}')
    )
  , $block('extraCells')
  )
)

$template('admin:detail'
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
    , SPAN({click: $func('events.edit'), 'class': 'button'}, 'Edit')
    , buttonSpacer()
    , SPAN({click: $func('events.preDelete'), 'class': 'button'}, 'Delete')
    )
  )
)

$template('admin:add'
, FORM({id: '{{ ns }}Form', method: 'POST', action: '/{{ ns }}/add/'}
  , TABLE({'class': 'form detail'}
    , detailColumns({columns: 1})
    , TBODY({id: '{{ ns }}FormBody'}
      , $var('form.asTable')
      )
    )
  , DIV({'class': 'controls'}
    , INPUT({ click: $func('events.submit')
            , 'type': 'submit'
            , value: 'Add {{ model.name }}'
            , 'class': 'add'
            })
    , buttonSpacer()
    , SPAN({click: $func('events.cancel'), 'class': 'button cancel'}, 'Cancel')
    )
  )
)

$template('admin:edit'
, FORM({ id: '{{ ns }}Form'
       , method: 'POST'
       , action: '/{{ ns }}/{{ item.id }}/edit/'
       }
  , TABLE({'class': 'form detail'}
    , detailColumns({columns: 1})
    , TBODY({id: '{{ ns }}FormBody'}
      , $var('form.asTable')
      )
    )
  , DIV({'class': 'controls'}
    , INPUT({ click: $func('events.submit')
            , type: 'submit'
            , value: 'Edit {{ model.name }}'
            , 'class': 'edit'
            })
    , buttonSpacer()
    , SPAN({click: $func('events.cancel'), 'class': 'button cancel'}, 'Cancel')
    )
  )
)

$template('admin:delete'
, H2('Confirm Deletion')
, P('Are you sure you want to delete the {{ model.name }} "{{ item }}"?')
, DIV({'class': 'controls'}
  , INPUT({ click: $func('events.confirmDelete')
          , type: 'submit'
          , value: 'Delete {{ model.name }}'
          , 'class': 'delete'
          })
  , buttonSpacer()
  , SPAN({click: $func('events.cancel'), 'class': 'button cancel'}, 'Cancel')
  )
)

}}()
