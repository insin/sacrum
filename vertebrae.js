// =============================================================== Utilities ===

/**
 * Replaces the contents of an element.
 */
function replace(el, content) {
  if (typeof el == 'string') {
    el = document.getElementById(el)
  }
  el.innerHTML = ''
  if (content instanceof Array) {
    content = DOMBuilder.fragment(content)
  }
  el.appendChild(content)
}

/**
 * Binds a function with a calling context and (optionally) some curried arguments.
 */
function bind(fn, ctx) {
  var curried = null
  if (arguments.length > 2) {
    curried = Array.prototype.slice.call(arguments, 2)
  }
  var f = function() {
    if (curried) {
      return fn.apply(ctx, curried.concat(Array.prototype.slice.call(arguments)))
    }
    return fn.apply(ctx, arguments)
  }
  f.boundTo = ctx
  return f
}

/**
 * Inherits another constructor's prototype without having to construct.
 */
function inherits(child, parent) {
  var F = function() {}
  F.prototype = parent.prototype
  child.prototype = new F()
  child.prototype.constructor = child
  return child
}

/**
 * Copies properties from one object to another.
 */
function extend(dest, src) {
  for (var prop in src) {
    dest[prop] = src[prop]
  }
  return dest
}

// ================================================================== Models ===

/**
 * Base constructor for models - doesn't actually do much yet.
 */
function Model(attrs) {
  extend(this, attrs)
}

// ===================================================== Storage / Retrieval ===

/**
 * Stores and retrieves instances of the given model.
 */
function Storage(model) {
  this._store = {}
  this._idSeed = 1
  this.model = model
}

Storage.prototype.query = function() {
  return new Query(this)
}

/**
 * Generates a new id for a model instance and stores it.
 */
Storage.prototype.add = function(instance) {
  instance.id = this._idSeed++
  this._store[instance.id] = instance
  return instance
}

/**
 * Retrieves all model instances.
 */
Storage.prototype.all = function() {
  var a = []
  for (var id in this._store) {
    a.push(this._store[id])
  }
  return a
}

/**
 * Retrieves the model instance with the given id, or null if it doesn't exist.
 */
Storage.prototype.get = function(id) {
  return this._store[id] || null
}

/**
 * Removes the given model instance.
 */
Storage.prototype.remove = function(instance) {
  delete this._store[instance.id]
}

/**
 * A representation of a query on a Storage object, which can be used to obtain
 * query results or perform further retrieval.
 *
 * We need an object which has access to query results and a link to the means
 * of looking stuff up to hook up with newforms' ModelChoiceField.
 */
function Query(storage) {
  this.storage = storage
}

/**
 * Fetches query results - for now, always returns all instances in the storage.
 */
Query.prototype.__iter__ = function() {
  return this.storage.all()
}

Query.prototype.get = function(id) {
  return this.storage.get(id)
}

// =================================================================== Forms ===

// Let newforms know what our cobbled-together storage and retrieval looks like
extend(forms.ModelInterface, {
  throwsIfNotFound: false
, notFoundValue: null
, prepareValue: function(instance) {
    return instance.id
  }
, findById: function(modelQuery, id) {
    return modelQuery.get(id)
  }
})

// =================================================================== Views ===

/**
 * Base constructor for objects containing functions which implement display and
 * control logic. Generally, views are instantiated using Views.create - you
 * shouldn't need to use this contructor directly unless you're writing a
 * specialised base constructor, such as CrudViews.
 *
 * The base Views object provides functionality which expects the following
 * instance attributes:
 *
 * name (required)
 *    Name for the collection of view functions - for example, if you have a
 *    bunch of view functions which handle listing and editing Vehicle objects,
 *    a logical name would be 'VehicleViews'
 *
 * el (optinal)
 *    The element which contains the Views' contents, if appropriate.
 *
 * These don't have to be set at construction time - you could defer setting
 * them until the Views' init() method is called, if appropriate.
 *
 * @constructor
 * @param {Object} attrs instance attributes.
 */
function Views(attrs) {
  extend(this, attrs)
}

/**
 * Tracks views which have been created.
 */
Views._created = []

/**
 * Calls the init() function on each created Views object which has one.
 */
Views.initAll = function() {
  for (var i = 0, l = Views._created.length; i < l; i++) {
    if (typeof Views._created[i].init == 'function') {
      Views._created[i].init()
    }
  }
}

/**
 * Creates a new object which extends Views, with the given attributes.
 * @param {Object} attrs instance attributes.
 */
Views.create = function(attrs) {
  console.log('Views.create', attrs.name)
  var F = function(attrs) {
    Views.call(this, attrs)
  }
  inherits(F, Views)
  var views = new F(attrs)
  Views._created.push(views)
  return views
}

/**
 * Renders a template with the given context data.
 * @param {string} templateName the name of a template to render.
 * @param {Object} context template rendering context data.
 * @param {Object.<string, Function>=} named event handling functions - if
 *     provided, these functions will be bound to this Views instance and
 *     addded to the template context as an 'events' property.
 */
Views.prototype.render = function(templateName, context, events) {
  if (events) {
    for (var e in events) {
      if (events[e] == null) {
        this.warn('Event ' + e + ', for use with ' + templateName +
                  ', is ' + events[e] + '.')
      }
      else {
        events[e] = bind(events[e], this)
      }
    }
    context.events = events
  }
  return DOMBuilder.template.renderTemplate(templateName, context)
}

