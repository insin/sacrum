var server = (typeof window == 'undefined')

var Sacrum = require('../../lib/sacrum')
  , Admin = Sacrum.Admin
  , object = require('isomorph').object
  , time = require('isomorph').time
  , urlresolve = require('urlresolve')
  , URLConf = Sacrum.URLConf
  , DOMBuilder = require('DOMBuilder')
  , forms = require('newforms')

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
  return time.strftime(d, '%b %d, %Y')
}

// ================================================================== Models ===

// -------------------------------------------------------------------- User ---

var User = Sacrum.Model.extend({
  toString: function() {
    return this.displayName
  }
, profileImageDisplay: function() {
    if (this.profileImage) {
      return DOMBuilder.elements.IMG({src: this.profileImage})
    }
    return ''
  }
, Meta: {
    name: 'User'
  }
})

// ----------------------------------------------------------------- Project ---

var Project = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, Meta: {
    name: 'Project'
  }
})

// ----------------------------------------------------------------- Package ---

var Package = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, Meta: {
    name: 'Package'
  }
})

// ----------------------------------------------------------------- Release ---

var Release = Sacrum.Model.extend({
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
    return object.fromItems(Release.StateChoices)[this.state]
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
, Meta: {
    name: 'Release'
  }
})

Release.States = { PLANNING: 'P'
                 , ACTIVE:   'X'
                 , ACCEPTED: 'A'
                 }

Release.StateChoices = [ [Release.States.PLANNING, 'Planning']
                       , [Release.States.ACTIVE,   'Active']
                       , [Release.States.ACCEPTED, 'Accepted']
                       ]

// --------------------------------------------------------------- Iteration ---

var Iteration = Sacrum.Model.extend({
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
    return object.fromItems(Iteration.StateChoices)[this.state]
  }
, notesDisplay: function() {
    return lineBreaks(this.notes)
  }
, Meta: {
    name: 'Iteration'
  }
})

Iteration.States = { PLANNING:  'P'
                   , COMMITTED: 'C'
                   , ACCEPTED:  'A'
                   }
Iteration.StateChoices = [ [Iteration.States.PLANNING,  'Planning']
                         , [Iteration.States.COMMITTED, 'Committed']
                         , [Iteration.States.ACCEPTED,  'Accepted']
                         ]

// ------------------------------------------------------------------- Story ---

var Story = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, stateDisplay: function() {
    return object.fromItems(Story.StateChoices)[this.state]
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
, Meta: {
    name: 'Story'
  , namePlural: 'Stories'
  }
})

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

// -------------------------------------------------------------------- Task ---

var Task = Sacrum.Model.extend({
  toString: function() {
    return this.name
  }
, getProject: function() {
    return this.story.project
  }
, stateDisplay: function() {
    return object.fromItems(Task.StateChoices)[this.state]
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
, Meta: {
    name: 'Task'
  }
})

Task.States = { DEFINED:     'D'
              , IN_PROGRESS: 'P'
              , COMPLETED:   'C'
              }

Task.StateChoices = [ [Task.States.DEFINED,     'Defined']
                    , [Task.States.IN_PROGRESS, 'In-Progress']
                    , [Task.States.COMPLETED,   'Completed']
                    ]

// ----------------------------------------------- Model Storage / Retrieval ---

var Projects = new Sacrum.Storage(Project)
  , Packages = new Sacrum.Storage(Package)
  , Releases = new Sacrum.Storage(Release)
  , Iterations = new Sacrum.Storage(Iteration)
  , Stories = new Sacrum.Storage(Story)
  , Tasks = new Sacrum.Storage(Task)
  , Users = new Sacrum.Storage(User)

// =================================================================== Forms ===

var UserForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 255})
, email: forms.EmailField()
, displayName: forms.CharField({maxLength: 50})
, profileImage: forms.URLField({required: false})
})

var ProjectForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 50})
})

var PackageForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 50})
})

var ReleaseForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 50})
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

var IterationForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 50})
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

var StoryForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea, required: false})
, owner: forms.ModelChoiceField(Users.query(), {required: false})
, pkg: forms.ModelChoiceField(Packages.query(), {required: false})
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

