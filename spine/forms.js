function constructInstance(form, instance, kwargs) {
  kwargs = forms.util.extend({
    fields: null, exclude: null
  }, kwargs || {})
  var cleanedData = form.cleanedData
  var modelAttributes = instance.constructor.attributes[0]
  for (var i = 0, l = modelAttributes.length, f; i < l; i++) {
    f = modelAttributes[i]
    if (kwargs.fields !== null &&
        !forms.util.contains(kwargs.fields, f)) {
      continue
    }
    if (kwargs.exclude !== null &&
        forms.util.contains(kwargs.exclude, f)) {
      continue
    }
    instance[f] = cleanedData[f]
  }
  return instance
}

function saveInstance(form, instance, kwargs) {
  kwargs = forms.util.extend({
    fields: null, commit: true, exclude: null, construct: true, failMessage: 'save'
  }, kwargs || {})
  if (kwargs.construct) {
    instance = constructInstance(form, instance, {
      fields: kwargs.fields, exclude: kwargs.exclude
    })
  }
  if (form.errors().isPopulated()) {
    throw new Error(form.utils.format(
      "The %(model)s could not be %(message)s because the data didn't validate",
      {model: modelConstructor.className, message: kwargs.failMessage}
    ))
  }

  if (kwargs.commit) {
    instance.save()
  }
  return instance
}

function modelToObject(instance, kwargs) {
  kwargs = forms.util.extend({
    fields: null, exclude: null
  }, kwargs || {})
  var data = {}
  var modelAttributes = instance.constructor.attributes[0]
  for (var i = 0, l = modelAttributes.length, f; i < l; i++) {
    f = modelAttributes[i]
    if (kwargs.fields !== null &&
        !forms.util.contains(kwargs.fields, f)) {
      continue
    }
    if (kwargs.exclude !== null &&
        forms.util.contains(kwargs.exclude, f)) {
      continue
    }
    data[f] = instance[f]
  }
  return data
}

function ModelChoiceField(queryset, kwargs) {

}
forms.util.inherits(ModelChoiceField, ChoiceField)

function ModelMultipleChoiceField(queryset, kwargs) {

}
forms.util.inherits(ModelMultipleChoiceField, ModelChoiceField)