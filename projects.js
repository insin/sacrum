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

function lineBreaks(s) {
  if (!s) {
    return ''
  }

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
Project.prototype.toString = function() {
  return this.name
}

inherits(Release, Model)
function Release(attrs) {
  Model.call(this, attrs)
}
Release.prototype.toString = function() {
  return this.project + ' - ' + this.name
}

inherits(Story, Model)
function Story(attrs) {
  Model.call(this, attrs)
}
Story.prototype.toString = function() {
  return this.name
}
Story.prototype.stateDisplay = function() {
  return forms.util.itemsToObject(STORY_STATE_CHOICES)[this.state]
}
Story.prototype.blockedDisplay = function() {
  return (this.blocked ? 'Yes' : 'No')
}
Story.prototype.descriptionDisplay = function() {
  return lineBreaks(this.description)
}
Story.prototype.notesDisplay = function() {
  return lineBreaks(this.notes)
}

inherits(User, Model)
function User(attrs) {
  Model.call(this, attrs)
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
, description: forms.CharField({widget: forms.Textarea})
, state: forms.ChoiceField({choices: STORY_STATE_CHOICES, default: States.DEFINED})
, blocked: forms.BooleanField({default: false, required: false})
, planned: forms.DecimalField({required: false, minValue: 0})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, notes: forms.CharField({required: false, widget: forms.Textarea})
})

// =============================================================== Templates ===

with (DOMBuilder.template) {

// ---------------------------------------------------------------- Projects ---

$template('project:list'
, TABLE(
    THEAD(TR(
      TH('Project Name')
    ))
  , TBODY($for('project in projects'
    , $include('project:row', {project: $var('project')})
    ))
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , SPAN({click: $func('events.add')}, 'New Project')
    )
  )
)

$template('project:row'
, TR({id: 'project-{{ project.id }}'}
  , TD({click: $func('events.select'), 'data-id': '{{ project.id }}', 'class': 'link'}, '{{ project.name }}')
  )
)

