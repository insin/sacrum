======
Sacrum
======

*Sacrum is under initial, heavy development, but it's at the stage where I
believe the core concept is proved out - this is what it's going to be:*

Sacrum provides components and conventions for writing single-page JavaScript
apps which also run on `Node.js`_ for almost-free as good ol' forms 'n links
webapps, allowing you to ditch the hashbangs and **use real URLs like TBL
intended**, without having to expend significant effort on a separate backend
and without leaving user agents which *Don't Do JavaScript* out in the cold.

It gives you a baseline from which to progressively enhance for those who
*Definitely Do Do JavaScript* by running the JavaScript everybody else can't or
won't run for them.

----

The sample application for Sacrum is `Fragile`_ - it serves as the test-bed
and proving ground for new features, components and ideas.

.. _`Node.js`: http://nodejs.org
.. _`Fragile`: http://jonathan.buchanan153.users.btopenworld.com/sacrum/fragile/fragile.html

Dependencies
============

*The required versions aren't yet available in npm for Node.js due to Cygwin
being FUBAR*

- `DOMBuilder`_ (>= 2.1.0 alpha1) is required for templating in code with
  template inheritance, generating DOM Elements and registering event handlers on
  the browser and generating HTML on Node.js with hooks for event handlers to be
  attached later.

- `newforms`_ (>= 0.0.4 alpha1) is required for form display, user input
  validation and type coercion. It also requires DOMBuilder for rendering across
  environments.

Sacrum Components
=================

The following components are defined in `sacrum.js`_ and (in browsers) exposed to
the global scope as properties of a ``Sacrum`` object, which is omitted here for
brevity.

.. _`sacrum.js`: https://github.com/insin/fragile/blob/master/sacrum.js

Models
------

``Model(props)``

   Base constructor for data types, which sets the given instance properties.

``Model.extend(prototypeProps, constructorProps)``

   Creates a constructor which inherits from ``Model`` and sets its prototype and
   constructor properties in one fell swoop.

   The ``prototypeProps`` argument is **required** and is expected to contain, at
   the very least, a ``Meta`` object which defines the model's name.

   If a child constructor is not provided via ``prototypeProps.constructor``, a
   new constructor which calls ``Model(props)`` on instantiation will be created
   for you.

   Extended Model constructors and prototypes will have a ``_meta`` property which
   is an instance of a ``ModelOptions`` object, with the following properties:

   ``name``
      The model's name.

   ``namePlural``
      Plural form of the model's name - if not provided in the ``Meta`` object,
      this will be defaulted to ``name`` followed by an ``'s'``.

Don't forget to add a ``toString`` method to the prototype when extending
``Model``, to define its default display::

   var Vehicle = Model.extend({
     toString: function() {
       return this.reg
     }
   , Meta: {
       name: 'Vehicle'
     }
   })

``Storage(model)``

   Storage and retrieval of instances of a particular ``Model``. Not persistent
   yet.

::

   var Vehicles = new Storage(Vehicle)

Methods:

``add(instance)``
   Generates and id for and adds the given instance.

``remove(instance)``
   Removes the given instance.

``all()``
   Gets all instances.

``get(id)``
   Gets an instance by id.

``query()``
   Creates a Query returning all instances.

``Query(storage)``

   Provides access to results of querying a ``Storage``, and a means to perform
   further queries/filtering.

Methods:

``__iter__()``
   Returns query results - currently just ``storage.all()``

``get(id)``
   Gets an instance by id.

Model Validation
~~~~~~~~~~~~~~~~

Sacrum doesn't offer any hooks for doing so yet, but it does let `newforms`_ know
how its ``Storage`` objects work, which enables use of ``forms.ModelVhoiceField``
for display, selection and validation of related models.

::

   var DriverForm = forms.Form({
     name: forms.CharField({maxLength: 255})
   , vehicle: forms.ModelChoiceField(Vehicles.query())
   })

.. _`NOTES.rst`: https://github.com/insin/fragile/blob/master/NOTES.rst

Views
-----

A ``Views`` object contains a bunch of related functions which implement control
and display logic.

``Views(props)``

   Base constructor for objects containing functions which implement display and
   control logic. Use this constructor if you only need a singleton, setting its
   view functions as instance properties.

``Views.extend(prototypeProps, constructorProps)``

   Creates a constructor which inherits from ``Views`` and sets its prototype and
   constructor properties in one fell swoop, if provided.

   If a child constructor is not provided via ``prototypeProps.constructor``, a
   new constructor which calls ``Views(props)`` on instantiation will be created
   for you.

   ``Views.prototype`` methods  expect the following instance properties:

   ``name`` *(String)*
      Name for the collection of view functions.

      For example, if you have a bunch of view functions which handle listing
      and editing ``Vehicle`` objects, a logical name would be ``'VehicleViews'``.

   ``el`` *(Element)* - required if using ``display()``
      The element which contains the views' contents.

   These don't have to be set at construction time - you could defer setting
   them until the views' ``init()`` method is called, if appropriate.

Methods:

