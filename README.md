# Mxr.js #

`Mxr.js` (from _M_ i _X_ e _R_) is a library that simplifies the use of mix-ins in Javascript. Mix-ins, as implemented in `Mxr.js`, provide a form of *static multiple inheritance*.

`Mxr.js` is a [require.js](http://requirejs.org/) module and optionally embeds [`In.js`](https://github.com/valentinomiazzo/in_js) for additional fun. `Mxr.js` is under MIT license.

## Example ##

```javascript
// Somewhere Drawable, Sortable and Armor mix-ins have been defined

// We define our class
function SpaceShip() {
  //...
}

// Now we mix ...
Mxr.mix(SpaceShip, Drawable);
Mxr.mix(SpaceShip, Sortable);
Mxr.mix(SpaceShip, Armor);
// ... and SpaceShip becomes Drawable and Sortable, plus,
// its reaction to bullets is modified by the Armor

// Drawable and Sortable are abstract mix-ins.
// We have to define some methods
Spaceship.prototype.draw = function (context) {
  //...
};
Spaceship.prototype.getSortValue = function () {
  return this.z;
};

//Now we can sort by z ...
Engine.sort(spaceships);
//... and draw.
Engine.draw(spaceships);

//We have an armor
var shields = spaceShip.getShields();
spaceShip.hitByBullet();
shields === spaceShip.getShields();     //true, no damage!
```

## Docs and examples ##

Docs are available in [here](https://rawgit.com/valentinomiazzo/mxr_js/master/build/docs/classes/Mxr.html).
As examples you can use the [spec](js/spec/Mxr.js) file used for unit testing. [Coverage reports](https://rawgit.com/valentinomiazzo/mxr_js/master/build/coverage/PhantomJS%201.9.8%20(Windows%207%200.0.0)/js/src/Mxr.js.html) are available too.

## Alternatives ##

* [Ring.js](http://ringjs.neoname.eu/) JavaScript Class System with Multiple Inheritance
* ...

## How do I get set up? ##

* How to use the lib
    * The lib is a [Require.js](http://require.js) compatible module.
* Summary of set up
    * install [Node.js](http://nodejs.org/) (tested with 0.10.31)
    * install [Npm](https://www.npmjs.com/) (tested with 2.8.3)
    * `npm install grunt-cli -g`
    * clone this repository
    * in the root of the cloned repo, type (on Windows you may need to disable antivirus if you get strange issues during the install):
        * `npm install`
* How to run tests and generate docs
    * in the root of the cloned repo, type:
        * `grunt`
        * tests reports are in `build/tests`
        * coverage reports are in `build/coverage`
        * docs are generated in `build/docs`

## Contribution guidelines ##

* Writing tests
    * [Jasmine](https://jasmine.github.io/) it is used for testing.
    * tests are in `js/spec`
* For pull requests
    * go [here](../../pulls)
* For issues
    * go [here](../../issues)

## What problem solves? ##

Sometimes we want to inherit from more than one super class. This is not possible with the default inheritance of Javascript. The default inheritance is named *Prototypal Inheritance*.
Prototypal inheritance uses a linked list of prototypes and when we inherit for the second time we replace the previous inheritance chain. Let see in code.

```javascript
//Let's inherit Drawable
SpaceShip.prototype = Object.create(Drawable.prototype);
var s1 = new SpaceShip();
s1.draw(); //works!

//Now let's inherit Sortable too
SpaceShip.prototype = Object.create(Sortable.prototype);
var s2 = new SpaceShip();
s2.sort(); //works!
s2.draw(); //Ops, undefined, it doesn't work anymore ...
s1.draw(); //... even on the already created instance.
```

As we see, we have a single prototype.  We cannot have two or more.
If we are determined enough then we can figure out that we can manipulate that linked list to obtain what we want, but this doesn't work too. Let see why. This is the initial situation:

    B --> A --> Object  // --> means 'inherits'
    Y --> X --> Object

Now we want that a new class K inherits both `B` and `Y`.
We obtain this with some cut & paste over the prototype chains.

    K --> B --> A --> Y --> X --> Object

Cool, we did it! ... maybe not ...
Indeed the cut & paste with `K` also modified the behavior of all the instances of `B`.
If we look carefully this is the new prototype chain of `B`

    B --> A --> Y --> X --> Object

In other words, as side effect of our patchwork, `B` (and all its instances) has inherited members of `Y` and `X`.

## How solves the problem? ##

`Mxr.js` provides the mix-in concept, a form of *static multiple inheritance*.

By looking at the implementation of `Mxr.js` we see it as a sort of copy-inheritance. The members of the prototype of the mix-in are copied into the prototype of the receiving class. This permits the multiple inheritance.

With the prototypal inheritance each instance `c` of class `C` maintains a link through `c.__proto__` to `C.prototype`.
When you change `C.prototype` this is immediately reflected in all the instances of `C` even if this happens after the creation of `c`. Given how the prototypal inheritance is implemented these side effects extends to sub classes. In other words even changing the prototype of a super class has immediate impact on all the instances of its sub classes.
This is the reason why we say that the prototypal inheritance is dynamic.

The members of the mix-in are copied into the class at mix time. This implies that modifications done to the Mix-in after the mix are not reflected on the class. Operations like add a function, remove a function, change a constant are not reflected.
For these reason we say that mix-ins provide a form of *static multiple inheritance*.

Should we consider static inheritance a limitation? We think no. Modify the prototype of a class after instances have been created is often associated with [Monkey Patching ](https://en.wikipedia.org/wiki/Monkey_patch) which is a bad design practice. We think that static inheritance is actually good because makes monkey patching harder.

## Advanced concepts ##

### Abstract methods, mix-ins, traits, interfaces, signatures ###

TODO

### `In.js` integration ###

If you want, you can merge `Mxr.js` with `In.js`. In this way you can use `Mxr.js` as a superset of `In.js`.
This can be obtained by obtaining a reference to the In module and then invoking `Mxr.configure(...)` method.

### instanceof ###

The `instanceof` operator iterates over the `__proto__` chain of an object and if it finds the target class then it returns `true`.
When we mix a mix-in `M` in class `C` we don't change the prototype chain of `C`, we just copy members into the prototype of `C`.
This implies `c instanceof M == false` which is somehow surprising. `Mxr.js` supplies a function alternative to `instanceof`.

```javascript
function C() {}
Mxr.mix(C,M);

var c = new C();
c instanceof M;   // false
Mxr.is(c,M);      // true
```

Someone can argue that not being able to use `instanceof` limits the usefulness of mix-ins when dealing with 3rd party code that uses `instanceof` internally. In this regards, it is worth to note that prototypal inheritance and mix-in can be combined.
E.g. you can define a class C that inherits from S and mixes in M.

```javascript
function C() {}
C.prototype = Object.create(S.prototype);
Mxr.mix(C,M);

var c = new C();
c instanceof S;   // true
Mxr.is(c,M);      // true
```

### Shallow copy ###

We said that at mix time the members of the mix-in are copied. The copy is a shallow copy and this has some consequences.
Values are copied and therefore modifications aren't reflected. Reference are copied but not the referenced object.
Therefore modifications at the referenced object are reflected on the mixed class and its instances. Let see in code.

```javascript
//The mix-in
function M() {}
M.prototype.K = { x: 0, y: 0 };

//The class and the mixing
function C() {}
Mxr.mix(C,M);
var c = new C();
c.K.x === 0;       //true

M.prototype.K.x = 1; //We modify the referenced object not the reference
c.K.x === 0;          //false
c.K.x === 1;          //true

M.prototype.K = { x: 10, y: 10 }; //We modify the reference
c.K.x === 10;                      //false
c.K.x === 1;                       //true
```