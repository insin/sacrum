var User = Spine.Model.setup('User', [
  'username'
, 'email'
, 'name'
, 'displayName'
, 'image'
])

var Project = Spine.Model.setup('Project', [
  'name'
])

var Release = Spine.Model.setup('Release', [
  'name'
])

var Iteration = Spine.Model.setup('Iteration', [
  'project'
, 'name'
, 'startDate'
, 'endDate'
])

var Story = Spine.Model.setup('Story', [
  'iteration'
, 'name'
, 'description'
, 'owner'
, 'state'
, 'blocked'
, 'planned'
, 'notes'
])

var Task = Spine.Model.setup('Task', [
  'story'
, 'name'
, 'description'
, 'owner'
, 'state'
, 'blocked'
, 'estimated'
, 'actual'
, 'todo'
, 'notes'
])

