/*!
*  Mxr.js 0.1.0
*
*  (c) valentino miazzo
*
*  MIT license
*
*  https://github.com/valentinomiazzo/mxr_js
*/

/*jshint browser: true, bitwise: true, nomen: true, plusplus: true, indent: 4, expr: false, -W030 */
/*global define*/

define([
    "module"
], function(module) {
    "use strict";

    function _s_copy(dst, src) {
        var member;
        for (member in src) {
            if (src.hasOwnProperty(member)) {
                dst[member] = src[member];
            }
        }
    }

    function _defaultAssert(trueish, message) {
        if (!trueish) {
            //TODO: add more details about the failure, like stack trace
            throw new Error(message || "_assert violated ...");
        }
    }

    var _assert = _defaultAssert;

    /**
    This is the collection of static methods exposed by Mxr.js

    @class Mxr
    @static
    */
    var Mxr = {};

    Mxr._UTL_PFX = "_Mxr_";

    Mxr._COPIED_MEMBERS = Mxr._UTL_PFX + "_copiedMembers";
    Mxr._MIXINS = Mxr._UTL_PFX + "_mixins";
    Mxr._ABSTRACT = Mxr._UTL_PFX + "_abstract";
    Mxr._ID = Mxr._UTL_PFX + "_id";

    Mxr._s_IdGenerator = 0;

    /**
    Configures the library.
    It expects a JSON like the following:

        {
            "assert" : callback,
            "In": module
        }

    It is called at load time by require.js passing as `config` the config of the module.
    Anyway, you can call it again anytime.

    Fields description:

    `assertCallback`:
    Optional. The signature is `void assert(boolean, String)`.
    If you pass `null` then assertions are disabled.
    If you pass `undefined` then the default implementation is used.

    `In`:
    Optional. If you pass the `In.js` module here then it is merged with `Mxr.js` module.
    This is handy if you want to call `Mxr.inheritFrom(a,b)`.
    It is ignored if already merged.
    It cannot be reverted.

    @method configure
    @static
    @param config {Object} the configuration object
    */
    Mxr.configure = function(config) {
        _assert && _assert(config !== null, "config is null");

        if (config.In) {
            if (!Mxr._In) {
                Mxr._In = config.In;
                var oldConfigure = Mxr.configure;
                _s_copy(Mxr, config.In);
                Mxr.configure = oldConfigure;
            }
        }

        if (config.assert) {
            _assert && _assert(typeof config.assert === "function", "assert is not a function");
            _assert = config.assert;
        } else if (config.assert === null) {
            _assert = null;
        } else {
            _assert = _defaultAssert;
        }

        if (Mxr._In) { Mxr._In.configure(config); }
    };

    Mxr.configure(module.config());

    /**
    Declares a method abstract.

    In this way the library can help you to spot abstract methods not properly overridden.
    Under the hoods, it generates a new stub function with troubleshooting code inside.

        function M() {}
        M.prototype.doCoreStuff = Mxr.anAbstract(); //Note is anAbstract(); not anAbstract;
        M.prototype.doStuf = function () {
            //something before
            this.doCoreStuff();
            //something after
        }

    @method anAbstract
    @static
    */
    Mxr.anAbstract = function () {
        var newAbstract = function () {
            throw new Error("Abstract function not overriden");
        };
        newAbstract[Mxr._ABSTRACT] = true;
        return newAbstract;
    };

    /**
    @method abstract
    @static
    @deprecated use anAbstract
    */
    Mxr.abstract = Mxr.anAbstract;

    /**
    Tests if `member` is an abstract method (declared with `Mxr.anAbstract()`).

        if (Mxr.isAbstract(M.prototype.doStuff) {
            //...
        }

    @method isAbstract
    @static
    @param member {Function} the member to test
    */
    Mxr.isAbstract = function (member) {
        _assert && _assert(member instanceof Function, "member is not a function.");
        _assert && _assert(
            member !== Mxr.anAbstract,
            "When declaring an abstract method you should use Mxr.anAbstract(); not Mxr.anAbstract;"
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
                    //We want to check abstract misuse
                    if (src[member] instanceof Function) {
                        srcIsAbstract = Mxr.isAbstract(src[member]);
                    }
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
    Mixes class `clazz` with mixin `mixin`.

    This is a form of static inheritance in the sense that modification performed to the prototype of `mixin` after calling `mixWith()` aren't reflected on the mixed classes.

    This is different from prototypal inheritance where modifications are propagated to subclasses and therefore is a sort of dynamic inheritance.

    What makes mixins interesting is that they support multliple inheritance.

        function M() {}
        M.prototype.X = 0;
        function A() {}
        A.prototype.Y = 0;
        Mxr.mixWith(A,M);
        var a = new A();
        a.X == 0;                 //true
        a.Y == 0;                 //true
        M.prototype.X = 1;
        A.prototype.X = 1;
        a.X == 1;                 //false, static inheritance
        a.Y == 1;                 //true, dynamic inheritance

    @method mixWith
    @static
    @param clazz {Class} the destination class
    @param mixin {Class} the mix-in
    */
    Mxr.mixWith = function(clazz, mixin) {
        _assert && _assert(clazz, "clazz is null or undefined.");
        _assert && _assert(clazz instanceof Function, "clazz is not a class.");
        Mxr._mixObjectWith(clazz.prototype, mixin);
    };

    /**
    @method mix
    @static
    @deprecated use mixWith
    */
    Mxr.mix = Mxr.mixWith;

    //This version applies a mixin to an instance
    Mxr.mixObjectWith = function(object, mixin) {
        Mxr._mixObjectWith(object, mixin);
        _assert && _assert(mixin.length === 0, "Ctor of mixin has no parameters.");
        mixin.call(object);
    };

    Mxr.mixObject = Mxr.mixObjectWith;

    Mxr._mixObjectWith = function(object, mixin) {
        _assert && _assert(object, "object is null or undefined.");
        _assert && _assert(mixin, "mixin is null or undefined.");
        _assert && _assert(mixin instanceof Function, "mixin is not a class.");
        if (mixin[Mxr._ID] === undefined) {
            mixin[Mxr._ID] = Mxr._s_IdGenerator;
            Mxr._s_IdGenerator += 1;
        }
        _assert && _assert(
            !Mxr.isMixedWith(object, mixin),
            "Mixed the same class multiple times. Target=" + object + " Mixin=" + mixin
        );
        Mxr._copy(object, mixin.prototype);
        var mixins = object.hasOwnProperty(Mxr._MIXINS) ? object[Mxr._MIXINS] : {};
        mixins[mixin[Mxr._ID]] = mixin; //adds the mixin
        Mxr._copyMixins(mixins, mixin.prototype[Mxr._MIXINS]); //and the mixin's mixins
        object[Mxr._MIXINS] = mixins;
        _assert && _assert(Mxr.isMixedWith(object, mixin), "Internal error. isStatically returns false after mixing. Open a ticket.");
    };

    Mxr._copyMixins = function(dst, src) {
        var id;
        if (src) {
            for (id in src) {
                if (src.hasOwnProperty(id)) {
                    _assert && _assert(!dst.hasOwnProperty(id));
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
        Mxr.mixWith(A,B);
        var a = new A();
        a instanceof A;           //true
        a instanceof B;           //false
        Mxr.isMixedWith(a,A);    //false
        Mxr.isMixedWith(a,B);    //true

    @method isMixedWith
    @static
    @param object {Object} the instance under test
    @param mixin {Class} the mix-in to check
    */
    Mxr.isMixedWith = function(object, mixin) {
        _assert && _assert(mixin, "mixin is null or undefined.");
        _assert && _assert(mixin instanceof Function, "mixin is not a class.");
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
    @method isStatically
    @static
    @deprecated use isMixedWith
    */
    Mxr.isStatically = Mxr.isMixedWith;

    /**
    Tests if `object` is an instance of a `clazz` or an instance of a class mixed with `clazz`.

    In other words it tests for both static and dynamic inheritance.

        function A() {}
        function B() {}
        Mxr.mixWith(A,B);
        var a = new A();
        a instanceof A; //true
        a instanceof B; //false
        Mxr.isA(a,A);    //true
        Mxr.isA(a,B);    //true

    @method isA
    @static
    @param object {Object} the instance under test
    @param clazz {Class} the class to check
    */
    Mxr.isA = function(object, clazz) {
        _assert && _assert(clazz, "clazz is null or undefined.");
        _assert && _assert(clazz instanceof Function, "clazz is not a class.");
        return (object instanceof clazz) || Mxr.isMixedWith(object, clazz);
    };

    /**
    @method is
    @static
    @deprecated use isA
    */
    Mxr.is = Mxr.isA;

    return Mxr;
});