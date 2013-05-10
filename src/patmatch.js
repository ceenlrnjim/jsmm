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

    var spy = function(t,f) {
        return function() {
        var v = f.apply(null, arguments);
            console.log("    - " + t + "> " + v.matches + " " + v.proceed + " " + v.caps);
            return v;
        };
    };

    var getMatchingFunction = function(vals, pairs) {
        // returns: {fn: x, caps: y}
        var r;
        for (var i=0, n=pairs.length;i<n;i+=2) {
            console.log("testing pattern " + i + " - " + pairs[i]);
            r = testPattern(pairs[i], vals);
            if (r.matches) {
                return {fn: pairs[i+1], caps: r.caps};
            }
        }

        return null;
    };

    var testPattern = function(pattern, vals) {
        // returns {matches:true/false, caps: {}}
        var r,lastElem;

        // check for otherwise pattern and length matching
        if (pattern === otherwise) {
            return {matches:true, caps: {}};
        } else if (pattern.length > vals.length) {
            return {matches:false, caps: {}};
        } else if (pattern.length < vals.length) {
            lastElem = pattern[pattern.length-1];
            if (lastElem !== rest &&
                (!lastElem || lastElem.typeIndicator !== restType)) {
                return {matches:false, caps: {}};
            }
        }

        var caps = {};
        for (var i=0, n=pattern.length;i<n;i++) {
            console.log(" - testing element " + i + " - " + pattern[i] + " vs. " + vals[i]);
            r = testArgument(pattern[i], vals[i], vals, i);
            if (!r.matches) { return {matches:false, caps: {}}; }

            for (var p in r.caps) { 
                caps[p] = r.caps[p]; 
            }

            // do not continue matching arguments - allows short circuiting match with 'rest'
            if (!r.proceed) { return {matches: r.matches, caps: caps}; }
        }

        return {matches: true, caps: caps}; 
    };

    /* ------------------ Start functions that match against specific semantic cases ----------------- */
    var wildcard = function(p,a) { 
        return {matches: p === _, proceed: true, caps: {}};
    };

    var valueMatch = function(p,a) { 
        return {matches: p === a, proceed: true, caps: {}};
    };

    var restMatch = function(p,a,vals,val_ix) {
        if (p === rest) {
            return {matches: true, proceed: false, caps: {}};
        } else {
            return {matches: false, proceed: true, caps: {}};
        }
    };

    var propertyMatch = function(p,a) {
        var caps = {};
        var r;
        if (typeof p !== 'object' || p === null) return {matches: false,proceed:true,caps:{}};
        for(var prop in p) { 
            // TODO: nesting and capture
            // plus other arguments to support "rest" etc.
            r = testArgument(p[prop], a[prop])
            if (!r.matches) return {matches: false,proceed:true,caps:{}};

            for (var subprop in r.caps) {
                caps[subprop] = r.caps[subprop];
            }
        }
        return {matches: true, proceed: true, caps: caps};
    };
    var arrayMatch = function(p,a) {
        if (Object.prototype.toString.call(p) === '[object Array]') {
            return testPattern(p, a);
        } else {
            return {matches: false, proceed: true, caps: {}};
        }
    };
    var captureWildcard = function(p,a) {
        var caps = {};
        if (p && p.typeIndicator === varType) {
            caps[p.key] = a;
            return {matches: true, proceed:true, caps:caps};
        } else {
            return {matches: false, proceed:true, caps:{}};
        }
    };
    var restCapture = function(p,a,as,ix) {
        var remainingArgs;
        var caps;
        if (p && p.typeIndicator === restType) {
            remainingArgs = new Array(as.length - ix);
            for (var j=0,m=as.length-ix;j<m;j++) {
                remainingArgs[j] = as[j+ix];
            }
            caps = {}
            caps[p.key] = remainingArgs;
            return {matches:true, proceed: false, caps: caps};
        } else {
            return {matches:false, proceed: true, caps: {}};
        }

    };

    var allMatchFns = [spy("wildcard",wildcard), 
                       spy("captureWildcard",captureWildcard), 
                       spy("restMatch",restMatch), 
                       spy("restCapture",restCapture), 
                       spy("arrayMatch",arrayMatch), 
                       spy("propertyMatch",propertyMatch), 
                       spy("valueMatch",valueMatch)];


    /* ----------------------------------------------------------------------------------------------- */

    /** Check if the specified pattern element (pe) matches the specified value (v) */
    var testArgument = function(pe, v, vals, vals_ix) {
        // returns {matches: t/f, proceed: t/f, caps: {}}
        var r;
        var cumCaps = {};
        // match against different potential cases until we find the first match 
        // or one of the cases tells us we should stop
        for (var i=0,n=allMatchFns.length;i<n;i++) {
            r = allMatchFns[i](pe,v,vals,vals_ix);
            if (r.matches || !r.proceed) {
                return r;
            }
        }
        return {matches: false};
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

        var targetFunction = getMatchingFunction(vals, pairs);
        if (targetFunction === null) {
            throw new TypeError("No pattern match");
        } else {
            finalArgs = Array.prototype.slice.call(vals);
            finalArgs.push(targetFunction.caps);
            return targetFunction.fn.apply(null, finalArgs);
        }
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
