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

/**
 * Replaces linebreaks with <br> elements for display.
 */
function lineBreaks(s) {
  if (!s) return ''

  var lines = s.split('\n')
  var display = []
  for (var i = 0, l = lines.length, line; line = lines[i], i < l; i++) {
    if (line) {
      display.push(line)
    }
    if (i != l - 1) {
      display.push(DOMBuilder.elements.BR())
    }
  }
  return display
}

/**
 * Formats a date in Oct 25, 2006 format.
 */
function formatDate(d) {
  if (!d) return ''
  return forms.util.time.strftime(d, '%b %d, %Y')
}

// ================================================================== Models ===

/**
 * Base constructor for models - doesn't actually do much yet.
 */
function Model(attrs) {
  extend(this, attrs)
}

inherits(User, Model)
function User(attrs) {
  Model.call(this, attrs)
}
User._meta = {
  name: 'User'
, namePlural: 'Users'
}
extend(User.prototype, {
  toString: function() {
    return this.displayName
  }
, imageDisplay: function() {
    if (this.image) {
      return DOMBuilder.elements.IMG({src: this.image})
    }
    return ''
  }
})

inherits(Project, Model)
function Project(attrs) {
  Model.call(this, attrs)
}
Project._meta = {
  name: 'Project'
, namePlural: 'Projects'
}
Project.prototype.toString = function() {
  return this.name
}

inherits(Release, Model)
function Release(attrs) {
  Model.call(this, attrs)
}
Release._meta = {
  name: 'Release'
, namePlural: 'Releases'
}
Release.prototype.toString = function() {
  return this.project + ' - ' + this.name
}

inherits(Iteration, Model)
function Iteration(attrs) {
  Model.call(this, attrs)
}
Iteration._meta = {
  name: 'Iteration'
, namePlural: 'Iterations'
}
extend(Iteration.prototype, {
  toString: function() {
    return this.name
  }
, startDateDisplay: function() {
    return formatDate(this.startDate)
  }
, endDateDisplay: function() {
    return formatDate(this.endDate)
  }
})

inherits(Story, Model)
function Story(attrs) {
  Model.call(this, attrs)
}
Story._meta = {
  name: 'Story'
, namePlural: 'Stories'
}
extend(Story.prototype, {
  toString: function() {
    return this.name
  }
, stateDisplay: function() {
    return forms.util.itemsToObject(STORY_STATE_CHOICES)[this.state]
  }
, blockedDisplay: function() {
    return (this.blocked ? 'Yes' : 'No')
  }
, descriptionDisplay: function() {
    return lineBreaks(this.description)
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
})

inherits(Task, Model)
function Task(attrs) {
  Model.call(this, attrs)
}
Task._meta = {
  name: 'Task'
, namePlural: 'Tasks'
}
extend(Task.prototype, {
  toString: function() {
    return this.name
  }
, stateDisplay: function() {
    return forms.util.itemsToObject(TASK_STATE_CHOICES)[this.state]
  }
, blockedDisplay: function() {
    return (this.blocked ? 'Yes' : 'No')
  }
, descriptionDisplay: function() {
    return lineBreaks(this.description)
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
})

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

var Projects = new Storage(Project)
  , Releases = new Storage(Release)
  , Iterations = new Storage(Iteration)
  , Stories = new Storage(Story)
  , Tasks = new Storage(Task)
  , Users = new Storage(User)

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

var States = {
  DEFINED: 'D'
, IN_PROGRESS: 'P'
, COMPLETED: 'C'
, NOT_STARTED: 'N'
}

var STORY_STATE_CHOICES = [
  [States.DEFINED,     'Defined']
, [States.IN_PROGRESS, 'In Progress']
, [States.COMPLETED,   'Completed']
]

var TASK_STATE_CHOICES = [
  [States.NOT_STARTED, 'Not Started']
, [States.IN_PROGRESS, 'In Progress']
, [States.COMPLETED,   'Completed']
]

var UserForm = forms.Form({
  name: forms.CharField({maxLength: 255})
, email: forms.EmailField()
, displayName: forms.CharField({maxLength: 50})
, image: forms.URLField({required: false})
})

var ProjectForm = forms.Form({
  name: forms.CharField({maxLength: 50})
})

var ReleaseForm = forms.Form({
  project: forms.ModelChoiceField(Projects.query())
, name: forms.CharField({maxLength: 50})
})

var IterationForm = forms.Form({
  release: forms.ModelChoiceField(Releases.query())
, name: forms.CharField({maxLength: 50})
, startDate: forms.DateField({required: false})
, endDate: forms.DateField({required: false})

, clean: function() {
    if (this.cleanedData.startDate && this.cleanedData.endDate &&
        this.cleanedData.startDate > this.cleanedData.endDate) {
      throw new forms.ValidationError('End Date cannot be prior to Start Date.')
    }
    return this.cleanedData
  }
})

var StoryForm = forms.Form({
  iteration: forms.ModelChoiceField(Iterations.query())
, name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea, required: false})
, state: forms.ChoiceField({choices: STORY_STATE_CHOICES, initial: States.DEFINED})
, blocked: forms.BooleanField({initial: false, required: false})
, planned: forms.DecimalField({required: false, minValue: 0})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, notes: forms.CharField({required: false, widget: forms.Textarea})
})

