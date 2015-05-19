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

    Mxr.abstract = function () {
        var newAbstract = function () {
            throw new Error("Abstract function not overriden");
        };
        newAbstract[Mxr._ABSTRACT] = true;
        return newAbstract;
    };

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

    Mxr.is = function(object, clazz) {
        _assert(clazz);
        _assert(clazz instanceof Function);
        return (object instanceof clazz) || Mxr.isStatically(object, clazz);
    };

    return Mxr;
});