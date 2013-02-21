describe("A Suite of dispatch tests", function() {
    it ("test dispatch on two values", function() {
        var isEmpty = defMulti(function(array) { return array.length === 0; });
        defMethod(isEmpty, true, function(array) { return true; });
        defMethod(isEmpty, false, function(array) { return false; });

        expect(isEmpty([])).toBeTruthy();
        expect(isEmpty([1])).toBeFalsy();
    });
});
