QUnit.module('Models')

!function() {

var Model = Sacrum.Model
  , ModelOptions = Sacrum.ModelOptions

test('Model.extend', function() {
  // Minimal information for extending a Model
  var Test = Model.extend({
    Meta: {
      name: 'Test'
    }
  })

  equal(typeof Test.prototype.Meta, 'undefined', 'Meta object is removed from prototype props')
  ok(Test.prototype._meta instanceof ModelOptions, 'ModelOptions object exposed as prototype._meta')
  ok(Test._meta instanceof ModelOptions, 'ModelOptions object exposed as constructor._meta')
  strictEqual(Test.prototype._meta, Test._meta, 'ModelOptions object is the same on prototype and constructor')
  equal(Test._meta.name, 'Test', '_meta name attribute set')
  equal(Test._meta.namePlural, 'Tests', '_meta namePlural attribute defaults to name + "s"')

  // Minimal information for extending a Model
  var Test = Model.extend({
    Meta: {
      name: 'Test'
    , namePlural: 'Testies'
    }
  })
  equal(Test._meta.namePlural, 'Testies', '_meta namePlural attribute set if given')
})

}()