``render(templateName, context, events)``
   Renders a DOMBuilder template with the given context data.

   ``templateName`` *(String)*
      Name of a DOMBuilder template.
   ``context`` *(Object)*
      Template rendering context data.
   ``events`` *(Object.<String, Function>)*
      Named event handling functions - if provided, these functions will be
      bound to this Views instance and added to the template context as an
      ``'events'`` property.

``display(templateName, context, events)``
   Renders a DOMBuilder template and displays it.

   On browsers:
      Replaces the contents of this views' element with the rendered template
      contents the contents.
   On servers:
      Returns the rendered template contents.

   To support usage in both environments, you should always return the result of
   calling this method when it signifies that your view function is finished
   doing it thing.

``log(...)``, ``warn(...)``, ``error(...)``
   Console logging methods, which include the views' name in logs, passing
   all given arguments to console logging functions.

::

   var VehicleViews = Views.extend({
     name: 'VehicleViews'

   , init: function() {
       this.el = document.getElementById("vehicles")
     }

   , list: function() {
       this.debug('list')
       var vehicles = Vehicles.all()
       return this.display('vehicleList', {vehicles: vehicles})
     }

     // ...
   })

URLConf
-------

URL patterns can be configured  to map URLs to views, capturing named parameters
in the process, and to reverse-resolve a URL name and parameters to obtain
a URL.

``URLConf``

   Application URL configuration should be set in ``URLConf.patterns``, which
   should contain a list of pattens for resolution.

``patterns(context, patterns...)``

   Creates a list of URL patterns, which can be specified using the ``url``
   function or a list of [pattern, view, urlName].

   View function names can be specified as strings to be looked up from a
   context object (usually a ``Views`` instance), which should be passed as the
   first argument in that case, otherwise it should be ``null`` or falsy.

``url(pattern, view, urlName)``

   Creates a URL pattern or roots a list of patterns to the given pattern if
   a list of views. The URL name is used in reverse URL lookups and should be
   unique.

   Patterns:

   * Should not start with a leading slash, but should end with a trailing slash
     if being used to root other patterns, otherwise to your own taste.

   * Can identify named parameters to be extracted from resolved URLS using a
     leading ``:``, e.g.::

        widgets/:id/edit/

``resolve(path)``

   Resolves the given URL path, returning an object with ``func``, ``args`` and
   ``urlName`` properties if successful, otherwise throwing a ``Resolver404``
   error.

``reverse(urlName, args)``

   Reverse-resolves the given named URL with the given args (if applicable),
   returning a URL string if successful, otherwise throwing a ``NoReverseMatch``
   error.

``handleURLChange(e)``

   Event handling function which prevents navigation from occurring and instead
   simulates it, resolving the target URL, extracting arguments if necessary and
   calling the configured view function with them.

   This function knows how to deal with:

   * Links (``<a>`` elements), handling their ``onclick`` event.
   * Forms (``<form>`` elements), handling their ``onsubmit`` event.

   If used with a form's ``onsubmit`` event, submission of form parameters will
   be simulated as an object passed as the last argument to the view function.
   Values for multiple fields with the same ``name`` will be passed as a list.

::

   var VehicleViews = new Views({
     // ...

   , index: function() {
        this.display('index')
     }

   , details: function(id) {
       var vehicle = Vehicles.get(id)
       this.display('vehicleDetails', {vehicle: vehicle})
     }

   , getURLs: function() {
       return patterns(this
       , url('',      'index',   'vehicle_index')
       , url('list/', 'list',    'vehicle_list')
       , url(':id/',  'details', 'vehicle_details')
       )
     }

     // ..
   })

   URLConf.patterns = VehicleViews.getURLs()

Templates
---------

Sacrum doesn't insist that you use any particular templating engine, but comes
with helpers out of the box to use `DOMBuilder`_'s templating mode.

The default implementation of Views' ``render()`` method uses DOMBuilder
templates and the following additional helpers are also provided.

``URLNode(urlName, args, options)``

  A ``TemplateNode`` which reverse-resolves using the given URL details.

  If an ``{as: 'someName'}`` options object is passed, the URL will be added
  to the template context under the given variable name, otherwise it will be
  returned.

The following convenience accessors are added to ``DOMBuilder.template``:

``$resolve``
   A reference to ``handleURLChange(e)``

``$url(urlName, args, options)``
  Creates a ``URLNode``.

::

   $template('vehicleList'
   , TABLE({'class': 'list'}
     , THEAD(TR(
         TH('Registration')
       , TH('# Wheels')
       ))
     , TBODY($for('vehicle in vehicles'
       , $url('vehicle_details', ['{{ vehicle.id }}'], {as: 'detailsURL'})
       , TR({'class': $cycle(['odd', 'even'])}
         , TD(
             A({href: '{{ detailsURL }}', click: $resolve}, '{{ vehicle.reg }}')
           )
         , TD('{{ vehicle.wheels }}')
         )
       ))
     )
   )


.. _`DOMBuilder`: https://github.com/insin/DOMBuilder

