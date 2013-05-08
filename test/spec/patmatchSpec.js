describe("Suite of pattern matching tests", function() {
    it("test otherwise", function() {
        var testFn = matchFn(otherwise, function() { return 100; });
        expect(testFn(1)).toBe(100);
        expect(testFn("foo")).toBe(100);
        expect(testFn()).toBe(100);
    });

    it("test value match", function() {
        var testFn = matchFn(["1"], function() { return 1; },
                             ["2"], function() { return 2; },
                             otherwise, function() { return -1; });

        var multiTestFn = matchFn([1,2,3], function() { return "up"; },
                                  [3,2,1], function() { return "down";},
                                  [1,1,1], function() { return "all1";},
                                  [2,2,2], function() { return "all2";});

        expect(testFn("1")).toBe(1);
        expect(testFn("2")).toBe(2);
        expect(testFn("3")).toBe(-1);
        expect(multiTestFn(1,2,3)).toBe("up");
        expect(multiTestFn(3,2,1)).toBe("down");
        expect(multiTestFn(1,1,1)).toBe("all1");
        expect(multiTestFn(2,2,2)).toBe("all2");
    });

    it("test wildcard", function() {
        var testFn = matchFn([1,_,_], function() { return 1; },
                             [2,2,2], function() { return 2; },
                             [2,3,_], function() { return 3; });

        expect(testFn(1,"foo","bar")).toBe(1);
        expect(testFn(1,2,3)).toBe(1);
        expect(testFn(1,null,undefined)).toBe(1);
        expect(testFn(2,2,2)).toBe(2);
        expect(testFn(2,3,2)).toBe(3);
        expect(testFn(2,3,3)).toBe(3);
        expect(testFn(2,3,4)).toBe(3);
    });

    it("test arg count", function() {
        var testFn = matchFn([_,_], function() { return true; });
        var thrown = false;

        try {
            expect(testFn("a","b")).toBe(true);
            expect(testFn("a")).toBe(100);
        } catch (e) {
            thrown = true;
        }

        expect(thrown).toBe(true);
    });

    it("test wildcard capture", function() {
        var testFn = matchFn([1,_("one")], function(a,b,vals) { return vals.one; },
                             [_("two"), 2], function(a,b,vals) { return vals.two; });

        expect(testFn(1,"123")).toBe("123");
        expect(testFn(1,100)).toBe(100);
        expect(testFn(100, 2)).toBe(100);
        expect(testFn("foo", 2)).toBe("foo");
    });

    it("test property match and capture", function() {
        var testFn = matchFn([{id: -1, name: _("name")}], function(person, vals) { return "add " + vals.name; },
                             otherwise, function(person) { return "update " + person.id; });

        expect(testFn({id: -1, name: "Jim"})).toBe("add Jim");
        expect(testFn({id: 103, name: "John"})).toBe("update 103");
    });

    it("test list destructuring", function() {
        var testFn = matchFn([[_("head"), rest("tail")]], function(array, vals) {
            return [vals.head, vals.tail];
        });

        var testFn2 = matchFn([[1,2,3,rest]], function(array) { return "sequential"; },
                            otherwise, function(array) { return "otherwise"; });

        expect(testFn([1,2,3])[0]).toBe(1);
        expect(testFn([1,2,3])[1][0]).toBe(2);
        expect(testFn([1,2,3])[1][1]).toBe(3);
        expect(testFn2([1,2,3,4,5,6,7])).toBe("sequential");
        expect(testFn2([1,1,2,3,4,5,6])).toBe("otherwise");
    });


});
