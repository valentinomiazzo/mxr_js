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
/*global define, describe, it, expect */

define([
    "Mxr", "In"
], function(Mxr, In) {
    "use strict";

    function A(y) {
        var self = this;
        self.y = y;
    }
    A.prototype.a = function (x) {
        var self = this;
        return x * self.y;
    };

    function M() {
        var self = this;
        self._m = 0;
    }
    M.prototype.m = function (x) {
        var self = this;
        //assumes it is mixed with a class having an y member
        //TODO: how declare this? how to check this?
        return x * self.y + self._m;
    };

    function D(y) {
        var self = this;
        A.call(self, y);
        M.call(self);
    }
    D.prototype = Object.create(A.prototype);
    D.prototype.d = function (x) {
        var self = this;
        return self.a(x) * 2;
    };
    Mxr.mixWith(D, M);

    function M2() {
        var self = this;
        self._m2 = 0;
    }
    M2.prototype.m2 = function (x) {
        var self = this;
        //assumes it is mixed with a class having an y member (how declare this? how to check this?)
        return x * self.y + self._m2;
    };

    function F(y) {
        var self = this;
        D.call(self, y);
        M2.call(self);
    }
    F.prototype = Object.create(D.prototype);
    F.prototype.f = function (x) {
        var self = this;
        return x * self.y;
    };
    Mxr.mixWith(F, M2);

    describe("The Mxr module", function() {

        it("supports mixins, aka static inheritance", function() {
            function C(y) {
                var self = this;
                self.y = y;
                M.call(self);
            }
            C.prototype.c = function (x) {
                var self = this;
                return x * self.y;
            };

            Mxr.mixWith(C, M);

            var i = new C(2);
            expect(i.c(3)).toBe(6);
            expect(i.m(4)).toBe(8);
            expect(i instanceof C).toBe(true);
            expect(i instanceof M).toBe(false);
            expect(Mxr.isA(i, C)).toBe(true);
            expect(Mxr.isA(i, M)).toBe(true);
            expect(Mxr.isMixedWith(i, M)).toBe(true);
        });

        it("can apply a mixin to an object", function() {
            var i = new A(2);
            expect(i.m).toBe(undefined);
            expect(Mxr.isMixedWith(i, M)).toBe(false);
            Mxr.mixObjectWith(i, M);
            expect(i.a(3)).toBe(6);
            expect(i.m(4)).toBe(8);
            expect(i instanceof A).toBe(true);
            expect(i instanceof M).toBe(false);
            expect(Mxr.isA(i, A)).toBe(true);
            expect(Mxr.isA(i, M)).toBe(true);
            expect(Mxr.isMixedWith(i, M)).toBe(true);
        });

        it("can apply a mixin to a derived class", function() {
            var i = new D(2);
            expect(i.a(3)).toBe(6);
            expect(i.d(3)).toBe(12);
            expect(i.m(4)).toBe(8);
            expect(i instanceof A).toBe(true);
            expect(i instanceof D).toBe(true);
            expect(i instanceof M).toBe(false);
            expect(Mxr.isA(i, A)).toBe(true);
            expect(Mxr.isA(i, D)).toBe(true);
            expect(Mxr.isA(i, M)).toBe(true);
            expect(Mxr.isMixedWith(i, M)).toBe(true);
        });

        it("can apply multiple mixins to a class", function() {
            function E(y) {
                var self = this;
                self.y = y;
                M.call(self);
                M2.call(self);
            }
            E.prototype.e = function (x) {
                var self = this;
                return x * self.y;
            };
            Mxr.mixWith(E, M);
            Mxr.mixWith(E, M2);

            var i = new E(2);
            expect(i.e(3)).toBe(6);
            expect(i.m(4)).toBe(8);
            expect(i.m2(4)).toBe(8);
            expect(i instanceof E).toBe(true);
            expect(i instanceof M).toBe(false);
            expect(i instanceof M2).toBe(false);
            expect(Mxr.isA(i, E)).toBe(true);
            expect(Mxr.isA(i, M)).toBe(true);
            expect(Mxr.isA(i, M2)).toBe(true);
            expect(Mxr.isMixedWith(i, M)).toBe(true);
            expect(Mxr.isMixedWith(i, M2)).toBe(true);
        });

        it("can apply multiple mixins to an instance", function() {
            var i = new A(2);
            expect(i.a(3)).toBe(6);
            expect(i.m).toBe(undefined);
            expect(i.m2).toBe(undefined);
            expect(Mxr.isMixedWith(i, M)).toBe(false);
            expect(Mxr.isMixedWith(i, M2)).toBe(false);
            Mxr.mixObjectWith(i, M);
            Mxr.mixObjectWith(i, M2);
            expect(i.a(3)).toBe(6);
            expect(i.m(4)).toBe(8);
            expect(i.m2(4)).toBe(8);
            expect(i instanceof A).toBe(true);
            expect(i instanceof M).toBe(false);
            expect(i instanceof M2).toBe(false);
            expect(Mxr.isA(i, A)).toBe(true);
            expect(Mxr.isA(i, M)).toBe(true);
            expect(Mxr.isA(i, M2)).toBe(true);
            expect(Mxr.isMixedWith(i, M)).toBe(true);
            expect(Mxr.isMixedWith(i, M2)).toBe(true);
        });

        it("can apply a mixin to a class derived from a class with mixins", function() {
            var i = new F(2);
            expect(i.a(3)).toBe(6);
            expect(i.d(3)).toBe(12);
            expect(i.f(3)).toBe(6);
            expect(i.m(4)).toBe(8);
            expect(i.m2(4)).toBe(8);
            expect(i instanceof A).toBe(true);
            expect(i instanceof D).toBe(true);
            expect(i instanceof F).toBe(true);
            expect(i instanceof M).toBe(false);
            expect(i instanceof M2).toBe(false);
            expect(Mxr.isA(i, A)).toBe(true);
            expect(Mxr.isA(i, D)).toBe(true);
            expect(Mxr.isA(i, F)).toBe(true);
            expect(Mxr.isA(i, M)).toBe(true);
            expect(Mxr.isA(i, M2)).toBe(true);
            expect(Mxr.isMixedWith(i, M)).toBe(true);
            expect(Mxr.isMixedWith(i, M2)).toBe(true);
            //No sidefx on base class
            var i2 = new D(2);
            expect(i2.f).toBe(undefined);
            expect(i2.m2).toBe(undefined);
            expect(Mxr.isMixedWith(i2, M2)).toBe(false);
        });

        it("can apply a mixin to an instance of a class derived from a class with mixins", function() {
            var i = new D(2);
            expect(i.a(3)).toBe(6);
            expect(i.d(3)).toBe(12);
            expect(i.m(4)).toBe(8);
            expect(i instanceof A).toBe(true);
            expect(i instanceof D).toBe(true);
            expect(i instanceof M).toBe(false);
            expect(Mxr.isA(i, A)).toBe(true);
            expect(Mxr.isA(i, D)).toBe(true);
            expect(Mxr.isA(i, M)).toBe(true);
            expect(Mxr.isMixedWith(i, M)).toBe(true);
            Mxr.mixObjectWith(i, M2);
            expect(i.m2(4)).toBe(8);
            expect(i instanceof M2).toBe(false);
            expect(Mxr.isA(i, M2)).toBe(true);
            expect(Mxr.isMixedWith(i, M2)).toBe(true);
            //No sidefx on base class
            var i2 = new D(2);
            expect(i2.m2).toBe(undefined);
            expect(Mxr.isMixedWith(i2, M2)).toBe(false);
        });

        it("detects multiple mixes of the same class", function() {
            function Mixin() {}

            function Stuff() {}
            Mxr.mixWith(Stuff, Mixin);
            try {
                expect(Mxr.mixWith(Stuff, Mixin)).toBe("shouldNotGoHere");
            } catch (e) {}
        });

        it("when mixes a class, allows member override of abstract methods", function() {
            function Mixin() {}
            Mixin.prototype.f = Mxr.anAbstract();

            function Stuff() {}
            Stuff.prototype.f = function() { return 1; };
            Mxr.mixWith(Stuff, Mixin);

            var s = new Stuff();
            expect(s.f()).toBe(1);
        });

        it("when mixes a class, doesn't allow member override of concrete methods", function() {
            function Mixin() {}
            Mixin.prototype.f = function() { return 0; };

            function Stuff() {}
            Stuff.prototype.f = function() { return 1; };
            try {
                expect(Mxr.mixWith(Stuff, Mixin)).toBe("shouldNotGoHere");
            } catch (e) {}
        });

        it("detects if there is a clash between mixins", function() {
            function Mixin1() {}
            Mixin1.prototype.f = function() { return 0; };

            function Mixin2() {}
            Mixin2.prototype.f = function() { return 0; };

            function Stuff() {}
            Mxr.mixWith(Stuff, Mixin1);
            try {
                expect(Mxr.mixWith(Stuff, Mixin2)).toBe("shouldNotGoHere");
            } catch (e) {}
        });

        it("warns you when Mxr.anAbstract() is misused", function() {
            function MixinOK() {}
            MixinOK.prototype.f = Mxr.anAbstract();
            expect(Mxr.isAbstract(MixinOK.prototype.f)).toBe(true);

            function A() {}
            Mxr.mixWith(A, MixinOK); //doesn"t throw

            function MixinBad() {}
            MixinBad.prototype.f = Mxr.anAbstract; //wrong use
            try {
                expect(Mxr.isAbstract(MixinBad.prototype.f)).toBe("shouldNotGoHere");
            } catch (e) {}

            function B() {}
            try {
                expect(Mxr.mixWith(B, MixinBad)).toBe("shouldNotGoHere");
            } catch (e) {}
        });

        it("doesn't overwrite properties attached to abstract methods", function() {
            function Mixin1() {}
            Mixin1.prototype.f = Mxr.anAbstract();
            Mixin1.prototype.f.findMe = 1;
            Mixin1.prototype.f.iAm1 = 1;
            expect(Mixin1.prototype.f.findMe).toBe(1);
            expect(Mixin1.prototype.f.iAm1).toBe(1);
            expect(Mixin1.prototype.f.iAm2).toBe(undefined);

            function Mixin2() {}
            Mixin2.prototype.f = Mxr.anAbstract();
            Mixin2.prototype.f.findMe = 2;
            Mixin2.prototype.f.iAm2 = 2;
            expect(Mixin2.prototype.f.findMe).toBe(2);
            expect(Mixin2.prototype.f.iAm1).toBe(undefined);
            expect(Mixin2.prototype.f.iAm2).toBe(2);
        });

        it(",when mixing, copies (shallow) properties attached to abstract methods to the overriding methods. Except if already defined.", function() {
            function Mixin1() {}
            Mixin1.prototype.f = Mxr.anAbstract();
            Mixin1.prototype.f.findMe = 1;
            Mixin1.prototype.f.blocked = 2;

            function A() {}
            A.prototype.f = function () { return 2; };
            A.prototype.f.blocked = 3;
            Mxr.mixWith(A, Mixin1);

            var a = new A();
            expect(a.f()).toBe(2);
            expect(A.prototype.f.findMe).toBe(1);
            expect(a.f.findMe).toBe(1);
            expect(A.prototype.f.blocked).toBe(3);
            expect(a.f.blocked).toBe(3);
        });

        it("has an is() method that works recursively", function() {
            function A() {}

            function B() {}
            Mxr.mixWith(B, A);

            function C() {}
            Mxr.mixWith(C, B);

            var a = new A();
            var b = new B();
            var c = new C();

            expect(Mxr.isA(a, A)).toBe(true);
            expect(Mxr.isA(b, A)).toBe(true);
            expect(Mxr.isA(b, B)).toBe(true);
            expect(Mxr.isA(c, A)).toBe(true);
            expect(Mxr.isA(c, B)).toBe(true);
            expect(Mxr.isA(c, C)).toBe(true);
        });

        it("allows to override the default assert callback. In this way you can inject your preferred framework (e.g. Chai)", function() {
            var assertCalled = false;
            var assertCallback = function (trueish, message) {
                if (!trueish) {
                    assertCalled = !trueish;
                    throw new Error(message);
                }
            };
            Mxr.configure({
                "assert": assertCallback
            });

            expect(Mxr.mixWith.bind(null, null)).toThrow();

            expect(assertCalled).toBe(true);

            Mxr.configure({
                "assert": undefined  //default behavior
            });
        });

        it("allows you to disable assertions, if you want.", function() {
            Mxr.configure({
                "assert": null  //no assertions
            });
            function Base() { return; }
            function Special() { return; }
            Mxr.mixWith(Special, Base);

            Mxr.mixWith(Special, Base); //double mix doesn"t throw

            Mxr.configure({
                "assert": undefined  //default behavior
            });
        });

        it("allows you to merge in In.js, if you want.", function() {
            Mxr.configure({
                "In": In
            });

            expect(Mxr.inherit !== undefined).toBe(true);
        });

        it("uses shallow-copy when mixing which can give surprising results when doing Monkey Patching.", function() {
            //The mix-in
            function M() {}
            M.prototype.V = 0;
            M.prototype.R = { x: 0, y: 0 };

            //The class and the mixing
            function C() {}
            Mxr.mixWith(C,M);
            var c = new C();

            M.prototype.V = 1; //We modify the mix-in after mixing
            expect(c.V === 0).toBe(true); //No side-fx expected

            M.prototype.R.x = 10; //We modify the mix-in after mixing
            expect(c.R.x === 10).toBe(true);
            //This time we have side-fx because the reference was copied but not cloned (deep copy)
            //Therefore, M, C and its instances point all to the same object.

            M.prototype.R = { x: 8, y: 8 }; //We modify the mix-in after mixing
            expect(c.R.y === 0).toBe(true);
            //No side-fx, we replaced the reference of the mixin with a new object.
            //C and its instances still point to the old object.
        });

        //it("detects if there is a clash between mixins and it was handled", function() {
        //});

    });

    return null;
});