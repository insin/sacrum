QUnit.module('Models')

void function() {

var Model = Sacrum.Model
  , ModelOptions = Sacrum.ModelOptions

QUnit.test('Model.extend', function() {
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
  equal(Test._meta.name, 'Test', '_meta name property set')
  equal(Test._meta.namePlural, 'Tests', '_meta namePlural property defaults to name + "s"')

  // Minimal information for extending a Model
  var Test = Model.extend({
    Meta: {
      name: 'Test'
    , namePlural: 'Testies'
    }
  })
  equal(Test._meta.namePlural, 'Testies', '_meta namePlural property set if given')
})

}()
