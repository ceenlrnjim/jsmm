// pattern matching implementation based on parsing patterns with parcomb.js library
module.exports = (function() {
    var pc = require("../../jsmonads/src/parcomb.js").arrayParser; // we're parsing patterns that are arrays of JS objects
    var monads = require("../../jsmonads/src/jsmonads.js");
    var parser = monads.parser;
    // TODO: allow arguments that tell us which objects to use for the "keywords" rest, otherwise, _, etc

    var otherwise = {};
    var restType = {};
    var varType = {};

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

    var wildcard, acceptAny, literalValue, pattern, arrayParser, restParser, capturedWildcardParser, objectPatternParser;


    //
    // "AST" data types
    // no need for look ahead parsing - this is LL(1) parser since we parse each object
    //
    
    var Wildcard = function() {
    };
    Wildcard.prototype.satisfiedBy = function(v) {
        return {match: true, cont:true };
    };

    var CaptureWildcard = function(key) {
        this.key = key;
    };
    CaptureWildcard.prototype.satisfiedBy = function(v) {
        var caps = {};
        caps[this.key] = v;
        console.log("capturing " + caps);
        return {match:true, cont:true, caps: caps};
    };

    var Rest = function() {
    };
    Rest.prototype.satisfiedBy = function(v) {
        return {match: true, cont: false};
    };

    var ObjectPattern = function(o) {
        this.orderedKeys = [];
        this.orderedVals = [];
        for (var p in o) {
            this.orderedKeys.push(p);
            this.orderedVals.push(o[p]);
        }
    };
    ObjectPattern.prototype.satisfiedBy = function(o) {
    };

    var LiteralValue = function(v) {
        this.value = v;
    };
    LiteralValue.prototype.satisfiedBy = function(v) {
        return {match: this.value === v, cont: true};
    };

    var CompositePattern = function(elems) {
        this.elements = elems;
    };
    CompositePattern.prototype.satisfiedBy = function(vals) {
         debugger;
         var subresult;
         var caps = {};

        // literal value can't match an array/arguments collection
        var toStringType = Object.prototype.toString.call(vals);
        if (toStringType !== '[object Array]' && toStringType !== '[object Arguments]') {
            return {match: false, cont: true};
        }

         for (var i=0;i<vals.length;i++) {
            subresult = this.elements[i].satisfiedBy(vals[i])
            if (!subresult.match) {
                return {match: false, cont: true};
            } else if (!subresult.cont) {
                // continue is only consulted if match is true (no need to worry about cont semantics if match is false)
                return {match: true, cont: false};
            }

            // keep adding results to caps, since multiple properties might be wildcard captures
            for (var subprop in subresult.caps) {
                caps[subprop] = subresult.caps[subprop];
            }
        };

        return {match: true, cont: true, caps: caps};
    };
    
    //
    // parser combinators ----------------------------------------------------------------------------------
    //
    wildcard = monads.mdo(monads.parser, [pc.satisfies(function(o) { return o === _; })], function(o) {
        return parser.pure(new Wildcard());
    });
    
    // need to make sure this is last
    acceptAny = pc.satisfies(function(o) { return true; });
    literalValue = monads.mdo(parser, [acceptAny], function(o) {
        return parser.pure(new LiteralValue(o));
    });

    arrayParser = monads.mdo(parser, [pc.satisfies(function(o) { return Object.prototype.toString.call(o) === '[object Array]'; })],
        function(o) {
            return parser.pure(parser.run(pattern, o));
        });

    restParser = monads.mdo(parser, [pc.satisfies(function(o) { return o === rest; })],
        function(o) {
            return parser.pure(new Rest());
        });

    capturedWildcardParser = monads.mdo(parser, [pc.satisfies(function(o) { return o.typeIndicator === varType; })],
        function(o) {
            // TODO: need to parse all the property values
            return parser.pure(new CaptureWildcard(o.key));
        });

    objectPatternParser = monads.mdo(parser, [pc.satisfies(function(o) { return o !== null && typeof o === 'object'; })],
        function(o) {
            return parser.pure(new ObjectPattern(o));
        });

    pattern = monads.mdo(parser, [pc.many1(pc.or(wildcard, capturedWildcardParser, restParser, arrayParser, objectPatternParser literalValue))], function(es) {
        return parser.pure(new CompositePattern(es));
    });

    //
    // Pattern matching functions ----------------------------------------------------------------------------
    //

    var getMatchingFunction = function(vals, pairs) {
        // returns: {fn: x, caps: y}
        var r, pp;
        for (var i=0, n=pairs.length;i<n;i+=2) {
            //console.log("testing pattern " + i + " - " + pairs[i]);
            //Can't parse otherwise because we don't want it in an array
            if (pairs[i] === otherwise) {
                return { fn: pairs[i+1], caps: {} };
            } else {
                pp = parser.run(pattern, pairs[i]).satisfiedBy(vals);
                if (pp.match) {
                    return {fn: pairs[i+1], caps: pp.caps || {}};
                }
            }
        }

        return null;
    };

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

    /**
     * Defines a function that performs pattern matching against its arguments
     */
    var matchFn = function() {
        var pairs = arguments;
        return function() {
            return match.apply(null, cons(arguments, pairs));
        };
    };

    var cons = function(v,a) {
        var r = new Array(a.length+1);
        r[0] = v;
        for (var i=0,n=a.length;i<n;i++) {
            r[i+1] = a[i];
        }
        return r;
    };


    return {match: match,
            matchFn: matchFn,
            otherwise: otherwise,
            rest: rest,
            //where: where,
            _:_};

})();
