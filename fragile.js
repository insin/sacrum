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

var Projects = new Storage(Project)
  , Releases = new Storage(Release)
  , Iterations = new Storage(Iteration)
  , Stories = new Storage(Story)
  , Tasks = new Storage(Task)
  , Users = new Storage(User)

// =================================================================== Forms ===

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

// =================================================================== Views ===

// ------------------------------------------------------------------- Users ---

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

// ----------------------------------------------------------------- Stories ---

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

// =============================================================== Templates ===

with (DOMBuilder.template) {

// --------------------------------------------------------------Users ----

$template({name: 'users:crud:list', extend: 'crud:list'}
, $block('headers'
  , TH('Name')
  , TH('Email')
  , TH('Display name')
  )
)

$template({name: 'users:crud:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.email }}')
  , TD('{{ item.displayName }}')
  )
)

$template({name: 'users:crud:detail', extend: 'crud:detail'}
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

$template({name: 'projects:crud:list', extend: 'crud:list'}
, $block('headers'
  , TH('Project name')
  )
)

$template({name: 'projects:crud:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
)

$template({name: 'projects:crud:detail', extend: 'crud:detail'}
, $block('detailRows'
  , TR(
      TH('Project name')
    , TD('{{ item.name }}')
    )
  )
)

// ---------------------------------------------------------------- Releases ---

$template({name: 'releases:crud:list', extend: 'crud:list'}
, $block('headers'
  , TH('Release name')
  , TH('Project')
  )
)

$template({name: 'releases:crud:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.project }}')
  )
)

$template({name: 'releases:crud:detail', extend: 'crud:detail'}
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

$template({name: 'iterations:crud:list', extend: 'crud:list'}
, $block('headers'
  , TH('Iteration name')
  , TH('Start date')
  , TH('End date')
  )
)

$template({name: 'iterations:crud:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.startDateDisplay }}')
  , TD('{{ item.endDateDisplay }}')
  )
)

$template({name: 'iterations:crud:detail', extend: 'crud:detail'}
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

$template({name: 'stories:crud:list', extend: 'crud:list'}
, $block('headers'
  , TH('Story name')
  , TH('Iteration')
  , TH('State')
  , TH('Blocked')
  , TH('Planned')
  , TH('Owner')
  )
)

$template({name: 'stories:crud:row', extend: 'crud:row'}
, $block('linkText', '{{ item.name }}')
, $block('extraCells'
  , TD('{{ item.iteration }}')
  , TD('{{ item.stateDisplay }}')
  , TD('{{ item.blockedDisplay }}')
  , TD('{{ item.planned }}')
  , TD('{{ item.owner }}')
  )
)

$template({name: 'stories:crud:detail', extend: 'crud:detail'}
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

$template({name: 'tasks:crud:list', extend: 'crud:list'}
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

$template({name: 'tasks:crud:row', extend: 'crud:row'}
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

$template({name: 'tasks:crud:detail', extend: 'crud:detail'}
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
