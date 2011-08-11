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

// ================================================================== Models ===

function Model(attrs) {
  extend(this, attrs)
}

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

inherits(User, Model)
function User(attrs) {
  Model.call(this, attrs)
}
User._meta = {
  name: 'User'
, namePlural: 'Users'
}
User.prototype.toString = function() {
  return this.displayName
}

// ===================================================== Storage / Retrieval ===

function Storage(model) {
  this._store = {}
  this._idSeed = 1
  this.model = model
}

Storage.prototype.query = function() {
  return new Query(this)
}

Storage.prototype.add = function(instance) {
  instance.id = this._idSeed++
  this._store[instance.id] = instance
  return instance
}

Storage.prototype.all = function() {
  var a = []
  for (var id in this._store) {
    a.push(this._store[id])
  }
  return a
}

Storage.prototype.get = function(id) {
  return this._store[id]
}

Storage.prototype.delete = function(project) {
  delete this._store[project.id]
}

// Need an object which has access to query results and a link to the means of
// looking stuff up to hook up with newforms' ModelChoiceField.

function Query(storage) {
  this.storage = storage
}

Query.prototype.__iter__ = function() {
  return this.storage.all()
}

Query.prototype.get = function(id) {
  return this.storage.get(id)
}

var Projects = new Storage(Project)
var Releases = new Storage(Release)
var Stories = new Storage(Story)
var Tasks = new Storage(Task)
var Users = new Storage(User)

// =================================================================== Forms ===

// Let newforms know what our cobbled-together storage and retrieval looks like
extend(forms.ModelInterface, {
  throwsIfNotFound: false
, notFoundValue: undefined
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

var ProjectForm = forms.Form({
  name: forms.CharField({maxLength: 50})
})

var ReleaseForm = forms.Form({
  project: forms.ModelChoiceField(Projects.query())
, name: forms.CharField({maxLength: 50})
})

var StoryForm = forms.Form({
  release: forms.ModelChoiceField(Releases.query())
, name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea, required: false})
, state: forms.ChoiceField({choices: STORY_STATE_CHOICES, default: States.DEFINED})
, blocked: forms.BooleanField({default: false, required: false})
, planned: forms.DecimalField({required: false, minValue: 0})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, notes: forms.CharField({required: false, widget: forms.Textarea})
})

var TaskForm = forms.Form({
  story: forms.ModelChoiceField(Stories.query())
, name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea, required: false})
, state: forms.ChoiceField({choices: TASK_STATE_CHOICES, default: States.NOT_STARTED})
, blocked: forms.BooleanField({default: false, required: false})
, estimated: forms.DecimalField({minValue: 0})
, actual: forms.DecimalField({minValue: 0})
, todo: forms.DecimalField({minValue: 0})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, notes: forms.CharField({widget: forms.Textarea, required: false})
})

// =============================================================== Templates ===

with (DOMBuilder.template) {

// ----------------------------------------------------- Crud Base Templates ---

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
    , SPAN({click: $func('events.add')}, 'New {{ model.name }}')
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
    , SPAN({click: $func('events.edit')}, 'Edit')
    , ' or '
    , SPAN({click: $func('events.preDelete')}, 'Delete')
    )
  )
)