var TaskForm = forms.Form.extend({
  requiredCssClass: 'required'
, errorCssClass: 'error'

, name: forms.CharField({maxLength: 255})
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

var UserAdminViews = new Admin.ModelAdminViews({
  name: 'UserAdminViews'
, namespace: 'users'
, storage: Users
, form: UserForm
})

var ProjectAdminViews = new Admin.ModelAdminViews({
  name: 'ProjectAdminViews'
, namespace: 'projects'
, storage: Projects
, form: ProjectForm
})

var PackageAdminViews = new Admin.ModelAdminViews({
  name: 'PackageAdminViews'
, namespace: 'packages'
, storage: Packages
, form: PackageForm
})

var ReleaseAdminViews = new Admin.ModelAdminViews({
  name: 'ReleaseAdminViews'
, namespace: 'releases'
, storage: Releases
, form: ReleaseForm
})

var IterationAdminViews = new Admin.ModelAdminViews({
  name: 'IterationAdminViews'
, namespace: 'iterations'
, storage: Iterations
, form: IterationForm
})

var StoryAdminViews = new Admin.ModelAdminViews({
  name: 'StoryAdminViews'
, namespace: 'stories'
, storage: Stories
, form: StoryForm
})

var TaskAdminViews = new Admin.ModelAdminViews({
  name: 'TaskAdminViews'
, namespace: 'tasks'
, storage: Tasks
, form: TaskForm
})

// =============================================================== Templates ===

void function() { with (DOMBuilder.template) {

// ------------------------------------------------ ModelAdminView Templates ---

var template = DOMBuilder.template

/**
 * Creates a detail section consisting of pairs of name:value cells, with up to
 * two pairs displayed per row.
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
        , rowFunc = (row.length == 2 ? singleRow : multiRow)
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

// ------------------------------------------------------------- Story Admin ---

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
  , section('General',
        [ ['ID'         , 'id'                ]
        , ['Name'       , 'name'              ]
        , ['Description', 'descriptionDisplay']
        , ['Owner'      , 'owner'             , 'Package', 'pkg']
        , ['Project'    , 'project'           ]
        ]
      )

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

// -------------------------------------------------------------- Task Admin ---

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

}}()

// ============================================================= Sample Data ===

void function() {
  var u1 = Users.add(new User({name: 'User 1', email: 'a@a.com', displayName: 'User 1', profileImage: 'http://jonathan.buchanan153.users.btopenworld.com/adventurer.png'}))
    , u2 = Users.add(new User({name: 'User 2', email: 'b@b.com', displayName: 'User 2', profileImage: 'http://jonathan.buchanan153.users.btopenworld.com/kiwi.png'}))
    , p1 = Projects.add(new Project({name: 'Project 1'}))
    , p2 = Projects.add(new Project({name: 'Project 2'}))
    , pa1 = Packages.add(new Package({name: 'Package 1'}))
    , pa2 = Packages.add(new Package({name: 'Package 2'}))
    , r1 = Releases.add(new Release({name: 'Release 1', theme: 'Do the thing.\n\nAnd the other thing.', state: Release.States.ACTIVE, startDate: new Date(2010, 5, 1), releaseDate: new Date(2010, 11, 16), project: p1, resources: 76.5, estimate: 54.0}))
    , r2 = Releases.add(new Release({name: 'Release 2', theme: 'This and that.\n\nNothing major.', state: Release.States.PLANNING, startDate: new Date(2011, 1, 1), releaseDate: new Date(2011, 9, 16), project: p1, resources: 76.5, estimate: 54.0}))
    , r3 = Releases.add(new Release({name: 'Release 3', theme: 'Months of firefighting.', state: Release.States.PLANNING, startDate: new Date(2011, 3, 16), releaseDate: new Date(2012, 6, 1), project: p2, resources: 76.5, estimate: 54.0}))
    , i1 = Iterations.add(new Iteration({name: 'Sprint 1', theme: 'Getting started.', state: Iteration.States.COMMITTED, startDate: new Date(2010, 5, 1), endDate: new Date(2010, 6, 1), project: p1, resources: 76.5, estimate: 54.0}))
    , i2 = Iterations.add(new Iteration({name: 'Sprint 2', theme: 'Big, risky stories.', state: Iteration.States.PLANNING, startDate: new Date(2010, 6, 1), endDate: new Date(2010, 7, 1), project: p1, resources: 76.5, estimate: 54.0}))
    , s1 = Stories.add(new Story({name: 'Story 1', project: p1, parent: null, state: Story.States.IN_PROGRESS, owner: u1, pkg: pa1, release: r1, iteration: i1, planEstimate: 20.0, rank: 1.0}))
    , t1 = Tasks.add(new Task({name: 'Task 1', state: Task.States.IN_PROGRESS, estimate: 15.0, actuals: 5.0, todo: 10.0, story: s1, owner: u1, rank: 2.0}))
}()

// ===================================================== Export / Initialise ===

function init() {
  Admin.AdminViews.init()
  URLConf.patterns = [ urlresolve.url('admin/', Admin.AdminViews.getURLs()) ]
}

var Fragile = {
  util: {
    lineBreaks: lineBreaks
  , formatDate: formatDate
  }
, User: User
, Project: Project
, Release: Release
, Iteration: Iteration
, Story: Story
, Task: Task
, Users: Users
, Projects: Projects
, Releases: Releases
, Iterations: Iterations
, Stories: Stories
, Tasks: Tasks
, UserForm: UserForm
, ProjectForm: ProjectForm
, ReleaseForm: ReleaseForm
, IterationForm: IterationForm
, StoryForm: StoryForm
, TaskForm: TaskForm
, UserAdminViews: UserAdminViews
, ProjectAdminViews: ProjectAdminViews
, ReleaseAdminViews: ReleaseAdminViews
, IterationAdminViews: IterationAdminViews
, StoryAdminViews: StoryAdminViews
, TaskAdminViews: TaskAdminViews
, init: init
}

module.exports = Fragile

if (!server) {
  if (window.location.protocol != 'file:') {
    window.onpopstate = Sacrum.handlePopURLState
  }
  window.onload = function() {
    init()
    var path = window.location.pathname
    // If running via the static page, always start at the index
    if (path.indexOf('.html') == path.length - 5) {
      path = '/admin/'
    }
    URLConf.resolve(path).func()
  }
}
