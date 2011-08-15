QUnit.module('URLConfs')

!function() {

function normaliseRE(re) {
  return re.source.replace(/\\\//g, '/')
}

test('URLPattern', function() {
  var cb = function() {}
  var view = {'cb' : function() {}}

  // A URLPattern matches up URLs with callback functions which should be used
  // to handle them.
  var p = new URLPattern('test/', cb, 'test')
  equal(p.pattern, 'test/', 'Pattern is stored verbatim')
  equal(normaliseRE(p.regex), '^test/$', 'RegExp is generated from pattern')
  ok(p.regex.global, 'Generated RegExp is global')
  deepEqual(p.namedParams, [], 'No named params present')
  equal(p.callback, cb, 'Callback function is stored verbatim')
  strictEqual(p.callbackName, null, 'Callback name is null')
  equal(p.name, 'test', 'Name is stored verbatim')
  equal(p.toString(), '[object URLPattern] <test "test/">', 'toString is technical')

  p.addContext(view)
  equal(p.callback, cb, 'addContext() does nothing if callback is already set')

  // URLs can be resolved against URLPatterns
  var r = p.resolve('test/')
  equal(r.func, cb, 'Callback for resolved URL')
  deepEqual(r.args, [], 'Arguments from resolved URL')
  equal(r.urlName, 'test', 'Name URLPattern which matched resolved URL')

  // A failed resolution doesn't return anything
  equal(typeof p.resolve(''), 'undefined', 'Non-resolved URL')
  equal(typeof p.resolve('foo/'), 'undefined', 'Non-resolved URL')

  // Patterns can be empty and callbacks can be named functions which will be
  // looked up later.
  var p = new URLPattern('', 'cb', 'test')
  strictEqual(p.pattern, '', 'Empty pattern is stored verbatim')
  equal(p.regex.source, '^$', 'RegExp is generated from empty pattern')
  equal(p.callbackName, 'cb', 'Callback name is stored verbatim')
  strictEqual(p.callback, null, 'Callback is null')

  // Look up and bind named callbacks with a context object
  p.addContext(view)
  equal(Object.prototype.toString.call(p.callback), '[object Function]',
        'addContext() sets the callback if callback name is set')
  equal(p.callback.func, view.cb, 'Callback function is bound...')
  equal(p.callback.boundTo, view, '...to the given context object')

  // Named parameters :like :this will generate capturing RegExps
  var p = new URLPattern('test/:id/')
  equal(p.pattern, 'test/:id/', 'Pattern is stored verbatim')
  equal(normaliseRE(p.regex), '^test/([^/]*)/$', 'Capturing RegExp is generated from pattern')
  ok(p.regex.global, 'Generated RegExp is global')
  deepEqual(p.namedParams, ['id'], 'Named params present')

  // Arguments are extracted from resolved URLs
  var r = p.resolve('test/123/')
  deepEqual(r.args, ['123'], 'Arguments from resolved URL')

  // Multiple named parameters :like :this will generate capturing RegExps
  var p = new URLPattern('test/:id/:action/')
  equal(p.pattern, 'test/:id/:action/', 'Pattern is stored verbatim')
  equal(normaliseRE(p.regex), '^test/([^/]*)/([^/]*)/$', 'Multiply-capturing RegExp generated from pattern')
  ok(p.regex.global, 'Generated RegExp is global')
  deepEqual(p.namedParams, ['id', 'action'], 'Named params present in order')

  // Arguments are extracted from resolved URLs
  var r = p.resolve('test/123/edit/')
  deepEqual(r.args, ['123', 'edit'], 'Arguments from resolved URL')
})

test('URLRresolver', function() {
})

test('patterns', function() {
})

test('url', function() {
})

test('resolve', function() {
})

test('reverse', function() {
})

}()
