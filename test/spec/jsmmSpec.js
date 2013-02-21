describe("A Suite of dispatch tests", function() {
    it ("test dispatch on two values", function() {
        var isEmpty = defMulti(function(array) { return array.length === 0; });
        defMethod(isEmpty, true, function(array) { return true; });
        defMethod(isEmpty, false, function(array) { return false; });

        expect(isEmpty([])).toBeTruthy();
        expect(isEmpty([1])).toBeFalsy();
    });

    it ("Test dispatch to default", function() {
        var fn = defMulti(function(o) { return 2; },
                          function(o) { return false; },
                          [0, function() { return true; },
                           1, function() { return true; }]);

        expect(fn("doesn't matter")).toBeFalsy();
    });

    it ("test extending", function() {
        var fn = defMulti(function(o) { return o[0]; },
                          function(o) { return o[0]; });
        defMethod(fn, 0, function(o) { return "got a 0"; });
        defMethod(fn, 1, function(o) { return "got a 1"; });

        expect(fn([0])).toBe("got a 0");
        expect(fn([2])).toBe(2);

        defMethod(fn, 2, function(o) { return "now I got a 2"; });

        expect(fn([2])).toBe("now I got a 2");
    });
});
