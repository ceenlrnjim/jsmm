// TODO: require module
var patmatch = (function() {
    // using object identity for equality here
    var otherwise = {};
    var varType = {};
    var restType = {};
    var _ = function(k) {
        return {key: k, typeIndicator: varType};
    };
    var rest = function(k) {
        return {key: k, typeIndicator: restType};
    };

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
                // allow capture of values in object properties
                if (p[prop] !== undefined && p[prop] !== null && p[prop].typeIndicator === varType) {
                    extractedArgs[p[prop].key] = a[prop];
                } else {
                    if (p[prop] !== a[prop]) return false; 
                }
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

        var argMatches = function(p,a) {
            return wildcard(p,a) ||
                   captureWildcard(p,a) ||
                   arrayMatch(p,a) ||
                   propertyMatch(p,a) ||
                   valMatch(p,a);
        };

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