$template('crud:add'
, FORM({id: '{{ ns }}Form', method: 'POST', action: '/{{ ns }}/add/'}
  , TABLE(TBODY({id: '{{ ns }}FormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({'type': 'submit', value: 'Add {{ model.name }}', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template('crud:edit'
, FORM({id: '{{ ns }}Form', method: 'POST', action: '/{{ ns }}/{{ item.id }}/edit/'}
  , TABLE(TBODY({id: '{{ ns }}FormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({type: 'submit', value: 'Edit {{ model.name }}', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template({name: 'crud:delete', extend: 'crud:detail'}
, $block('top'
  , H2('Confirm Deletion')
  )
, $block('controls'
  , INPUT({type: 'submit', value: 'Delete {{ model.name }}', click: $func('events.confirmDelete')})
  , ' or '
  , SPAN({click: $func('events.cancel')}, 'Cancel')
  )
)

// ---------------------------------------------------------------- Projects ---

$template({name: 'projects:list', extend: 'crud:list'}
, $block('headers'
  , TH('Project Name')
  )
)

$template({name: 'projects:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
)

$template({name: 'projects:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Project Name')
    , TD('{{ item.name }}')
    )
  )
)

// ---------------------------------------------------------------- Releases ---

$template('release:list'
, TABLE(
    THEAD(TR(
      TH('Release Name')
    , TH('Project')
    ))
  , TBODY($for('release in releases'
    , $include('release:row', {release: $var('release')})
    ))
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , SPAN({click: $func('events.add')}, 'New Release')
    )
  )
)

$template('release:row'
, TR({id: 'release-{{ release.id }}'}
  , TD({click: $func('events.select'), 'data-id': '{{ release.id }}', 'class': 'link'}, '{{ release.name }}')
  , TD('{{ release.project.name }}')
  )
)

$template('release:detail'
, $block('top')
, TABLE(TBODY(
    TR(
      TH('Release Name')
    , TD('{{ release.name }}')
    )
  , TR(
      TH('Project')
    , TD('{{ release.project.name }}')
    )
  ))
, DIV({'class': 'controls'}
  , $block('controls'
    , SPAN({click: $func('events.edit')}, 'Edit')
    , ' or '
    , SPAN({click: $func('events.preDelete')}, 'Delete')
    )
  )
)

$template('release:add'
, FORM({id: 'addReleaseForm', method: 'POST', action: '/releases/add/'}
  , TABLE(TBODY({id: 'releaseFormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({'type': 'submit', value: 'Add Release', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template('release:edit'
, FORM({id: 'editReleaseForm', method: 'POST', action: '/releases/{{ release.id }}/edit/'}
  , TABLE(TBODY({id: 'releaseFormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({type: 'submit', value: 'Edit Release', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template({name: 'release:delete', extend: 'release:detail'}
, $block('top'
  , H2('Confirm Deletion')
  )
, $block('controls'
  , INPUT({type: 'submit', value: 'Delete Release', click: $func('events.confirmDelete')})
  , ' or '
  , SPAN({click: $func('events.cancel')}, 'Cancel')
  )
)

// ----------------------------------------------------------------- Stories ---

$template({name: 'stories:list', extend: 'crud:list'}
, $block('headers'
  , TH('Story Name')
  , TH('Release')
  , TH('State')
  , TH('Blocked')
  , TH('Planned')
  , TH('Owner')
  )
)

$template({name: 'stories:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.release }}')
  , TD('{{ item.stateDisplay }}')
  , TD('{{ item.blockedDisplay }}')
  , TD('{{ item.planned }}')
  , TD('{{ item.owner }}')
  )
)

$template({name: 'stories:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Story Name')
    , TD({colSpan: 3}, '{{ item.name }}')
    )
  , TR(
      TH('Release')
    , TD({colSpan: 3}, '{{ item.release }}')
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

$template('task:list'
, TABLE(
    THEAD(TR(
      TH('Task Name')
    , TH('Story')
    , TH('Release')
    , TH('State')
    , TH('Blocked')
    , TH('Est.')
    , TH('To.')
    , TH('Act.')
    , TH('Owner')
    ))
  , TBODY($for('task in tasks'
    , $include('task:row', {task: $var('task')})
    ))
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , SPAN({click: $func('events.add')}, 'New Task')
    )
  )
)

$template('task:row'
, TR({id: 'task-{{ task.id }}'}
  , TD({click: $func('events.select'), 'data-id': '{{ task.id }}', 'class': 'link'}, '{{ task.name }}')
  , TD('{{ task.story }}')
  , TD('{{ task.story.release }}')
  , TD('{{ task.stateDisplay }}')
  , TD('{{ task.blockedDisplay }}')
  , TD('{{ task.estimated }}')
  , TD('{{ task.todo }}')
  , TD('{{ task.actual }}')
  , TD('{{ task.owner }}')
  )
)

$template('task:detail'
, $block('top')
, TABLE(TBODY(
    TR(
      TH('Task Name')
    , TD({colSpan: 3}, '{{ task.name }}')
    )
  , TR(
      TH('Story')
    , TD('{{ task.story }}')
    , TH('Release')
    , TD('{{ task.story.release }}')
    )
  , TR(
      TH('Description')
    , TD({colSpan: 3}, '{{ task.descriptionDisplay }}')
    )
  , TR(
      TH('Owner')
    , TD({colSpan: 3}, '{{ task.owner }}')
    )
  , TR(
      TH('State')
    , TD('{{ task.stateDisplay }}')
    , TH('Blocked')
    , TD('{{ task.blockedDisplay }}')
    )
  , TR(
      TH('Estimated')
    , TD('{{ task.estimated }}')
    , TH('Actual')
    , TD('{{ task.actual }}')
    )
  , TR(
      TH('TODO')
    , TD({colSpan: 3}, '{{ task.todo }}')
    )
  , TR(
      TH('Notes')
    , TD({colSpan: 3}, '{{ task.notesDisplay }}')
    )
  ))
, DIV({'class': 'controls'}
  , $block('controls'
    , SPAN({click: $func('events.edit')}, 'Edit')
    , ' or '
    , SPAN({click: $func('events.preDelete')}, 'Delete')
    )
  )
)

$template('task:add'
, FORM({id: 'addTaskForm', method: 'POST', action: '/tasks/add/'}
  , TABLE(TBODY({id: 'taskFormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({'type': 'submit', value: 'Add Task', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template('task:edit'
, FORM({id: 'editTaskForm', method: 'POST', action: '/tasks/{{ task.id }}/edit/'}
  , TABLE(TBODY({id: 'taskFormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({type: 'submit', value: 'Edit Task', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template({name: 'task:delete', extend: 'task:detail'}
, $block('top'
  , H2('Confirm Deletion')
  )
, $block('controls'
  , INPUT({type: 'submit', value: 'Delete Task', click: $func('events.confirmDelete')})
  , ' or '
  , SPAN({click: $func('events.cancel')}, 'Cancel')
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
  replace(this.el, DOMBuilder.template.renderTemplate(templateName, context))
}

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
    Views.prototype.render.call(this, templateName, context, events)
  }

, init: function() {
    this.log('init')
    this.el = document.getElementById(this.elementId)
    this.list()
  }

, list: function() {
    this.log('list')
    this.render([this.namespace + ':list', 'crud:list']
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
    this.render([this.namespace + ':detail', 'crud:detail']
      , { item: this.selectedItem }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

, add: function() {
    this.log('add')
    this.render([this.namespace + ':add', 'crud:add']
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
    this.render([this.namespace + ':edit', 'crud:edit']
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
    this.render([this.namespace + ':delete', 'crud:delete']
      , { item: this.selectedItem }
      , { confirmDelete: this.confirmDelete
        , cancel: this.detail
        }
      )
  }

, confirmDelete: function(e) {
    this.log('confirmDelete')
    e.preventDefault()
    this.storage.delete(this.selectedItem)
    this.selectedItem = null
    this.list()
  }
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

var ReleaseViews = Views.create({
  name: 'ReleaseViews'

, selectedRelease: null

, init: function() {
    this.log('init')
    this.el = document.getElementById('releases')
    this.list()
  }

, list: function() {
    this.log('list')
    this.render('release:list'
      , { releases: Releases.all() }
      , { select: this.select
        , add: this.add
        }
      )
  }

, select: function(e) {
    this.log('select')
    var id = e.target.getAttribute('data-id')
    this.selectedRelease = Releases.get(id)
    this.detail()
  }

, detail: function() {
    this.log('detail')
    this.render('release:detail'
      , { release: this.selectedRelease }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

, add: function() {
    this.log('add')
    this.render('release:add'
      , { form: ReleaseForm() }
      , { submit: this.createRelease
        , cancel: this.list
        }
      )
  }

, createRelease: function(e) {
    this.log('createRelease')
    e.preventDefault()
    var form = ReleaseForm({ data: forms.formData('addReleaseForm') })
    if (form.isValid()) {
      Releases.add(new Release(form.cleanedData))
      this.list()
    }
    else {
      replace('releaseFormBody', form.asTable())
    }
  }

, edit: function() {
    this.log('edit')
    this.render('release:edit'
      , { release: this.selectedRelease
        , form: ReleaseForm({ initial: this.selectedRelease })
        }
      , { submit: this.updateRelease
        , cancel: this.detail
        }
      )
  }

, updateRelease: function(e) {
    this.log('updateRelease')
    e.preventDefault()
    var form = ReleaseForm({ data: forms.formData('editReleaseForm')
                           , initial: this.selectedRelease
                           })
    if (form.isValid()) {
      extend(this.selectedRelease, form.cleanedData)
      this.selectedRelease = null
      this.list()
    }
    else {
      replace('releaseFormBody', form.asTable())
    }
  }

, preDelete: function() {
    this.log('preDelete')
    this.render('release:delete'
      , { release: this.selectedRelease }
      , { confirmDelete: this.confirmDelete
        , cancel: this.detail
        }
      )
  }

, confirmDelete: function(e) {
    this.log('confirmDelete')
    e.preventDefault()
    Releases.delete(this.selectedRelease)
    this.selectedRelease = null
    this.list()
  }
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

var TaskViews = Views.create({
  name: 'TaskViews'

, selectedTask: null

, init: function() {
    this.log('init')
    this.el = document.getElementById('tasks')
    this.list()
  }

, list: function() {
    this.log('list')
    this.render('task:list'
      , { tasks: Tasks.all() }
      , { select: this.select
        , add: this.add
        }
      )
  }

, select: function(e) {
    this.log('select')
    var id = e.target.getAttribute('data-id')
    this.selectedTask = Tasks.get(id)
    this.detail()
  }

, detail: function() {
    this.log('detail')
    this.render('task:detail'
      , { task: this.selectedTask }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

, add: function() {
    this.log('add')
    this.render('task:add'
      , { form: TaskForm() }
      , { submit: this.createTask
        , cancel: this.list
        }
      )
  }

, createTask: function(e) {
    this.log('createTask')
    e.preventDefault()
    var form = TaskForm({ data: forms.formData('addTaskForm') })
    if (form.isValid()) {
      Tasks.add(new Task(form.cleanedData))
      this.list()
    }
    else {
      replace('taskFormBody', form.asTable())
    }
  }

, edit: function() {
    this.log('edit')
    this.render('task:edit'
      , { task: this.selectedTask
        , form: TaskForm({ initial: this.selectedTask })
        }
      , { submit: this.updateTask
        , cancel: this.detail
        }
      )
  }

, updateTask: function(e) {
    this.log('updateTask')
    e.preventDefault()
    var form = TaskForm({ data: forms.formData('editTaskForm')
                           , initial: this.selectedTask
                           })
    if (form.isValid()) {
      extend(this.selectedTask, form.cleanedData)
      this.selectedTask = null
      this.list()
    }
    else {
      replace('taskFormBody', form.asTable())
    }
  }

, preDelete: function() {
    this.log('preDelete')
    this.render('task:delete'
      , { task: this.selectedTask }
      , { confirmDelete: this.confirmDelete
        , cancel: this.detail
        }
      )
  }

, confirmDelete: function(e) {
    this.log('confirmDelete')
    e.preventDefault()
    Tasks.delete(this.selectedTask)
    this.selectedTask = null
    this.list()
  }
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
var u1 = Users.add(new User({displayName: 'Alan'}))
  , u2 = Users.add(new User({displayName: 'Bill'}))
Users.add(new User({displayName: 'Cal'}))
var s1 = Stories.add(new Story(
    { release: r1
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