History
-------

TODO

Sacrum.Admin Components
=======================

The following components are defined in `admin.js`_ and exposed (in browsers) as
properties of a ``Sacrum.Admin`` object, which is omitted here for brevity.

.. _`admin.js`: https://github.com/insin/fragile/blob/master/admin.js

AdminViews
----------

An *instance* of ``Views`` which makes use of any ``ModelAdminViews`` which have
been created to display a basic admin section.

``AdminViews`` contains the following properties and functions:

``init()``
   Initialises the view element and registers all ``ModelAdminViews`` which
   have been created so far. Each ``ModelAdminViews`` registered will have its
   ``el`` set to this views' element.

``modelViews`` (Array)
   ModelAdminViews registered by ``init()``

``index()``
   Displays an index listing ModelAdminViews for use.

``getURLs()``
   Creates and returns URL patterns for the index view and includes
   patterns for each ModelAdminViews.

ModelAdminViews
---------------

An extended ``Views`` constructor which takes care of some of the repetitive work
involved in creating basic Create  / Retrieve / Update / Delete (CRUD)
functionality for a ``Model``.

``ModelAdminViews(props)``

   Creates an ``ModelAdminViews`` instance using a passed-in object defining
   instance properties.

   This specialised version of ``Views`` expects to find the following instance
   properties:

   ``namespace`` *(String)*
      Unique namespace for the instance - used in base templates to ensure
      created element ids are unique and when looking up templates which
      override the base templates.

   ``storage`` *(Storage)*
      A Storage object used to create, retrieve, update and delete model
      instances.

   ``form`` *(forms.Form)*
      A newforms ``Form`` used to take and validate user input when creating and
      updating model instances.

   ``elementId`` *(String)*
      The id of the element in which content should be displayed, if appropriate.
      This should be provided if using ``ModelAdminView`` for standalone CRUD
      functionality. If using ``AdminView``, it will provide the view element.


::

   var VehicleAdminViews = new ModelAdminViews({
     name: 'VehicleAdminViews'
   , namespace: 'vehicles'
   , storage: Vehicles
   , form: VehicleForm
   })

Templates
---------

The Admin uses the following DOMBuilder templates, which you may wish to
extend to customise display.

+-------------------+--------------------------------------------+---------------------------------------+
| Template          | Description                                | Blocks                                |
+===================+============================================+=======================================+
| ``admin:base``    | base template for admin display            | breadCrumbs, contents                 |
+-------------------+--------------------------------------------+---------------------------------------+
| ``admin:index``   | table listing of ModelAdminViews           | N/A                                   |
+-------------------+--------------------------------------------+---------------------------------------+
| ``admin:list``    | table listing of model instances           | itemTable, headers, controls          |
+-------------------+--------------------------------------------+---------------------------------------+
| ``admin:listRow`` | table row displayed in list view           | linkText, extraCells                  |
+-------------------+--------------------------------------------+---------------------------------------+
| ``admin:add``     | add form for creating a new model instance | formRows                              |
+-------------------+--------------------------------------------+---------------------------------------+
| ``admin:detail``  | details of a selected model instance       | top, detail, detailRows, controls     |
+-------------------+--------------------------------------------+---------------------------------------+
| ``admin:edit``    | edit form for a model instance             | formRows                              |
+-------------------+--------------------------------------------+---------------------------------------+
| ``admin:delete``  | confirms deletion of a model instance      | N/A                                   |
+-------------------+--------------------------------------------+---------------------------------------+

In the above template names, ``'admin'`` is a namespace.

When loading templates, ModelAdminViews first attempts to load a template using
the namespace which was provided when it was instantiated, so to override one of
its templates, you just need to define a template named using your own, leading,
namespace.

In our vehicles example, you could extend these templates to display a vehicle's
registration and the number of wheels it has in the list template, like so::

   with (DOMBuilder.template) {

   $template({name: 'vehicles:admin:list', extend: 'admin:list'}
   , $block('headers'
     , TH('Registration')
     , TH('# Wheels')
     )
   )

   $template({name: 'vehicles:admin:listRow', extend: 'admin:listRow'}
   , $block('linkText', '{{ item.reg }}')
   , $block('extraCells'
     , TD('{{ item.wheels }}')
     )
   )

   }

Spiel (Y U NIH?)
================

This started out as (and still is, at the moment) a single-page app I was
playing around with to get back into writing single-page apps.

I was planning to try out Backbone and Spine with when I was offline for a
week on holiday, but in the absence of help from the internet and that nagging
feeling that I wasn't fully 'getting' the abstractions or that I was using them
as the author intended, I started playing around with my own code and extracting
reusable components, also making use of `DOMBuilder`_ and `newforms`_ for
templating, form display and input validation/type coercion.

I've been writing those libraries with use on the browser and backend as an
expressly-stated goal, but I wasn't actually *using* them in anger on the
backend, so it's time to remedy that, too...

.. _`DOMBuilder`: https://github.com/insin/DOMBuilder
.. _`newforms`: https://github.com/insin/newforms
