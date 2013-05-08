describe("A suite of recursive function tests", function() {
    it("test no stack overflow", function() {
        var rangesum1 = function(a,total) {
            if (a === 0) return total;
            return rangesum1(a-1, total+a);
        };

        var rangesum2 = recurFunction(function(recur, a, total) {
            if (a === 0) return total;
            return recur(a-1, total+a);
        });

        var overflow = false;

        try {
            rangesum1(1000000,0);
        } catch (e) {
            overflow = true;
        }

        expect(overflow).toBeTruthy();
        overflow = false;

        try {
            rangesum2(1000000,0);
        } catch (e) {
            overflow = true;
        }
        expect(overflow).toBeFalsy();
    });
});