$template('project:detail'
, $block('top')
, TABLE(TBODY(
    TR(
      TH('Project Name')
    , TD('{{ project.name }}')
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

$template('project:add'
, FORM({id: 'addProjectForm', method: 'POST', action: '/projects/add/'}
  , TABLE(TBODY({id: 'projectFormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({'type': 'submit', value: 'Add Project', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template('project:edit'
, FORM({id: 'editProjectForm', method: 'POST', action: '/projects/{{ project.id }}/edit/'}
  , TABLE(TBODY({id: 'projectFormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({type: 'submit', value: 'Edit Project', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template({name: 'project:delete', extend: 'project:detail'}
, $block('top'
  , H2('Confirm Deletion')
  )
, $block('controls'
  , INPUT({type: 'submit', value: 'Delete Project', click: $func('events.confirmDelete')})
  , ' or '
  , SPAN({click: $func('events.cancel')}, 'Cancel')
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

$template('story:list'
, TABLE(
    THEAD(TR(
      TH('Story Name')
    , TH('Release')
    , TH('State')
    , TH('Blocked')
    , TH('Planned')
    , TH('Owner')
    ))
  , TBODY($for('story in stories'
    , $include('story:row', {story: $var('story')})
    ))
  )
, DIV({'class': 'controls'}
  , $block('controls'
    , SPAN({click: $func('events.add')}, 'New Story')
    )
  )
)

$template('story:row'
, TR({id: 'story-{{ story.id }}'}
  , TD({click: $func('events.select'), 'data-id': '{{ story.id }}', 'class': 'link'}, '{{ story.name }}')
  , TD('{{ story.release }}')
  , TD('{{ story.stateDisplay }}')
  , TD('{{ story.blockedDisplay }}')
  , TD('{{ story.planned }}')
  , TD('{{ story.owner }}')
  )
)

$template('story:detail'
, $block('top')
, TABLE(TBODY(
    TR(
      TH('Story Name')
    , TD({colSpan: 3}, '{{ story.name }}')
    )
  , TR(
      TH('Release')
    , TD({colSpan: 3}, '{{ story.release }}')
    )
  , TR(
      TH('Description')
    , TD({colSpan: 3}, '{{ story.descriptionDisplay }}')
    )
  , TR(
      TH('Owner')
    , TD({colSpan: 3}, '{{ story.owner }}')
    )
  , TR(
      TH('State')
    , TD('{{ story.stateDisplay }}')
    , TH('Blocked')
    , TD('{{ story.blockedDisplay }}')
    )
  , TR(
      TH('Planned')
    , TD({colSpan: 3}, '{{ story.planned }}')
    )
  , TR(
      TH('Notes')
    , TD({colSpan: 3}, '{{ story.notesDisplay }}')
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

$template('story:add'
, FORM({id: 'addStoryForm', method: 'POST', action: '/stories/add/'}
  , TABLE(TBODY({id: 'storyFormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({'type': 'submit', value: 'Add Story', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template('story:edit'
, FORM({id: 'editStoryForm', method: 'POST', action: '/stories/{{ story.id }}/edit/'}
  , TABLE(TBODY({id: 'storyFormBody'}
    , $var('form.asTable')
    ))
  , DIV({'class': 'controls'}
    , INPUT({type: 'submit', value: 'Edit Story', click: $func('events.submit')})
    , ' or '
    , SPAN({click: $func('events.cancel')}, 'Cancel')
    )
  )
)

$template({name: 'story:delete', extend: 'story:detail'}
, $block('top'
  , H2('Confirm Deletion')
  )
, $block('controls'
  , INPUT({type: 'submit', value: 'Delete Story', click: $func('events.confirmDelete')})
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
      events[e] = bind(events[e], this)
    }
    context.events = events
  }
  replace(this.el, DOMBuilder.template.renderTemplate(templateName, context))
}

// ---------------------------------------------------------------- Projects ---

var ProjectViews = Views.create({
  name: 'ProjectViews'

, selectedProject: null

, init: function() {
    console.log('ProjectViews.init')
    this.el = document.getElementById('projects')
    this.list()
  }

, list: function() {
    console.log('ProjectViews.list')
    this.render('project:list'
      , { projects: Projects.all() }
      , { select: this.select
        , add: this.add
        }
      )
  }

, select: function(e) {
    console.log('ProjectViews.select')
    var id = e.target.getAttribute('data-id')
    this.selectedProject = Projects.get(id)
    this.detail()
  }

, detail: function() {
    console.log('ProjectViews.detail')
    this.render('project:detail'
      , { project: this.selectedProject }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

, add: function() {
    console.log('ProjectViews.add')
    this.render('project:add'
      , { form: ProjectForm() }
      , { submit: this.createProject
        , cancel: this.list
        }
      )
  }

, createProject: function(e) {
    console.log('ProjectViews.createProject')
    e.preventDefault()
    var form = ProjectForm({ data: forms.formData('addProjectForm') })
    if (form.isValid()) {
      Projects.add(new Project(form.cleanedData))
      this.list()
    }
    else {
      replace('projectFormBody', form.asTable())
    }
  }

, edit: function() {
    console.log('ProjectViews.edit')
    this.render('project:edit'
      , { project: this.selectedProject
        , form: ProjectForm({ initial: this.selectedProject })
        }
      , { submit: this.updateProject
        , cancel: this.detail
        }
      )
  }

, updateProject: function(e) {
    console.log('ProjectViews.updateProject')
    e.preventDefault()
    var form = ProjectForm({ data: forms.formData('editProjectForm')
                           , initial: this.selectedProject
                           })
    if (form.isValid()) {
      extend(this.selectedProject, form.cleanedData)
      this.selectedProject = null
      this.list()
    }
    else {
      replace('projectFormBody', form.asTable())
    }
  }

, preDelete: function() {
    console.log('ProjectViews.preDelete')
    this.render('project:delete'
      , { project: this.selectedProject }
      , { confirmDelete: this.confirmDelete
        , cancel: this.detail
        }
      )
  }

, confirmDelete: function(e) {
    console.log('ProjectViews.confirmDelete')
    e.preventDefault()
    Projects.delete(this.selectedProject)
    this.selectedProject = null
    this.list()
  }
})

// ---------------------------------------------------------------- Releases ---

var ReleaseViews = Views.create({
  name: 'ReleaseViews'

, selectedRelease: null

, init: function() {
    console.log('ReleaseViews.init')
    this.el = document.getElementById('releases')
    this.list()
  }

, list: function() {
    console.log('ReleaseViews.list')
    this.render('release:list'
      , { releases: Releases.all() }
      , { select: this.select
        , add: this.add
        }
      )
  }

, select: function(e) {
    console.log('ReleaseViews.select')
    var id = e.target.getAttribute('data-id')
    this.selectedRelease = Releases.get(id)
    this.detail()
  }

, detail: function() {
    console.log('ReleaseViews.detail')
    this.render('release:detail'
      , { release: this.selectedRelease }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

, add: function() {
    console.log('ReleaseViews.add')
    this.render('release:add'
      , { form: ReleaseForm() }
      , { submit: this.createRelease
        , cancel: this.list
        }
      )
  }

, createRelease: function(e) {
    console.log('ReleaseViews.createRelease')
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
    console.log('ReleaseViews.edit')
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
    console.log('ReleaseViews.updateRelease')
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
    console.log('ReleaseViews.preDelete')
    this.render('release:delete'
      , { release: this.selectedRelease }
      , { confirmDelete: this.confirmDelete
        , cancel: this.detail
        }
      )
  }

, confirmDelete: function(e) {
    console.log('ReleaseViews.confirmDelete')
    e.preventDefault()
    Releases.delete(this.selectedRelease)
    this.selectedRelease = null
    this.list()
  }
})

// ---------------------------------------------------------------- Stories ---

var StoryViews = Views.create({
  name: 'StoryViews'

, selectedStory: null

, init: function() {
    console.log('StoryViews.init')
    this.el = document.getElementById('stories')
    this.list()
  }

, list: function() {
    console.log('StoryViews.list')
    this.render('story:list'
      , { stories: Stories.all() }
      , { select: this.select
        , add: this.add
        }
      )
  }

, select: function(e) {
    console.log('StoryViews.select')
    var id = e.target.getAttribute('data-id')
    this.selectedStory = Stories.get(id)
    this.detail()
  }

, detail: function() {
    console.log('StoryViews.detail')
    this.render('story:detail'
      , { story: this.selectedStory }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

, add: function() {
    console.log('StoryViews.add')
    this.render('story:add'
      , { form: StoryForm() }
      , { submit: this.createStory
        , cancel: this.list
        }
      )
  }

, createStory: function(e) {
    console.log('StoryViews.createStory')
    e.preventDefault()
    var form = StoryForm({ data: forms.formData('addStoryForm') })
    if (form.isValid()) {
      Stories.add(new Story(form.cleanedData))
      this.list()
    }
    else {
      replace('storyFormBody', form.asTable())
    }
  }

, edit: function() {
    console.log('StoryViews.edit')
    this.render('story:edit'
      , { story: this.selectedStory
        , form: StoryForm({ initial: this.selectedStory })
        }
      , { submit: this.updateStory
        , cancel: this.detail
        }
      )
  }

, updateStory: function(e) {
    console.log('StoryViews.updateStory')
    e.preventDefault()
    var form = StoryForm({ data: forms.formData('editStoryForm')
                           , initial: this.selectedStory
                           })
    if (form.isValid()) {
      extend(this.selectedStory, form.cleanedData)
      this.selectedStory = null
      this.list()
    }
    else {
      replace('storyFormBody', form.asTable())
    }
  }

, preDelete: function() {
    console.log('StoryViews.preDelete')
    this.render('story:delete'
      , { story: this.selectedStory }
      , { confirmDelete: this.confirmDelete
        , cancel: this.detail
        }
      )
  }

, confirmDelete: function(e) {
    console.log('StoryViews.confirmDelete')
    e.preventDefault()
    Stories.delete(this.selectedStory)
    this.selectedStory = null
    this.list()
  }
})
