// TODO: require module
var patmatch = (function() {
    'use strict';
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

    var spy = function(t,v) {
        //console.log("    - " + t + "> " + v);
        return v;
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
        // the values to match against
        var vals = arguments[0];
        // array of pattern,function,pattern,function,...
        var pairs = Array.prototype.slice.call(arguments,1);
        // Object to hold the values captured by wildcards or rest
        var extractedArgs;
        // arguments to be passed to the matching function
        var finalArgs;
        
        // Functions that test for different match cases
        var argTests = {
            wildcard: function(p,a) { return p === _;},
            valMatch: function(p,a) { return a === p; },
            propertyMatch: function(p,a) {
                if (typeof p !== 'object' || p === null) return false;
                for(var prop in p) { 
                    if (!argMatches(p[prop], a[prop])) return false;
                }
                return true;
            },
            arrayMatch: function(p,a) {
                return (Object.prototype.toString.call(p) === '[object Array]') && patternMatches(p, a);
            },
            captureWildcard: function(p,a) {
                if (p && p.typeIndicator === varType) {
                    extractedArgs[p.key] = a;
                    return true;
                } else {
                    return false;
                }
            }
        };

        /** Returns true if the specified pattern value matches the specified argument */
        var argMatches = function(p,a) {
            return spy("wildcard", argTests.wildcard(p,a)) ||
                   spy("captureWildcard", argTests.captureWildcard(p,a)) ||
                   spy("arrayMatch", argTests.arrayMatch(p,a)) ||
                   spy("propertyMatch", argTests.propertyMatch(p,a)) ||
                   spy("valMatch", argTests.valMatch(p,a));
        };

        /** Returns true if the specified pattern matches the specified arguments */
        var patternMatches = function(pattern, args) {
            // array to capture unmatched arguments when captured with a 'rest'
            var remainingArgs;
            // clear out any extracted arguments that may have been captured by a previous pattern
            extractedArgs = {};

            if (pattern === otherwise) {
                return true;
            }

            for (var i=0,n=pattern.length;i<n;i++) {
                //console.log(" - testing pattern element " + i);
                
                // skip matching against the remaining arguments
                if (pattern[i] === rest) {
                    break;
                } 
                // capture the remaining arguments in the specified variable name, but stop matching
                else if (pattern[i] && pattern[i].typeIndicator === restType) {
                    remainingArgs = new Array(args.length - i);
                    for (var j=0,m=args.length-i;j<m;j++) {
                        remainingArgs[j] = args[j+i];
                    }
                    extractedArgs[pattern[i].key] = remainingArgs;
                    break;
                } 
                // pattern and argument lengths don't match
                else if (i >= args.length) {
                    throw "Incorrect number of arguments, expected " + pattern.length + " got " + args.length;
                } 
                // Check if the ith element of the pattern matches the ith element of the arguments
                else if (!argMatches(pattern[i], args[i])) {
                    return false;
                } 
            }

            return true;
        };

        /** Test each pattern against the arguments to see which one matches */
        for (var i=0, n=pairs.length;i<n;i+=2) {
            //console.log("testing pattern " + i);
            if (patternMatches(pairs[i], vals)) {
                finalArgs = Array.prototype.slice.call(vals);
                finalArgs.push(extractedArgs);
                return pairs[i+1].apply(null, finalArgs);
            }
        }

        /** no match found - this is an error case, use 'otherwise' for a catch all */
        throw new TypeError("No pattern match");
    };

    var cons = function(v,a) {
        var r = new Array(a.length+1);
        r[0] = v;
        for (var i=0,n=a.length;i<n;i++) {
            r[i+1] = a[i];
        }
        return r;
    };

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
