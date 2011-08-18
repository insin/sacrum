QUnit.module('URLConfs')

!function() {

var URLPattern = Sacrum.URLPattern
  , URLResolver = Sacrum.URLResolver
  , ResolverMatch = Sacrum.ResolverMatch
  , Resolver404 = Sacrum.Resolver404

/**
 * Browsers? Inconistent in the way they implement RegExp.source? You never!
 */
function normaliseRE(re) {
  return re.source.replace(/\\\//g, '/')
}

test('URLPattern', function() {
  function cb() {}
  var view = {'cb' : cb}

  // A URLPattern matches up URLs with callback functions which should be used
  // to handle them.
  var p = new URLPattern('test/', cb, 'test')
  equal(p.pattern, 'test/', 'Pattern is stored verbatim')
  equal(normaliseRE(p.regex), '^test/$', 'RegExp is generated from pattern')
  deepEqual(p.namedParams, [], 'No named params present')
  equal(p.callback, cb, 'Callback function is stored verbatim')
  strictEqual(p.callbackName, null, 'Callback name is null')
  equal(p.name, 'test', 'Name is stored verbatim')
  equal(p.toString(), '[object URLPattern] <test "test/">', 'toString is technical')

  p.addContext(view)
  equal(p.callback, cb, 'addContext() does nothing if callback is already set')

  // URLs can be resolved against URLPatterns
  var r = p.resolve('test/')
  ok(r instanceof ResolverMatch, 'Resolution results returned as a ResolverMatch')
  equal(r.func, cb, 'Callback for resolved URL')
  deepEqual(r.args, [], 'Arguments from resolved URL')
  equal(r.urlName, 'test', 'Name URLPattern which matched resolved URL')
  ok(p.resolve('test/') instanceof ResolverMatch, 'Resolve again')

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
  deepEqual(p.namedParams, ['id'], 'Named params present')

  // Arguments are extracted from resolved URLs
  var r = p.resolve('test/123/')
  deepEqual(r.args, ['123'], 'Arguments from resolved URL')

  // Multiple named parameters :like :this will generate capturing RegExps
  var p = new URLPattern('test/:id/:action/')
  equal(p.pattern, 'test/:id/:action/', 'Pattern is stored verbatim')
  equal(normaliseRE(p.regex), '^test/([^/]*)/([^/]*)/$', 'Multiply-capturing RegExp generated from pattern')
  deepEqual(p.namedParams, ['id', 'action'], 'Named params present in order')

  // Arguments are extracted from resolved URLs
  var r = p.resolve('test/123/edit/')
  deepEqual(r.args, ['123', 'edit'], 'Arguments from resolved URL')
})

test('URLResolver', function() {
  function cb1() {}
  function cb2() {}
  function cb3() {}
  function cb4() {}

  var patterns = [ new URLPattern('',          cb1, 'test1')
                 , new URLPattern('test/',     cb2, 'test2')
                 , new URLPattern('test/:id/', cb3, 'test3')
                 , new URLPattern(':subject/', cb4, 'test4')
                 ]

  // A URLResolver resolves against a base URL pattern, then against a list of
  // URLPatterns and URLResolvers, allowing lists of URL patterns to be rooted
  // to a base URL. This is the mechanism by which all URLs are ultimately
  // resolved, with a URLResolver rooted to '/'.
  var r = new URLResolver('/', patterns)
  equal(r.pattern, '/', 'Pattern is stored verbatim')
  equal(normaliseRE(r.regex), '^/', 'RegExp is generated from pattern')
  strictEqual(r._reverseLookups, null, 'Reverse lookups are initially null')

  // URLs can be resolved against URLResolvers -_-
  var m = r.resolve('/')
  ok(m.func, cb1, 'Callback for resolved URL')
  deepEqual(m.args, [], 'Arguments from resolved URL')
  equal(m.urlName, 'test1', 'Name URLPattern which matched resolved URL')
  var m = r.resolve('/test/')
  equal(m.func, cb2, 'Callback for resolved URL')
  deepEqual(m.args, [], 'Arguments from resolved URL')
  equal(m.urlName, 'test2', 'Name URLPattern which matched resolved URL')
  var m = r.resolve('/test/123/')
  equal(m.func, cb3, 'Callback for resolved URL')
  deepEqual(m.args, ['123'], 'Arguments from resolved URL')
  equal(m.urlName, 'test3', 'Name URLPattern which matched resolved URL')
  var m = r.resolve('/things/')
  equal(m.func, cb4, 'Callback for resolved URL')
  deepEqual(m.args, ['things'], 'Arguments from resolved URL')
  equal(m.urlName, 'test4', 'Name URLPattern which matched resolved URL')

  // If a URL can't be resolved, a Resolver404 is thrown
  raises(function() { r.resolve('testing/123/') }, Resolver404,
         'Resolver404 error thrown when root URL pattern fails to match')
  raises(function() { r.resolve('/testing/123/') }, Resolver404,
         'Resolver404 error thrown when child URL pattern fails to match')

  // URLResolvers can also be used to construct reversed URLs given their name
  // and arguments. Note that URLResolver's own pattern isn't included, as the
  // public API for reversing URLs always works off a URLResolver rooted to /
  // which contains all defined URL patterns.
  equal(r.reverse('test1'), '', 'Reverse empty URLs')
  deepEqual(r._reverseLookups, { 'test4': [['subject'], ':subject/']
                               , 'test3': [['id'], 'test/:id/']
                               , 'test2': [[], 'test/']
                               , 'test1': [[], '']
                               }, 'Reverse lookups are now populated')
  equal(r.reverse('test2'), 'test/', 'Reverse URLs')
  equal(r.reverse('test3', [123]), 'test/123/', 'Reverse URLs')
  equal(r.reverse('test4', ['things']), 'things/', 'Reverse URLs')

  // URLResolver patterns can capture named parameters too
  var r = new URLResolver('/:section/', patterns)
  equal(r.pattern, '/:section/', 'Pattern is stored verbatim')
  equal(normaliseRE(r.regex), '^/([^/]*)/', 'RegExp is generated from pattern')

  // Resolving URLs with a capturing URLResolver pattern
  var m = r.resolve('/places/')
  ok(m.func, cb1, 'Callback for resolved URL')
  deepEqual(m.args, ['places'], 'Arguments from resolved URL')
  equal(m.urlName, 'test1', 'Name URLPattern which matched resolved URL')
  var m = r.resolve('/places/test/')
  equal(m.func, cb2, 'Callback for resolved URL')
  deepEqual(m.args, ['places'], 'Arguments from resolved URL')
  equal(m.urlName, 'test2', 'Name URLPattern which matched resolved URL')
  var m = r.resolve('/places/test/123/')
  equal(m.func, cb3, 'Callback for resolved URL')
  deepEqual(m.args, ['places', '123'], 'Arguments from resolved URL')
  equal(m.urlName, 'test3', 'Name URLPattern which matched resolved URL')
  var m = r.resolve('/places/things/')
  equal(m.func, cb4, 'Callback for resolved URL')
  deepEqual(m.args, ['places', 'things'], 'Arguments from resolved URL')
  equal(m.urlName, 'test4', 'Name URLPattern which matched resolved URL')

  // URLResolvers can also contain other URLResolvers
  var r = new URLResolver('/', [
    new URLResolver('test/:id/', [
      new URLPattern('tested/:action/', cb1, 'test5')
    ])
  ])
  strictEqual(r._reverseLookups, null, 'Reverse lookups are initially null')

  // Resolution
  var m = r.resolve('/test/1/tested/2/')
  ok(m.func, cb1, 'Callback for resolved URL')
  deepEqual(m.args, ['1', '2'], 'Arguments from resolved URL')
  equal(m.urlName, 'test5', 'Name URLPattern which matched resolved URL')

  // Reversal
  equal(r.reverse('test5', [1, 2]), 'test/1/tested/2/', 'Reverse URLs')
  deepEqual(r._reverseLookups,
            { 'test5': [['id', 'action'], 'test/:id/tested/:action/'] },
            'Reverse lookups are now populated')
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
