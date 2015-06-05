/*jslint browser: true, bitwise: true, nomen: true, todo: true, vars: true, plusplus: true, indent: 4 */
/*global define */

/*!
 *  Mxr.js v0.0.0
 *
 *  (c) 2015, Valentino Miazzo
 *
 *  MIT License
 */

define([
    "In"
], function(In) {
    "use strict";

    function _assert(trueish, message) {
        if (!trueish) {
            //TODO: add more details about the failure, like stack trace
            throw new Error(message || "_assert violated ...");
        }
    }

    function _s_copy(dst, src) {
        var member;
        for (member in src) {
            if (src.hasOwnProperty(member)) {
                dst[member] = src[member];
            }
        }
    }

    /**
    This is the collection of static methods exposed by Mxr.js

    @class Mxr
    @static
    */
    var Mxr = {};
    _s_copy(Mxr, In);

    Mxr._UTL_PFX = "_Mxr_";

    Mxr._COPIED_MEMBERS = Mxr._UTL_PFX + "_copiedMembers";
    Mxr._MIXINS = Mxr._UTL_PFX + "_mixins";
    Mxr._ABSTRACT = Mxr._UTL_PFX + "_abstract";
    Mxr._ID = Mxr._UTL_PFX + "_id";

    Mxr._s_IdGenerator = 0;

    /**
    Declares a method abstract.

    In this way the library can help you to spot abstract methods not properly overridden.
    Under the hoods, it generates a new stub function with troubleshooting code inside.

        function M() {}
        M.prototype.doCoreStuff = Mxr.abstract(); //Note is abstract(); not abstract;
        M.prototype.doStuf = function () {
            //something before
            this.doCoreStuff();
            //something after
        }

    @method abstract
    @static
    */
    Mxr.abstract = function () {
        var newAbstract = function () {
            throw new Error("Abstract function not overriden");
        };
        newAbstract[Mxr._ABSTRACT] = true;
        return newAbstract;
    };

    /**
    Tests if `member` is an abstract method (declared with `Mxr.abstract()`).

        if (Mxr.isAbstract(M.prototype.doStuff) {
            //...
        }

    @method isAbstract
    @static
    @param member {Function} the member to test
    */
    Mxr.isAbstract = function (member) {
        _assert(member instanceof Function);
        _assert(
            member !== Mxr.abstract,
            "When declaring an abstract method you should use Mxr.abstract(); not Mxr.abstract;"
        );
        return member[Mxr._ABSTRACT] === true;
    };

    Mxr._copy = function(dst, src) {
        var member;
        var srcIsAbstract;
        dst[Mxr._COPIED_MEMBERS] = dst[Mxr._COPIED_MEMBERS] || [];
        for (member in src) {
            if (src.hasOwnProperty(member)) {
                //We don't copy our utility members
                if (member.indexOf(Mxr._UTL_PFX) < 0) {
                    srcIsAbstract = Mxr.isAbstract(src[member]); //want to check abstract misuse
                    //Override logic
                    if (dst.hasOwnProperty(member)) {
                        if (srcIsAbstract) {
                            Mxr._copyAbstractProperties(dst[member], src[member]);
                        } else {
                            /*if (dst[Mxr._COPIED_MEMBERS].indexOf(member) >= 0) {
                                throw new Error("Tried to mix member " + member + " in " + dst + "multiple times. Last source was " + src);
                            }*/
                            throw new Error("Overriding concrete methods via mixing is not supported. Concrete member " +
                                member + " in " +
                                dst.constructor.name + ". Override in " +
                                src.constructor.name
                                );
                        }
                    } else {
                        dst[member] = src[member];
                        dst[Mxr._COPIED_MEMBERS].push(member);
                    }
                }
            }
        }
    };

    Mxr._copyAbstractProperties = function(dst, src) {
        var member;
        for (member in src) {
            if (src.hasOwnProperty(member)) {
                if (member.indexOf(Mxr._ABSTRACT) < 0) {
                    if (!dst.hasOwnProperty(member)) {
                        dst[member] = src[member];
                    }
                }
            }
        }
    };

    /**
    Mixes __in__ class `clazz` the mixin `mixin`.

    This is a form of static inheritance in the sense that modification performed to the prototype of `mixin` after calling `mix()` aren't reflected on the mixed classes.

    This is different from prototypal inheritance where modifications are propagated to subclasses and therefore is a sort of dynamic inheritance.

    What makes mixins interesting is that they support multliple inheritance.

        function M() {}
        M.prototype.X = 0;
        function A() {}
        A.prototype.Y = 0;
        Mxr.mix(A,M);
        var a = new A();
        a.X == 0;                 //true
        a.Y == 0;                 //true
        M.prototype.X = 1;
        A.prototype.X = 1;
        a.X == 1;                 //false, static inheritance
        a.Y == 1;                 //true, dynamic inheritance

    @method mix
    @static
    @param clazz {Class} the destination class
    @param mixin {Class} the mix-in
    */
    Mxr.mix = function(clazz, mixin) {
        _assert(clazz);
        _assert(clazz instanceof Function);
        Mxr._mixObject(clazz.prototype, mixin);
    };

    //This version applies a mixin to an instance
    Mxr.mixObject = function(object, mixin) {
        Mxr._mixObject(object, mixin);
        _assert(mixin.length === 0); //Ctor has no parameters
        mixin.call(object);
    };

    Mxr._mixObject = function(object, mixin) {
        _assert(object);
        _assert(mixin);
        _assert(mixin instanceof Function);
        if (mixin[Mxr._ID] === undefined) {
            mixin[Mxr._ID] = Mxr._s_IdGenerator++;
        }
        _assert(
            !Mxr.isStatically(object, mixin),
            'Mixed the same class multiple times. Target=' + object + ' Mixin=' + mixin
        );
        Mxr._copy(object, mixin.prototype);
        var mixins = object.hasOwnProperty(Mxr._MIXINS) ? object[Mxr._MIXINS] : {};
        mixins[mixin[Mxr._ID]] = mixin; //adds the mixin
        Mxr._copyMixins(mixins, mixin.prototype[Mxr._MIXINS]); //and the mixin's mixins
        object[Mxr._MIXINS] = mixins;
        _assert(Mxr.isStatically(object, mixin));
    };

    Mxr._copyMixins = function(dst, src) {
        var id;
        if (src) {
            for (id in src) {
                if (src.hasOwnProperty(id)) {
                    _assert(!dst.hasOwnProperty(id));
                    dst[id] = src[id];
                }
            }
        }
    };

    /**
    Tests if `object` is an instance of a class mixed with `mixin`.

    It tests for static inheritance.

        function A() {}
        function B() {}
        Mxr.mix(A,B);
        var a = new A();
        a instanceof A;           //true
        a instanceof B;           //false
        Mxr.isStatically(a,A);    //false
        Mxr.isStatically(a,B);    //true

    @method isStatically
    @static
    @param object {Object} the instance under test
    @param mixin {Class} the mix-in to check
    */
    //TODO: rename it isMixed() ?
    Mxr.isStatically = function(object, mixin) {
        _assert(mixin);
        _assert(mixin instanceof Function);
        var id = mixin[Mxr._ID];
        var mixins;
        if (id !== undefined) {
            while (object) {
                mixins = object[Mxr._MIXINS];
                if (mixins && (mixins[id] === mixin)) {
                    return true;
                }
                object = Object.getPrototypeOf(object);
            }
        }
        return false;
    };

    /**
    Tests if `object` is an instance of a `clazz` or an instance of a class mixed with `clazz`.

    In other words it tests for both static and dynamic inheritance.

        function A() {}
        function B() {}
        Mxr.mix(A,B);
        var a = new A();
        a instanceof A; //true
        a instanceof B; //false
        Mxr.is(a,A);    //true
        Mxr.is(a,B);    //true

    @method is
    @static
    @param object {Object} the instance under test
    @param clazz {Class} the class to check
    */
    Mxr.is = function(object, clazz) {
        _assert(clazz);
        _assert(clazz instanceof Function);
        return (object instanceof clazz) || Mxr.isStatically(object, clazz);
    };

    return Mxr;
});