======
Sacrum
======

Sacrum is *another* helper for writing single-page (and beyond!) JavaScript
applications... more on that in the future, for now it's under initial
development, so watch this space.

The sample application for Sacrum is `Fragile`_ - it serves as the test-bed
and proving ground for new features, components and ideas.

.. _`Fragile`: http://jonathan.buchanan153.users.btopenworld.com/sacrum/fragile/fragile.html

Components
==========

The following components are defined in `sacrum.js`_.

.. _`sacrum.js`: https://github.com/insin/fragile/blob/master/sacrum.js

Models
------

We all know roughly what this sort of thing needs to look like - focusing more
on other areas until I know what the long-term direction is here (see
`NOTES.rst`_).

``Model(attrs)``

   Base constructor for data types. Sets initial attributes, otherwise just a
   marker at the moment.

   Don't forget to add a ``toString`` method to any constructors which extend
   Model::

      inherits(Vehicle, Model)
      function Vehicle(attrs) {
        Model.call(this, attrs)
      }
      Vehicle.prototype.toString = function() {
        return this.reg
      }

``Storage(model)``

   Storage and retrieval of instances of a particular Model. Not persistent
   yet.

   ::

      var Vehicles = new Storage(Vehicle)

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

   Provides access to results of querying a Storage, and means to perform
   further queries.

   ``__iter__()``
      Returns query results - currently just ``storage.all()``

   ``get(id)``
      Gets an instance by id.

Validation
~~~~~~~~~~

Sacrum doesn't insist that you use any particular means of performing model
validation - it doesn't even offer any hooks for doing so yet! - but it does
let `newforms`_ know how its ``Storage`` objects work, which enables
use of ``forms.ModelVhoiceField`` for display, selection and validation of
related Models.

::

   var DriverForm = forms.Form({
     name: forms.CharField({maxLength: 255})
   , vehicle: forms.ModelChoiceField(Vehicles.query())
   })

.. _`NOTES.rst`: https://github.com/insin/fragile/blob/master/NOTES.rst

Views
-----

A Views object contains a bunch of related functions which implement control and
display logic.

``Views(attrs)``
   Base constructor for objects containing functions which implement display and
   control logic. Use this constructor if you only need a singleton, settings its
   view functions as instance attributes.

``Views.extend(prototypeProperties, constructorProperties)``
   Creates a constructor which inherits from Views and sets its prototype and
   constructor properties in one fell swoop, if provided.

   If a child constructor is not provided via ``prototypeProps.constructor``, a
   new constructor which calls ``Views(attrs)`` on instantiation will be created
   for you.

``Views.prototype`` provides utility methods which expect the following instance
attributes:

   ``name`` *(String)*
      Name for the collection of view functions.

      For example, if you have a bunch of view functions which handle listing
      and editing Vehicle objects, a logical name would be ``'VehicleViews'``.

   ``el`` *(Element)* - required if using ``Views.prototype.display``
      The element which contains the Views' contents, if appropriate.

   These don't have to be set at construction time - you could defer setting
   them until the Views' ``init`` method is called, if appropriate.

The following methods are available on ``Views.prototype``:

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
      Renders a DOMBuilder template and makes the results the contents of this
      Views' element.

   ``log(...)``, ``warn(...)``, ``error(...)``
      Console logging methods, which include the Views' name in logs, passing
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
       this.display('vehicleList', {vehicles: vehicles})
     }

     // ...
   })

URLs
----

URL patterns can be used to map URLs to views, capturing named parameters
in the process, and to reverse-resolve a URL name and parameters to a URL.

``URLConf``
   Application URL patterns should be set in ``URLConf.patterns`` for
   resolution.

``patterns(context, patterns...)``
   Creates a list of URL patterns, which can be specified using the ``url``
   function or an array with the same contents as that function's arguments.

   View names can be specified as strings to be looked up from a context object
   (usually a ``Views`` instance), which should be passed as the first argument
   in that case, otherwise it should be ``null`` or falsy.

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

   var VehicleViews = Views.extend({
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
  Creates a URLNode.

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

Admin App
=========

The following components are defined in `admin.js`_

.. _`admin.js`: https://github.com/insin/fragile/blob/master/admin.js

AdminViews
----------

Views which make use of any ModelAdminViews which have been created to display
a basic admin section.

``AdminViews`` contains the following properties and functions:

   ``init()``
      Initialises the view element and registers all ModelAdminViews which
      have been created so far.

   ``modelViews`` (Array)
      ModelAdminViews registered by ``init()``

   ``index()``
      Displays an index listing ModelAdminViews for use.

   ``getURLs()``
      Creates and returns URL patterns for the index view and includes
      patterns for each ModelAdminViews.

ModelAdminViews
---------------

Views which take care of some of the repetitive work involved in creating
basic Create  / Retrieve / Update / Delete (CRUD) functionality for a Model.

``ModelAdminViews(attrs)``
   Base constructor for objects containing functions which implement display and control logic.

   ModelAdminViews should be instantiated using ``ModelAdminViews.extend``.

``ModelAdminViews.extend(attrs)``
   Creates an ``ModelAdminViews`` instance using a passed-in object defining
   instance attributes and keeps a record of instances which were created for
   later use by ``Views.prototype.initAll()``.

This specialised version of ``Views`` expects to find the following instance
attributes:

   ``namespace`` *(String)*
      Unique namespace for the instance - used in base templates to ensure
      created element ids are unique and when looking up templates which
      override the base templates.

   ``elementId`` *(String)*
      The id of the element in which content should be displayed, if
      appropriate.

   ``storage`` *(Storage)*
      A Storage object used to create, retrieve, update and delete Model
      instances.

   ``form`` *(forms.Form)*
      A Form used to take and validate user input when creating and updating
      Model instances.

Example of registering ModelAdminViews::

   var VehicleAdminViews = ModelAdminViews.extend(
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

In our Vehicles example, you could extend these templates to display a vehicle's
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
