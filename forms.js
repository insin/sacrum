var TASK_STATE_CHOICES = [
  [States.NOT_STARTED, 'Not Started']
, [States.IN_PROGRESS, 'In Progress']
, [States.COMPLETED,   'Completed']
]

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
})