var TaskForm = forms.Form({
  story: forms.ModelChoiceField(Stories.query())
, name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea, required: false})
, state: forms.ChoiceField({choices: TASK_STATE_CHOICES, initial: States.NOT_STARTED})
, blocked: forms.BooleanField({initial: false, required: false})
, estimated: forms.DecimalField({minValue: 0})
, actual: forms.DecimalField({minValue: 0})
, todo: forms.DecimalField({minValue: 0})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, notes: forms.CharField({widget: forms.Textarea, required: false})
})

// =============================================================== Templates ===

with (DOMBuilder.template) {

// ----------------------------------------------------- Crud Base Templates ---

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
    , SPAN({click: $func('events.add'), 'class': 'button add'}, 'Add {{ model.name }}')
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
    , SPAN({click: $func('events.edit'), 'class': 'button edit'}, 'Edit')
    , buttonSpacer()
    , SPAN({click: $func('events.preDelete'), 'class': 'button delete'}, 'Delete')
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

// --------------------------------------------------------------Users ----

$template({name: 'users:list', extend: 'crud:list'}
, $block('headers'
  , TH('Name')
  , TH('Email')
  , TH('Display name')
  )
)

$template({name: 'users:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.email }}')
  , TD('{{ item.displayName }}')
  )
)

$template({name: 'users:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Name')
    , TD('{{ item.name }}')
    )
  , TR(
      TH('Email')
    , TD('{{ item.email }}')
    )
  , TR(
      TH('Display name')
    , TD('{{ item.displayName }}')
    )
  , TR(
      TH('Image')
    , TD($var('item.imageDisplay'))
    )
  )
)

// ---------------------------------------------------------------- Projects ---

$template({name: 'projects:list', extend: 'crud:list'}
, $block('headers'
  , TH('Project name')
  )
)

$template({name: 'projects:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
)

$template({name: 'projects:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Project name')
    , TD('{{ item.name }}')
    )
  )
)

// ---------------------------------------------------------------- Releases ---

$template({name: 'releases:list', extend: 'crud:list'}
, $block('headers'
  , TH('Release name')
  , TH('Project')
  )
)

$template({name: 'releases:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.project }}')
  )
)

$template({name: 'releases:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Release Name')
    , TD('{{ item.name }}')
    )
  , TR(
      TH('Project')
    , TD('{{ item.project }}')
    )
  )
)

// --------------------------------------------------------------Iterations ----

$template({name: 'iterations:list', extend: 'crud:list'}
, $block('headers'
  , TH('Iteration name')
  , TH('Start date')
  , TH('End date')
  )
)

$template({name: 'iterations:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.startDateDisplay }}')
  , TD('{{ item.endDateDisplay }}')
  )
)

$template({name: 'iterations:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Iteration Name')
    , TD({colSpan: 3}, '{{ item.name }}')
    )
  , TR(
      TH('Start date')
    , TD('{{ item.startDateDisplay }}')
    , TH('End date')
    , TD('{{ item.endDateDisplay }}')
    )
  )
)

// ----------------------------------------------------------------- Stories ---

$template({name: 'stories:list', extend: 'crud:list'}
, $block('headers'
  , TH('Story name')
  , TH('Iteration')
  , TH('State')
  , TH('Blocked')
  , TH('Planned')
  , TH('Owner')
  )
)

$template({name: 'stories:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.iteration }}')
  , TD('{{ item.stateDisplay }}')
  , TD('{{ item.blockedDisplay }}')
  , TD('{{ item.planned }}')
  , TD('{{ item.owner }}')
  )
)

