// =============================================================== Utilities ===

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

// -------------------------------------------------------------------- User ---

function User(attrs) {
  Model.call(this, attrs)
}
inherits(User, Model)
User._meta = User.prototype._meta = {
  name: 'User'
, namePlural: 'Users'
}
extend(User.prototype, {
  toString: function() {
    return this.displayName
  }
, profileImageDisplay: function() {
    if (this.profileImage) {
      return DOMBuilder.elements.IMG({src: this.profileImage})
    }
    return ''
  }
})

// ----------------------------------------------------------------- Project ---

function Project(attrs) {
  Model.call(this, attrs)
}
inherits(Project, Model)
Project._meta = Project.prototype._meta = {
  name: 'Project'
, namePlural: 'Projects'
}
Project.prototype.toString = function() {
  return this.name
}

// ----------------------------------------------------------------- Package ---

inherits(Package, Model)
function Package(attrs) {
  Model.call(this, attrs)
}
Package._meta = Package.prototype._meta = {
  name: 'Package'
, namePlural: 'Packages'
}
Package.prototype.toString = function() {
  return this.name
}

// ----------------------------------------------------------------- Release ---

function Release(attrs) {
  Model.call(this, attrs)
}
inherits(Release, Model)
Release._meta = Release.prototype._meta = {
  name: 'Release'
, namePlural: 'Releases'
}
Release.States = { PLANNING: 'P'
                 , ACTIVE:   'X'
                 , ACCEPTED: 'A'
                 }
Release.StateChoices = [ [Release.States.PLANNING, 'Planning']
                       , [Release.States.ACTIVE,   'Active']
                       , [Release.States.ACCEPTED, 'Accepted']
                       ]
