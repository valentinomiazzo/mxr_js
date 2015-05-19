# Mxr.js #

MXR stands for Mixer since it allow use of Mixin concept.

DESIGN NOTE:
- There are not mixins and classes, every 'type' is a class.
- The focal point is how types are combined. Dynamically (inheritance) or statically (mix).
- There are not classes and interfaces, there are abstract methods.
- There are not contract, there are methods annotted with pre and post conditions.

Multiple inheritance in JS:
    JS doesn't support multiple inheritance since it has a single __proto__ chain.
    It IS possible to call multiple base ctors in the ctor adding properties to an
    object and copy members of super __proto__s in the current __proto__ BUT
    1) modification to super __proto__s done after the 'definition' of the class
       are not reflected in the current __proto__
       Are they useful?
       - Have a shared variable among all the instances
       -- This can be done with a variable defined at module level
       - Add/Remove members to all the instances after class definition
       -- Seems to be a bad habit
    2) instanceof doesn't work for auxiliary __proto__, in fact
       It is NOT possible to make a 'patchwork' of the prototypes merging the linked lists in a single one
       because this cut & paste will modify the inheritance chain also of the affering parents.
       E.g.
        A-B-O, C-D-O,
        E = A+C --> E-A-B-C-D-O
        but then after
         E-A-B-C-D-O
         C-D-O
         A-B-C-D-O <-- as sidefx A has inherited C and D members
    Ring.js is a library which implements this 'copy-inheritance' and it supplies a new Object method
    which is similar to instanceof except it works with multiple inheritance.
    This approach creates compatibility issues with external code not written using ring.js.
    Anyway ring.js supplies some workarounds.
    TODO: What is the cost per instance of 'copy-inheritance'?

Inheritance (again):
- Classes and Mixin are different things.
  They express a different kind of inheritance.
- Classes are about Prototypal inheritance.
  This defines a 'dynamic is a' relationship. It means that at any point
  a super class can change its prototype and this is immediatly reflected in all the instances
  of that class and its sublasses. Operator instanceof tests this inheritance.
- Mixins are about Static inheritance.
  This defines a 'static is a' relationship. It means that changes to super classes are not
  reflected in subclasses after 'mixing' the Mixin. For this reason there is no point in
  changing a Mixin after it is defined.

    Interfaces:
    - Interfaces are just like classes with only abstract methods.

    If A defines myMethod then:
    - Pre-existing Dbc.post is added to current.
      Since this is applied to every inheritance step then we can find the array of post-s
      in the super class.
      This allows to implement countervariance where a subclass can restrict its postconditions.
    - Dbc.pre is defined here and a pre-existing Dbc.pre is found in the inheritance chain then
      a special logic is applied because covariance imposes that precondition can only be relaxed by sublcasses.
        If pre fails, in addition to throwing an exception,  we check all the inherited pre-s.
        If they don't fail then we show an additional error because it means that current pre was stricter
        than previous ones therefore violating the covariance. This has negligble impact on performance
        since it is done only if current pre fails and therefore outside the normal flow of the code.
    - Pre and post conditions of super methods are checked even if we already checked the current pre-s.
      This is useful becuase a method could have not passed the original arguments to the super method.
      This is obtained automatically.

        a.m(-1);

        //A inherits B

        //B.m requires x>0

        A.m = function(x) {
          A.parent.m(complexFunction(x));
        }

    If both A and B define myMethod then
    - Dbc.post-s are accumulated
    - If Dbc.pre is defined then all Dbc.pre-s are checked when it fails and if any of them doesn't
      fail then an covariance error is generated in addition.

    If A and B define a method m that is not defined in the subclass
    - an error is generated because the multi-inheritance is not clear and the subclass
      developer needs to supply his m that dispatches to the multiple m super methods as required.

    Abstract method annotation
    - it may be useful to add a way to mark a method as 'must override'.
    - if a sub class doesn't override them then an error is generated, preferibly inside Dbc.inherit

        A.prototype.m = Dbc.abstract;
        A.prototypp.m.pre = function(a,b) {
            //...
        }
        A.prototypp.m.post = function(r) {
            //...
        }

    Invariants
    - no support

    Implementation:
    - inside Dbc.inherit
    -- the inherited pre-s and post-s are discovered
    -- the original method is replaced with a wrapper that calls pre-s and post-s
    -- pre-s and post-s logic is applied
    -- multi inheritance ambiguities are discovered and signaled


### How do I get set up? ###

* Summary of set up
    * install [Node.js](http://nodejs.org/) (tested with node 0.10.13 and npm 2.8.3)
    * install grunt and bower
        * `npm install grunt -g`
        * `npm install bower -g`
    * clone this repository
    * in the root of the cloned repo, type:
        * `npm install`
* How to run the game
    * in the root of the cloned repo, type:
        * `./node_modules/node-static/bin/cli.js`
        * browse [http://localhost:8080/](http://localhost:8080/)
* How to run tests
    * in the root of the cloned repo, type:
        * `./node_modules/karma/bin/karma start`
        * tests reports are in `build/tests`
        * coverage reports are in `build/coverage`

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Repo owner or admin
* Other community or team contact