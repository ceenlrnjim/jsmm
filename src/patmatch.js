// TODO: require module
var patmatch = (function() {
    // using equality test on object identity here to detect certain values
    var otherwise = {};
    var varType = {};
    var restType = {};

    /** Placeholder used to indicate a wildcard in match expression, and optionally
     * to capture the value of that location.  Captured values are passed as an object
     * in an extra argument to the function
     */
    var _ = function(k) {
        return {key: k, typeIndicator: varType};
    };

    /** Placeholder for all the remaining arguments (or elements of a list)
     * that can optionally be used to capture the remaining values with the specified name
     */
    var rest = function(k) {
        return {key: k, typeIndicator: restType};
    };

    /**
     * Match an array of values against the specified patterns.
     * match([vals],
     *       pattern1, fn,
     *       pattern2, fn)
     *
     *  throws a TypeError if no pattern matches the values.  Use the otherwise literal pattern
     *  as a catch all (or wildcards)
     */
    var match = function() {
        var vals = arguments[0];
        var pairs = Array.prototype.slice.call(arguments,1);
        var extractedArgs = {}; // stateful - naughty
        var finalArgs;
        
        var wildcard = function(p,a) { return p === _;};
        var valMatch = function(p,a) { return a === p; };
        var propertyMatch = function(p,a) {
            var prop;
            if (typeof p !== 'object') return false;
            for(prop in p) { 
                if (!argMatches(p[prop], a[prop])) return false;
            }
            return true;
        };
        var arrayMatch = function(p,a) {
            return (Object.prototype.toString.call(p) === '[object Array]') && matches(p, a);
        };
        var captureWildcard = function(p,a) {
            if (p === undefined || p === null || p.typeIndicator !== varType) return false;

            extractedArgs[p.key] = a;
            return true;
        };

        /** Returns true if the specified pattern value matches the specified argument */
        var argMatches = function(p,a) {
            return wildcard(p,a) ||
                   captureWildcard(p,a) ||
                   arrayMatch(p,a) ||
                   propertyMatch(p,a) ||
                   valMatch(p,a);
        };

        /** Returns true if the specified pattern matches the specified arguments */
        var matches = function(pattern, args) {
            var remainingArgs;
            if (pattern === otherwise) {
                return true;
            } else {
                for (var i=0,n=pattern.length;i<n;i++) {
                    if (pattern[i] === rest) {
                        break;
                    } else if (pattern[i] !== undefined && pattern[i] !== null && pattern[i].typeIndicator === restType) {
                        remainingArgs = new Array(args.length - i);
                        for (var j=0,n=args.length-i;j<n;j++) {
                            remainingArgs[j] = args[j+i];
                        }
                        extractedArgs[pattern[i].key] = remainingArgs;
                        break;
                    } else if (i >= args.length) {
                        throw "Incorrect number of arguments, expected " + pattern.length + " got " + args.length;
                    } else if (!argMatches(pattern[i], args[i])) {
                        return false;
                    } 
                }

                return true;
            }
        };

        for (var i=0, n=pairs.length;i<n;i+=2) {
            if (matches(pairs[i], vals)) {
                finalArgs = Array.prototype.slice.call(vals);
                finalArgs.push(extractedArgs);
                return pairs[i+1].apply(null, finalArgs);
            }
        };

        throw new TypeError("No pattern match");
    };

    var cons = function(v,a) {
        var r = new Array(a.length+1);
        r[0] = v;
        for (var i=0,n=a.length;i<n;i++) {
            r[i+1] = a[i];
        }
        return r;
    }

    /**
     * Defines a function that performs pattern matching against its arguments
     */
    var matchFn = function() {
        var pairs = arguments;
        return function() {
            return match.apply(null, cons(arguments, pairs));
        };
    };

    return {match: match,
            matchFn: matchFn,
            otherwise: otherwise,
            rest: rest,
            _:_};
})();