extend(Release.prototype, {
  toString: function() {
    return this.name
  }
, themeDisplay: function() {
    return lineBreaks(this.theme)
  }
, startDateDisplay: function() {
    return formatDate(this.startDate)
  }
, releaseDateDisplay: function() {
    return formatDate(this.releaseDate)
  }
, stateDisplay: function() {
    return forms.util.itemsToObject(Release.StateChoices)[this.state]
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
})

// --------------------------------------------------------------- Iteration ---

function Iteration(attrs) {
  Model.call(this, attrs)
}
inherits(Iteration, Model)
Iteration._meta = Iteration.prototype._meta = {
  name: 'Iteration'
, namePlural: 'Iterations'
}
Iteration.States = { PLANNING:  'P'
                   , COMMITTED: 'C'
                   , ACCEPTED:  'A'
                   }
Iteration.StateChoices = [ [Iteration.States.PLANNING,  'Planning']
                         , [Iteration.States.COMMITTED, 'Committed']
                         , [Iteration.States.ACCEPTED,  'Accepted']
                         ]
extend(Iteration.prototype, {
  toString: function() {
    return this.name
  }
, themeDisplay: function() {
    return lineBreaks(this.theme)
  }
, startDateDisplay: function() {
    return formatDate(this.startDate)
  }
, endDateDisplay: function() {
    return formatDate(this.endDate)
  }
, stateDisplay: function() {
    return forms.util.itemsToObject(Iteration.StateChoices)[this.state]
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
})

// ------------------------------------------------------------------- Story ---

function Story(attrs) {
  Model.call(this, attrs)
}
inherits(Story, Model)
Story._meta = Story.prototype._meta = {
  name: 'Story'
, namePlural: 'Stories'
}
Story.States = { SCOPED:      'S'
               , DEFINED:     'D'
               , IN_PROGRESS: 'P'
               , COMPLETED:   'C'
               , ACCEPTED:    'A'
               }
Story.StateChoices = [ [Story.States.SCOPED,      'Scoped']
                     , [Story.States.DEFINED,     'Defined']
                     , [Story.States.IN_PROGRESS, 'In-Progress']
                     , [Story.States.COMPLETED,   'Completed']
                     , [Story.States.ACCEPTED,    'Accepted']
                     ]
extend(Story.prototype, {
  toString: function() {
    return this.name
  }
, stateDisplay: function() {
    return forms.util.itemsToObject(Story.StateChoices)[this.state]
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

// -------------------------------------------------------------------- Task ---

function Task(attrs) {
  Model.call(this, attrs)
}
inherits(Task, Model)
Task._meta = Task.prototype._meta = {
  name: 'Task'
, namePlural: 'Tasks'
}
Task.States = { DEFINED:     'D'
              , IN_PROGRESS: 'P'
              , COMPLETED:   'C'
              }
Task.StateChoices = [ [Task.States.DEFINED,     'Defined']
                    , [Task.States.IN_PROGRESS, 'In-Progress']
                    , [Task.States.COMPLETED,   'Completed']
                    ]
extend(Task.prototype, {
  toString: function() {
    return this.name
  }
, getProject: function() {
    return this.story.project
  }
, stateDisplay: function() {
    return forms.util.itemsToObject(Task.StateChoices)[this.state]
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

var Projects = new Storage(Project)
  , Packages = new Storage(Package)
  , Releases = new Storage(Release)
  , Iterations = new Storage(Iteration)
  , Stories = new Storage(Story)
  , Tasks = new Storage(Task)
  , Users = new Storage(User)

// =================================================================== Forms ===

var UserForm = forms.Form({
  name: forms.CharField({maxLength: 255})
, email: forms.EmailField()
, displayName: forms.CharField({maxLength: 50})
, profileImage: forms.URLField({required: false})
})

var ProjectForm = forms.Form({
  name: forms.CharField({maxLength: 50})
})

var PackageForm = forms.Form({
  name: forms.CharField({maxLength: 50})
})

var ReleaseForm = forms.Form({
  name: forms.CharField({maxLength: 50})
, theme: forms.CharField({required: false, widget: forms.Textarea})
, startDate: forms.DateField()
, releaseDate: forms.DateField()
, state: forms.ChoiceField({choices: Release.StateChoices})
, resources: forms.DecimalField({required: false, minValue: 0})
, project: forms.ModelChoiceField(Projects.query())
, estimate: forms.DecimalField({required: false, minValue: 0})
, notes: forms.CharField({required: false, widget: forms.Textarea})

, clean: function() {
    if (this.cleanedData.startDate && this.cleanedData.releaseDate &&
        this.cleanedData.startDate > this.cleanedData.releaseDate) {
      throw new forms.ValidationError('Release Date cannot be prior to Start Date.')
    }
    return this.cleanedData
  }
})

var IterationForm = forms.Form({
  name: forms.CharField({maxLength: 50})
, theme: forms.CharField({required: false, widget: forms.Textarea})
, startDate: forms.DateField()
, endDate: forms.DateField()
, state: forms.ChoiceField({choices: Iteration.StateChoices})
, resources: forms.DecimalField({required: false, minValue: 0})
, project: forms.ModelChoiceField(Projects.query())
, estimate: forms.DecimalField({required: false, minValue: 0})
, notes: forms.CharField({required: false, widget: forms.Textarea})

, clean: function() {
    if (this.cleanedData.startDate && this.cleanedData.endDate &&
        this.cleanedData.startDate > this.cleanedData.endDate) {
      throw new forms.ValidationError('End Date cannot be prior to Start Date.')
    }
    return this.cleanedData
  }
})

var StoryForm = forms.Form({
  name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea, required: false})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, package: forms.ModelChoiceField(Packages.query(), {required: false})
, project: forms.ModelChoiceField(Projects.query())
, parent: forms.ModelChoiceField(Stories.query(), {required: false})
, state: forms.ChoiceField({choices: Story.StateChoices, initial: Story.States.SCOPED})
, blocked: forms.BooleanField({required: false, initial: false})
, release: forms.ModelChoiceField(Releases.query(), {required: false})
, iteration: forms.ModelChoiceField(Iterations.query(), {required: false})
, planEstimate: forms.DecimalField({required: false, minValue: 0})
, rank: forms.CharField({required: false, maxLength: 50})
, notes: forms.CharField({required: false, widget: forms.Textarea})
})

var TaskForm = forms.Form({
  name: forms.CharField({maxLength: 255})
, description: forms.CharField({required: false, widget: forms.Textarea})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, state: forms.ChoiceField({choices: Task.StateChoices, initial: Task.States.DEFINED})
, blocked: forms.BooleanField({required: false, initial: false})
, estimate: forms.DecimalField({required: false, minValue: 0})
, actuals: forms.DecimalField({required: false, minValue: 0})
, todo: forms.DecimalField({required: false, minValue: 0})
, story: forms.ModelChoiceField(Stories.query())
, rank: forms.CharField({required: false, maxLength: 50})
, notes: forms.CharField({required: false, widget: forms.Textarea})
})

// =================================================================== Views ===

// ------------------------------------------------------- Model Admin Views ---

var UserAdminViews = ModelAdminViews.extend({
  name: 'UserAdminViews'
, namespace: 'users'
, storage: Users
, form: UserForm
})

var ProjectViews = ModelAdminViews.extend({
  name: 'ProjectAdminViews'
, namespace: 'projects'
, storage: Projects
, form: ProjectForm
})

var PackageViews = ModelAdminViews.extend({
  name: 'PackageAdminViews'
, namespace: 'packages'
, storage: Packages
, form: PackageForm
})

var ReleaseViews = ModelAdminViews.extend({
  name: 'ReleaseAdminViews'
, namespace: 'releases'
, storage: Releases
, form: ReleaseForm
})

var IterationViews = ModelAdminViews.extend({
  name: 'IterationAdminViews'
, namespace: 'iterations'
, storage: Iterations
, form: IterationForm
})

var StoryViews = ModelAdminViews.extend({
  name: 'StoryAdminViews'
, namespace: 'stories'
, storage: Stories
, form: StoryForm
})

var TaskAdminViews = ModelAdminViews.extend({
  name: 'TaskAdminViews'
, namespace: 'tasks'
, storage: Tasks
, form: TaskForm
})

// ------------------------------------------------------------- Admin Views ---

var AdminViews = Views.extend({
  name: 'AdminViews'

, modelViews: []
, selectedModelViews: null

, init: function() {
    this.log('init')
    this.header = document.getElementById('admin-header')
    this.el = document.getElementById('admin-content')

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
    this.log('index')
    replace(this.header, 'Admin')
    this.display('admin:index'
      , { modelViews: this.modelViews }
      , { select: this.selectModelViews }
      )
  }

  /**
   * Selects a ModelAdminView and displays its list.
   */
, selectModelViews: function(e) {
    this.log('selectModelView')
    e.preventDefault()
    var selectedViewIndex = e.target.getAttribute('data-index')
    var views = this.modelViews[selectedViewIndex]
    replace(this.header,
      this.render('admin:header'
        , { modelName: views.storage.model._meta.namePlural }
        , { index: this.index
          , backToList: this.backToList
          }
        ))
    this.selectedModelViews = views
    views.list()
  }

  /**
   * Re-lists the selected ModelAdminView. Temporary workaround until
   * URLs/history are implemented.
   */
, backToList: function() {
    this.selectedModelViews.list()
  }

, getURLs: function() {
    var urlPatterns =
        patterns(this
        , url('', 'index', 'admin_index')
        )
    for (var i = 0, l = this.modelViews.length; i < l; i++) {
      var modelViews = this.modelViews[i]
      urlPatterns = urlPatterns.concat(
          patterns(null
          , url(modelViews.namespace + '/', include(modelViews.getURLs()))
          )
        )
    }
    return urlPatterns
  }
})

// =============================================================== Templates ===

!function() { with (DOMBuilder.template) {

var template = DOMBuilder.template

/**
 * Creates a detail section.
 */
function section(label, rows) {
  var els = [
    template.TR({'class': 'section'}
    , template.TD({colSpan: 4}, label)
    )
  ]

  if (rows) {
    for (var i = 0, l = rows.length; i < l; i++) {
      var row = rows[i]
        , rowFunc = (row.length == 2 ? singleRow : multiRow);
      els.push(rowFunc.apply(null, row))
    }
  }

  return els
}

/**
 * Creates a row containing a single item in a detail section.
 */
function singleRow(label, value) {
 return template.TR(
          template.TH(label + ':')
        , template.TD({colSpan: 3}, '{{ item.' + value + ' }}')
        )
}

/**
 * Creates a row containing a pair of items in a detail section.
 */
function multiRow(label1, value1, label2, value2) {
 return template.TR(
          template.TH(label1 + ':')
        , template.TD('{{ item.' + value1 + ' }}')
        , template.TH(label2 + ':')
        , template.TD('{{ item.' + value2 + ' }}')
        )
}

// -------------------------------------------------------------- User Admin ---

$template({name: 'users:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Email')
  , TH('Display name')
  )
)

$template({name: 'users:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.email }}')
  , TD('{{ item.displayName }}')
  )
)

$template({name: 'users:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('Account Information',
        [ ['Email Address', 'email']
        , ['Name'         , 'name' ]
        ]
      )

  , section('Display Preferences',
        [ ['Display Name' , 'displayName'        ]
        , ['Profile Image', 'profileImageDisplay']
        ]
      )
  )
)

// ----------------------------------------------------------- Release Admin ---

$template({name: 'releases:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Theme')
  , TH('Start Date')
  , TH('Release Date')
  , TH('State')
  )
)

$template({name: 'releases:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.themeDisplay }}')
  , TD('{{ item.startDateDisplay }}')
  , TD('{{ item.releaseDateDisplay }}')
  , TD('{{ item.stateDisplay }}')
  )
)

$template({name: 'releases:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('General',
        [ ['Name'         , 'name'            ]
        , ['Theme'        , 'themeDisplay'    ]
        , ['Start Date'   , 'startDateDisplay', 'Release Date', 'releaseDateDisplay']
        , ['State'        , 'stateDisplay'    , 'Resources'   , 'resources'         ]
        , ['Project'      , 'project'         ]
        , ['Plan Estimate', 'estimate'        ]
        , ['Notes'        , 'notesDisplay'    ]
        ]
      )
  )
)

// --------------------------------------------------------- Iteration Admin ---

$template({name: 'iterations:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Theme')
  , TH('Start Date')
  , TH('End Date')
  , TH('State')
  )
)

$template({name: 'iterations:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.themeDisplay }}')
  , TD('{{ item.startDateDisplay }}')
  , TD('{{ item.endDateDisplay }}')
  , TD('{{ item.stateDisplay }}')
  )
)

