QUnit.module('Utilities')

!function() {

var parseQueryString = Sacrum.util.parseQueryString
  , serialiseQueryParams = Sacrum.util.serialiseQueryParams


test('parseQueryString', function() {
  deepEqual(parseQueryString('?'), {})
  deepEqual(parseQueryString('?foo=bar'), {foo: 'bar'})
  deepEqual(parseQueryString('?foo=bar&baz=ter'), {foo: 'bar', baz: 'ter'})
  deepEqual(parseQueryString('?foo=bar&baz=ter&foo=par'), {foo: ['bar', 'par'], baz: 'ter'})
  deepEqual(parseQueryString('?foo=bar%20bar%20bar'), {foo: 'bar bar bar'})
})

test('serialiseQueryParams', function() {
  equal(serialiseQueryParams({}), '?')
  equal(serialiseQueryParams({foo: 'bar'}), '?foo=bar')
  equal(serialiseQueryParams({foo: 'bar', baz: 'ter'}), '?foo=bar&baz=ter')
  equal(serialiseQueryParams({foo: ['bar', 'par'], baz: 'ter'}), '?foo=bar&foo=par&baz=ter')
  equal(serialiseQueryParams({foo: 'bar bar bar'}), '?foo=bar%20bar%20bar')
})

}()
