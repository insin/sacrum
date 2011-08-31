QUnit.module('Utilities')

!function() {

var parseQueryString = Sacrum.util.parseQueryString
  , toQueryString = Sacrum.util.toQueryString

test('parseQueryString', function() {
  deepEqual(parseQueryString('?'), {})
  deepEqual(parseQueryString('?foo=bar'), {foo: 'bar'})
  deepEqual(parseQueryString('?foo=bar&baz=ter'), {foo: 'bar', baz: 'ter'})
  deepEqual(parseQueryString('?foo=bar&baz=ter&foo=par'), {foo: ['bar', 'par'], baz: 'ter'})
  deepEqual(parseQueryString('?foo=bar%20bar%20bar'), {foo: 'bar bar bar'})
})

test('toQueryString', function() {
  equal(toQueryString({}), '')
  equal(toQueryString({foo: 'bar'}), 'foo=bar')
  equal(toQueryString({foo: 'bar', baz: 'ter'}), 'foo=bar&baz=ter')
  equal(toQueryString({foo: ['bar', 'par'], baz: 'ter'}), 'foo=bar&foo=par&baz=ter')
  equal(toQueryString({foo: 'bar bar bar'}), 'foo=bar%20bar%20bar')
})

}()