$template({name: 'iterations:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('General',
        [ ['Name'         , 'name'            ]
        , ['Theme'        , 'themeDisplay'    ]
        , ['Start Date'   , 'startDateDisplay', 'End Date' , 'endDateDisplay']
        , ['Project'      , 'project'         ]
        , ['State'        , 'stateDisplay'    , 'Resources', 'resources'     ]
        , ['Plan Estimate', 'estimate'        ]
        , ['Notes'        , 'notesDisplay'    ]
        ]
      )
  )
)

// ----------------------------------------------------------------- Stories ---

$template({name: 'stories:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Release')
  , TH('Iteration')
  , TH('State')
  , TH('Blocked')
  , TH('Plan Est')
  , TH('Owner')
  )
)

$template({name: 'stories:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.release }}')
  , TD('{{ item.iteration }}')
  , TD('{{ item.stateDisplay }}')
  , TD('{{ item.blockedDisplay }}')
  , TD('{{ item.planEstimate }}')
  , TD('{{ item.owner }}')
  )
)

$template({name: 'stories:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('General', [ ['ID'         , 'id'                ]
                       , ['Name'       , 'name'              ]
                       , ['Description', 'descriptionDisplay']
                       , ['Owner'      , 'owner'             , 'Package', 'package']
                       , ['Project'    , 'project'           ]
                       ])

  , section('Story',
        [ ['Parent', 'parent'] ]
      )

  , section('Schedule',
        [ ['State'   , 'stateDisplay', 'Blocked'  , 'blockedDisplay']
        , ['Release' , 'release'     , 'Iteration', 'iteration'     ]
        , ['Plan Est', 'planEstimate']
        , ['Rank'    , 'rank'        ]
        ]
      )

  , section('Notes',
        [ ['Notes', 'notesDisplay'] ]
      )
  )
)