/**
 * Renders a template and displays the results in this Views' element.
 */
Views.prototype.display = function(templateName, context, events) {
  replace(this.el, this.render(templateName, context, events))
}

/**
 * Logs a message with this Views' name.
 */
Views.prototype.log = function(message) {
  console.log(this.name, message)
}

/**
 * Logs a message with this Views' name.
 */
Views.prototype.warn = function(message) {
  console.warn(this.name, message)
}

// --------------------------------------------------------------- CrudViews ---

/**
 * Views which take care of some of the repetitive work involved in creating
 * basic CRUD functionality. This specialised version of Views expects to find
 * the following instance attributes:
 *
 *    namespace
 *       Unique namespace for the instance - used in base CRUD templates to
 *       ensure created element ids are unique and when looking up templates
 *       which override the base templates.
 *
 *    elementId
 *       The id of the elements in which content should be displayed.
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
function CrudViews(attrs) {
  Views.call(this, attrs)
}
inherits(CrudViews, Views)

/**
 * Creates a new object which extends CrudViews, with the given attributes.
 * @param {Object} attrs instance attributes.
 */
CrudViews.create = function(attrs) {
  console.log('CrudViews.create', attrs.name)
  var F = function(attrs) {
    CrudViews.call(this, attrs)
  }
  inherits(F, CrudViews)
  var views = new F(attrs)
  // Push the new views to the base Views constructor so they will have their
  // init method called by Views.initAll.
  Views._created.push(views)
  return views
}

// CrudView default implementation
extend(CrudViews.prototype, {
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
   * Finds the content element for this CrudViews and displays a list of Model
   * instances by default.
   */
, init: function() {
    this.log('init')
    this.el = document.getElementById(this.elementId)
    this.list()
  }

  /**
   * Displays a list of Model instances.
   */
, list: function() {
    this.log('list')
    this.display([this.namespace + ':crud:list', 'crud:list']
      , { items: this.storage.all()
        , rowTemplates: [this.namespace + ':crud:row', 'crud:row']
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
    this.display([this.namespace + ':crud:detail', 'crud:detail']
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
    this.display([this.namespace + ':crud:add', 'crud:add']
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
    this.display([this.namespace + ':crud:edit', 'crud:edit']
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
    this.display([this.namespace + ':crud:delete', 'crud:delete']
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
})

// =============================================================== Templates ===

with (DOMBuilder.template) {

// ----------------------------------------------------- CrudViews Templates ---

function buttonSpacer(text) {
  return DOMBuilder.template.SPAN({'class': 'spacer'}, text || ' or ')
}

$template('crud:list'
, $block('itemTable'
  , TABLE(
      THEAD(TR(
        $block('headers'
        , TH('Item')
        )
      ))
    , TBODY($for('item in items'
      , $include($var('rowTemplates'), {item: $var('item')})
      ))
    )
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , SPAN({click: $func('events.add'), 'class': 'button'}, 'Add {{ model.name }}')
    )
  )
)

$template('crud:row'
, TR({id: '{{ ns }}-{{ item.id }}'}
  , TD({click: $func('events.select'), 'data-id': '{{ item.id }}', 'class': 'link'}
    , $block('linkText', '{{ item }}')
    )
  , $block('extraCells')
  )
)

$template('crud:detail'
, $block('top')
, $block('detail'
  , TABLE(TBODY(
      $block('detailRows'
      , TR(
          TH('Item')
        , TD('{{ item }}')
        )
      )
    ))
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , SPAN({click: $func('events.edit'), 'class': 'button'}, 'Edit')
    , buttonSpacer()
    , SPAN({click: $func('events.preDelete'), 'class': 'button'}, 'Delete')
    )
  )
)

$template('crud:add'
, FORM({id: '{{ ns }}Form', method: 'POST', action: '/{{ ns }}/add/'}
  , TABLE(TBODY({id: '{{ ns }}FormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({'type': 'submit', value: 'Add {{ model.name }}', click: $func('events.submit'), 'class': 'add'})
    , buttonSpacer()
    , SPAN({click: $func('events.cancel'), 'class': 'button cancel'}, 'Cancel')
    )
  )
)

$template('crud:edit'
, FORM({id: '{{ ns }}Form', method: 'POST', action: '/{{ ns }}/{{ item.id }}/edit/'}
  , TABLE(TBODY({id: '{{ ns }}FormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({type: 'submit', value: 'Edit {{ model.name }}', click: $func('events.submit'), 'class': 'edit'})
    , buttonSpacer()
    , SPAN({click: $func('events.cancel'), 'class': 'button cancel'}, 'Cancel')
    )
  )
)

$template({name: 'crud:delete', extend: 'crud:detail'}
, $block('top'
  , H2('Confirm Deletion')
  )
, $block('controls'
  , INPUT({type: 'submit', value: 'Delete {{ model.name }}', click: $func('events.confirmDelete'), 'class': 'delete'})
  , buttonSpacer()
  , SPAN({click: $func('events.cancel'), 'class': 'button cancel'}, 'Cancel')
  )
)

}