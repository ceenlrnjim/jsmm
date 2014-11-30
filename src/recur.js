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

        while (res !== null && res !== undefined && res._recurId === recurId) {

            arglen = res._args.length;
            args = new Array(arglen + 1);
            args[0] = recur;
            for (var i=0;i<arglen;i++) {
                args[i+1] = res._args[i];
            }

            // instead?: args = [recur].concat(res._args);

            res = bodyFn.apply(null, args);
        }

        return res;
    };

};

// this implementation is plagarized from https://gist.github.com/Gozala/1697037.  
// Reimplemented the idea here as an educational exercise
// This is pretty great as it can be applied/removed to an already recursive function, unlike the above which
// requires a special construction. 
var tco = function(bodyFn) {
    var recurring = false, nextArgs, currArgs;

    return function() {
        var result;
        
        // if the function is already running, then just get the next arguments to run the function with
        nextArgs = arguments;

        // if we haven't started recurring yet, kick off the process
        if (!recurring) {
            recurring = true;
            while (nextArgs !== undefined) {
                currArgs = nextArgs;
                nextArgs = undefined;
                // if this function call recurses, then nextArgs will be set to a new value
                result = bodyFn.apply(this, currArgs);
            }

            recurring = false;
            return result;
        }
    };
};
