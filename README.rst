=======
Fragile
=======

Single-page webapp for Agile-buzzword compliant project management, and maybe
more...

Reusable Components
===================

The following are defined in `vertebrae.js`_ (sorry!)

.. _`vertebrae.js`: https://github.com/insin/fragile/blob/master/vertebrae.js

Models
------

We all know roughly what this sort of thing looks like - focusing more on other
areas until I know what the long-term direction is here (see `NOTES.rst`_).

``Model(attrs)``

   Base constructor for data types. Sets initial attributes, otherwise just a
   marker at the moment.

``Storage(model)``

   Storage and retrieval of instances of a particular Model. Not persistent
   yet.

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

.. _`NOTES.rst`: https://github.com/insin/fragile/blob/master/NOTES.rst

Views
-----

A Views object contains a bunch of related functions which implement control and
display logic.

``Views(attrs)``
   Base constructor for objects containing functions which implement display and
   control logic.

   Generally, views should be instantiated using ``Views.create``.

``Views.create(attrs)``
   Creates a ``Views`` instance using a passed-in object defining instance
   attributes and keeps a record of instances which were created for later use
   by ``Views,prototype.initAll()``.

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

   ``initAll()``
      Calls ``init`` on every Views instance which has been created, if it has
      one.

   ``log(message)``, ``warn(message)``
      Console logging methods, which include the Views' name in logs.

CrudViews
~~~~~~~~~

Views which take care of some of the repetitive work involved in creating
basic CRUD functionality. This specialised version of ``Views`` expects to find
the following instance attributes, all of which are required:

   ``namespace`` *(String)*
      Unique namespace for the instance - used in base templates to ensure
      created element ids are unique and when looking up templates which
      override the base templates.

   ``elementId`` *(String)*
      The id of the element in which content should be displayed.

   ``storage`` *(Storage)*
      A Storage object used to create, retrieve, update and delete Model
      instances.

   ``form`` *(forms.Form)*
      A Form used to take and validate user input when creating and updating
      Model instances.

Example of using CrudViews::

   var VehicleCrudViews = CrudViews.create(
     name: 'VehicleCrudViews'
   , namespace: 'vehicles'
   , elementId: 'vehicles'
   , storage: Vehicles
   , form: VehicleForm
   })

Templates
#########

CrudViews defines the following DOMBuilder templates, which you may wish to
extend:

+-----------------+--------------------------------------------+--------------------------------------+
| Template        | Description                                | Blocks                               |
+=================+============================================+======================================+
| ``crud:list``   | table listing of model instances           | itemTable, headers, controls         |
+-----------------+--------------------------------------------+--------------------------------------+
| ``crud:row``    | table row displayed in list view           | linkText, extraCells                 |
+-----------------+--------------------------------------------+--------------------------------------+
| ``crud:add``    | add form for creating a new model instance | N/A                                  |
+-----------------+--------------------------------------------+--------------------------------------+
| ``crud:detail`` | details of a selected model instance       | top, detailRows, controls            |
+-----------------+--------------------------------------------+--------------------------------------+
| ``crud:edit``   | edit form for a model instance             | N/A                                  |
+-----------------+--------------------------------------------+--------------------------------------+
| ``crud:delete`` | confirms deletion of a model instance      | Same as ``crud:detail`` - extends it |
+-----------------+--------------------------------------------+--------------------------------------+

In the above template names, ``'crud'`` is a namespace.

When loading templates, CrudViews first attempts to load a template using the
namespace which was provided, so to override one of its templates, you just need
do define a template named using your own namespace.

In our Vehicles example, you could extend these templates to display a vehicle's
registration and the number of wheels it has in the list template like so::

   with (DOMBuilder.template) {

   $template({name: 'vehicles:crud:list', extend: 'crud:list'}
   , $block('headers'
     , TH('Registration')
     , TH('# Wheels')
     )
   )

   $template({name: 'vehicles:crud:row', extend: 'crud:row'}
   , $block('linkText', '{{ item.registration }}')
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