// ------------------------------------------------------------------- Tasks ---

$template({name: 'tasks:admin:list', extend: 'admin:list'}
, $block('headers'
  , TH('Name')
  , TH('Story')
  , TH('Release')
  , TH('Iteration')
  , TH('State')
  , TH('Blocked')
  , TH('Estimate')
  , TH('To Do')
  , TH('Actuals')
  , TH('Owner')
  )
)

$template({name: 'tasks:admin:listRow', extend: 'admin:listRow'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.story }}')
  , TD('{{ item.story.release }}')
  , TD('{{ item.story.iteration }}')
  , TD('{{ item.stateDisplay }}')
  , TD('{{ item.blockedDisplay }}')
  , TD('{{ item.estimate }}')
  , TD('{{ item.todo }}')
  , TD('{{ item.actuals }}')
  , TD('{{ item.owner }}')
  )
)

$template({name: 'tasks:admin:detail', extend: 'admin:detail'}
, $block('detailRows'
  , section('General',
        [ ['ID'         , 'id'                ]
        , ['Name'       , 'name'              ]
        , ['Description', 'descriptionDisplay']
        , ['Owner'      , 'owner'             ]
        , ['Project'    , 'getProject'        ]
        ]
      )

  , section('Task',
        [ ['State',    'stateDisplay', 'Blocked', 'blockedDisplay']
        , ['Estimate', 'estimate',     'Actuals', 'actuals'       ]
        , ['To Do',    'todo'        ]
        , ['Story',    'story'       ]
        , ['Rank',     'rank'        ]
        ]
      )

  , section('Notes',
        [ ['Notes', 'notesDisplay'] ]
      )
  )
)

