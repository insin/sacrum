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
  name: forms.CharField({maxLength: 50})
})

var IterationForm = forms.Form({
  name: forms.CharField({maxLength: 50})
})

var StoryForm = forms.Form({
  name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea})
, state: forms.ChoiceField({choices: STORY_STATE_CHOICES})
, blocked: forms.BooleanField({default: false})
, planned: forms.DecimalField({minValue: 0})
, owner: forms.ChoiceField()
, notes: forms.CharField({widget: forms.Textarea})
, postInit: function(kwargs) {
    this.fields.owner.setChoices(kwargs.ownerUsers)
  }
})

var TaskForm = forms.Form({
  name: forms.CharField({maxLength: 255})
, description: forms.CharField({widget: forms.Textarea})
, state: forms.ChoiceField({choices: TASK_STATE_CHOICES})
, blocked: forms.BooleanField({default: false})
, estimated: forms.DecimalField({minValue: 0})
, actual: forms.DecimalField({minValue: 0})
, todo: forms.DecimalField({minValue: 0})
, owner: forms.ChoiceField()
, notes: forms.CharField({widget: forms.Textarea})
, postInit: function(kwargs) {
    this.fields.owner.setChoices(kwargs.ownerUsers)
  }
})
