// Utility blah

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
  return function() {
    if (curried) {
      return fn.apply(ctx, curried.concat(Array.prototype.slice.call(arguments)))
    }
    return fn.apply(ctx, arguments)
  }
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

// Models

function Project(attrs) {
  extend(this, attrs)
}

var Projects = {
  _store: {}
, _idSeed: 1

, add: function(project) {
    project.id = this._idSeed++
    this._store[project.id] = project
  }

, all: function() {
    var a = []
    for (var id in this._store) {
      a.push(this._store[id])
    }
    return a
  }

, get: function(id) {
    return this._store[id]
  }

, delete: function(project) {
    delete this._store[project.id]
  }
}

// Forms

var ProjectForm = forms.Form({
  name: forms.CharField({maxLength: 50})
})

// Templates

with (DOMBuilder.template) {

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
    , ' | '
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
    , ' | '
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
    , ' | '
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
  , ' | '
  , SPAN({click: $func('events.cancel')}, 'Cancel')
  )
)

}

// Views

var ProjectViews = {
  // State
  selectedProject: null

, init: function() {
    console.log('ProjectViews.init')
    this.el = document.getElementById('projects')
    this.list()
  }

, display: function(templateName, context, events) {
    if (events) {
      for (var e in events) {
        events[e] = bind(events[e], this)
      }
      context.events = events
    }
    replace(this.el, DOMBuilder.template.renderTemplate(templateName, context))
  }

, list: function() {
    console.log('ProjectViews.list')
    this.display('project:list'
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
    this.display('project:detail'
      , { project: this.selectedProject }
      , { edit: this.edit
        , preDelete: this.preDelete
        }
      )
  }

, add: function() {
    console.log('ProjectViews.add')
    this.display('project:add'
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
    this.display('project:edit'
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
    this.display('project:delete'
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
}