// ----------------------------------------------------- AdminView Templates ---

$template('admin:header'
, $if('modelName'
  , SPAN({click: $func('events.index'), 'class': 'link'}, 'Admin')
  , ' : '
  , SPAN({click: $func('events.backToList'), 'class': 'link'}, '{{ modelName }}')
  , $else('Admin')
  )
)

$template('admin:index'
, TABLE({'class': 'list'}
  , THEAD(TR(
      TH('Model')
    ))
  , TBODY($for('modelView in modelViews'
    , $cycle(['odd', 'even'], {as: 'rowClass', silent: true})
    , TR({'class': 'link {{ rowClass }}'}
      , TD({click: $func('events.select'), 'data-index': '{{ forloop.counter0 }}'}
        , $func('modelView.storage.model._meta.name')
        )
      )
    ))
  )
)

}}()

// ============================================================= Sample Data ===

!function() {
  var u1 = Users.add(new User({name: 'User 1', email: 'a@a.com', displayName: 'User 1', profileImage: 'http://jonathan.buchanan153.users.btopenworld.com/adventurer.png'}))
    , u2 = Users.add(new User({name: 'User 2', email: 'b@b.com', displayName: 'User 2', profileImage: 'http://jonathan.buchanan153.users.btopenworld.com/kiwi.png'}))
    , p1 = Projects.add(new Project({name: 'Project 1'}))
    , p2 = Projects.add(new Project({name: 'Project 2'}))
    , pa1 = Packages.add(new Package({name: 'Package 1'}))
    , pa2 = Packages.add(new Package({name: 'Package 2'}))
    , r1 = Releases.add(new Release({name: 'Release 1', startDate: new Date(2010, 5, 1), releaseDate: new Date(2010, 11, 16), project: p1, resources: 76.5, estimate: 54.0}))
    , r2 = Releases.add(new Release({name: 'Release 2', startDate: new Date(2011, 1, 1), releaseDate: new Date(2011, 9, 16), project: p1, resources: 76.5, estimate: 54.0}))
    , r3 = Releases.add(new Release({name: 'Release 1', startDate: new Date(2011, 3, 16), releaseDate: new Date(2012, 6, 1), project: p2, resources: 76.5, estimate: 54.0}))
    , i1 = Iterations.add(new Iteration({name: 'Sprint 1', startDate: new Date(2010, 5, 1), endDate: new Date(2010, 6, 1), project: p1, resources: 76.5, estimate: 54.0}))
    , i2 = Iterations.add(new Iteration({name: 'Sprint 2', startDate: new Date(2010, 6, 1), endDate: new Date(2010, 7, 1), project: p1, resources: 76.5, estimate: 54.0}))
    , s1 = Stories.add(new Story({name: 'Story 1', project: p1, parent: null, state: Story.States.IN_PROGRESS, owner: u1, package: p1, release: r1, iteration: i1, planEstimate: 20.0, rank: 1.0}))
    , t1 = Tasks.add(new Task({name: 'Task 1', state: Task.States.IN_PROGRESS, estimate: 15.0, actuals: 5.0, todo: 10.0, story: s1, owner: u1, rank: 2.0}))
}()

window.onload = function() {
  AdminViews.init()
  URLConf.patterns = AdminViews.getURLs()
  // TODO Invoke navigation to start URL instead
  AdminViews.index()
  console.info(resolve('/projects/'))
  console.info(reverse('admin_users_edit', [123]))
}