$template({name: 'stories:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Story name')
    , TD({colSpan: 3}, '{{ item.name }}')
    )
  , TR(
      TH('Iteration')
    , TD({colSpan: 3}, '{{ item.iteration }}')
    )
  , TR(
      TH('Description')
    , TD({colSpan: 3}, '{{ item.descriptionDisplay }}')
    )
  , TR(
      TH('Owner')
    , TD({colSpan: 3}, '{{ item.owner }}')
    )
  , TR(
      TH('State')
    , TD('{{ item.stateDisplay }}')
    , TH('Blocked')
    , TD('{{ item.blockedDisplay }}')
    )
  , TR(
      TH('Planned')
    , TD({colSpan: 3}, '{{ item.planned }}')
    )
  , TR(
      TH('Notes')
    , TD({colSpan: 3}, '{{ item.notesDisplay }}')
    )
  )
)

// ------------------------------------------------------------------- Tasks ---

$template({name: 'tasks:list', extend: 'crud:list'}
, $block('headers'
  , TH('Task name')
  , TH('Story')
  , TH('Release')
  , TH('Iteration')
  , TH('State')
  , TH('Blocked')
  , TH('Est.')
  , TH('To.')
  , TH('Act.')
  , TH('Owner')
  )
)

$template({name: 'tasks:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.story }}')
  , TD('{{ item.story.iteration.release }}')
  , TD('{{ item.story.iteration }}')
  , TD('{{ item.stateDisplay }}')
  , TD('{{ item.blockedDisplay }}')
  , TD('{{ item.estimated }}')
  , TD('{{ item.todo }}')
  , TD('{{ item.actual }}')
  , TD('{{ item.owner }}')
  )
)

$template({name: 'tasks:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Task name')
    , TD({colSpan: 3}, '{{ item.name }}')
    )
  , TR(
      TH('Story')
    , TD({colSpan: 3}, '{{ item.story }}')
    )
  , TR(
      TH('Release')
    , TD('{{ item.story.iteration.release }}')
    , TH('Iteration')
    , TD('{{ item.story.iteration }}')
    )
  , TR(
      TH('Description')
    , TD({colSpan: 3}, '{{ item.descriptionDisplay }}')
    )
  , TR(
      TH('Owner')
    , TD({colSpan: 3}, '{{ item.owner }}')
    )
  , TR(
      TH('State')
    , TD('{{ item.stateDisplay }}')
    , TH('Blocked')
    , TD('{{ item.blockedDisplay }}')
    )
  , TR(
      TH('Estimated')
    , TD('{{ item.estimated }}')
    , TH('Actual')
    , TD('{{ item.actual }}')
    )
  , TR(
      TH('TODO')
    , TD({colSpan: 3}, '{{ item.todo }}')
    )
  , TR(
      TH('Notes')
    , TD({colSpan: 3}, '{{ item.notesDisplay }}')
    )
  )
)

}

// =================================================================== Views ===

function Views(attrs) {
  extend(this, attrs)
}

/**
 * Tracks views which have been created.
 */
Views.created = []

/**
 * Creates a new object which extends Views, with the given attributes.
 */
Views.create = function(attrs) {
  console.log('Views.create', attrs.name)
  var F = function(attrs) {
    Views.call(this, attrs)
  }
  inherits(F, Views)
  var views = new F(attrs)
  Views.created.push(views)
  return views
}

/**
 * Calls the init() function on each created views object which has one.
 */
Views.initAll = function() {
  for (var i = 0, l = Views.created.length; i < l; i++) {
    if (typeof Views.created[i].init == 'function') {
      Views.created[i].init()
    }
  }
}

/**
 * Renders a template with the given name, using the given context. If an object
 * defining event handling functions is given, the functions will be bound to
 * this Views instance and added to the template context as an 'events' property.
 */
