var recurFunction = function(bodyFn) {
    var recurId = {};
    var recur = function() {
        return { _recurId: recurId,
                 _args: arguments };
    };

    return function() {
        var args;
        var arglen;
        var res = { _recurId: recurId,
                    _args: arguments};

        while (res !== null && res._recurId === recurId) {

            arglen = res._args.length;
            args = new Array(arglen + 1);
            args[0] = recur;
            for (var i=0;i<arglen;i++) {
                args[i+1] = res._args[i];
            }

            res = bodyFn.apply(null, args);
        }

        return res;
    };

};