Views.prototype.render = function(templateName, context, events) {
  if (events) {
    for (var e in events) {
      if (events[e] == null) {
        console.warn('Event ' + e + ' for use with ' + templateName + ' is null or undefined.')
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
 * Renders a template and displays the results as this view's element contents.
 */
Views.prototype.display = function(templateName, context, events) {
  replace(this.el, this.render(templateName, context, events))
}

/**
 * Logs a message with this view's name.
 */
Views.prototype.log = function(s) {
  console.log(this.name, s)
}

// --------------------------------------------------------------- CrudViews ---

/**
 * Views which do some of the repetitive work for basic CRUD functionality.
 */
function CrudViews(attrs) {
  Views.call(this, attrs)
}
inherits(CrudViews, Views)

/**
 * Creates a new object which extends CrudViews, with the given attributes.
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
  Views.created.push(views)
  return views
}

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

, init: function() {
    this.log('init')
    this.el = document.getElementById(this.elementId)
    this.list()
  }

, list: function() {
    this.log('list')
    this.display([this.namespace + ':list', 'crud:list']
      , { items: this.storage.all()
        , rowTemplates: [this.namespace + ':row', 'crud:row']
        }
      , { select: this.select
        , add: this.add
        }
      )
  }

, select: function(e) {
    this.log('select')
    var id = e.target.getAttribute('data-id')
    this.selectedItem = this.storage.get(id)
    this.detail()
  }

, detail: function() {
    this.log('detail')
    this.display([this.namespace + ':detail', 'crud:detail']
      , { item: this.selectedItem }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

, add: function() {
    this.log('add')
    this.display([this.namespace + ':add', 'crud:add']
      , { form: this.form() }
      , { submit: this.createItem
        , cancel: this.list
        }
      )
  }

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

, edit: function() {
    this.log('edit')
    this.display([this.namespace + ':edit', 'crud:edit']
      , { item: this.selectedItem
        , form: this.form({ initial: this.selectedItem })
        }
      , { submit: this.updateItem
        , cancel: this.detail
        }
      )
  }

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

, preDelete: function() {
    this.log('preDelete')
    this.display([this.namespace + ':delete', 'crud:delete']
      , { item: this.selectedItem }
      , { confirmDelete: this.confirmDelete
        , cancel: this.detail
        }
      )
  }

, confirmDelete: function(e) {
    this.log('confirmDelete')
    e.preventDefault()
    this.storage.remove(this.selectedItem)
    this.selectedItem = null
    this.list()
  }
})

// ---------------------------------------------------------------- Users ---

var UserViews = CrudViews.create({
  name: 'UserViews'
, namespace: 'users'
, elementId: 'users'
, storage: Users
, form: UserForm
})

// ---------------------------------------------------------------- Projects ---

var ProjectViews = CrudViews.create({
  name: 'ProjectViews'
, namespace: 'projects'
, elementId: 'projects'
, storage: Projects
, form: ProjectForm
})

// ---------------------------------------------------------------- Releases ---

var ReleaseViews = CrudViews.create({
  name: 'ReleaseViews'
, namespace: 'releases'
, elementId: 'releases'
, storage: Releases
, form: ReleaseForm
})

// -------------------------------------------------------------- Iterations ---

var IterationViews = CrudViews.create({
  name: 'IterationViews'
, namespace: 'iterations'
, elementId: 'iterations'
, storage: Iterations
, form: IterationForm
})

// ---------------------------------------------------------------- Stories ---

var StoryViews = CrudViews.create({
  name: 'StoryViews'
, namespace: 'stories'
, elementId: 'stories'
, storage: Stories
, form: StoryForm
})

// ------------------------------------------------------------------- Tasks ---

var TaskViews = CrudViews.create({
  name: 'TaskViews'
, namespace: 'tasks'
, elementId: 'tasks'
, storage: Tasks
, form: TaskForm
})

// TODO Add an AppView to manage display of the different sections

// ============================================================= Sample Data ===

!function() {

var p1 = Projects.add(new Project({name: 'Project 1'}))
  , p2 = Projects.add(new Project({name: 'Project 2'}))
Projects.add(new Project({name: 'Project 3'}))
var r1 = Releases.add(new Release({project: p1, name: 'Release 1'}))
Releases.add(new Release({project: p1, name: 'Release 2'}))
Releases.add(new Release({project: p2, name: 'Release 1'}))
var i1 = Iterations.add(new Iteration(
    { release: r1
    , name: 'Iteration 1'
    , startDate: new Date(2011, 7, 1)
    , endDate: new Date(2011, 7, 28)
    }
  ))
  , i2 = Iterations.add(new Iteration({release: r1, name: 'Iteration 2'}))
var u1 = Users.add(new User({name: 'Alan Partridge', email: 'a@a.com', displayName: 'Alan', image: ''}))
  , u2 = Users.add(new User({name: 'Bill Carr', email: 'b@b.com', displayName: 'Bill', image: ''}))
var s1 = Stories.add(new Story(
    { iteration: i1
    , name: 'Story 1'
    , description: 'Do some things.\n\nThen do other things.'
    , owner: u1
    , state: States.DEFINED
    , planned: 45.0
    }
  ))
Tasks.add(new Task(
    { story: s1
    , name: 'Task 1'
    , description: 'Implement things and that.'
    , owner: u2
    , state: States.IN_PROGRESS
    , estimated: 15
    , todo: 10
    , actual: 5.5
    }
  ))

}()

window.onload = bind(Views.initAll, Views)
