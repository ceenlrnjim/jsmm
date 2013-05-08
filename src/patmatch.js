// using object identity for equality here
var otherwise = {};
var varType = {};
var _ = function(k) {
    return {key: k, typeIndicator: varType};
}
var rest = {}; // TODO - change this to a function as well to allow capturing of the rest of the array

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
    // TODO: should this all be in wildcard?
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
    }

    var matches = function(pattern, args) {
        if (pattern === otherwise) {
            return true;
        } else {
            for (var i=0,n=pattern.length;i<n;i++) {
                if (pattern[i] === rest) {
                    break;
                } else if (i >= args.length) {
                    throw "Incorrect number of arguments, expected " + pattern.length + " got " + args.length;
                } else if (!argMatches(pattern[i], args[i])) {
                    return false;
                } 
            }

            return true;
        }
    }

    for (var i=0, n=pairs.length;i<n;i+=2) {
        if (matches(pairs[i], vals)) {
            finalArgs = Array.prototype.slice.call(vals);
            finalArgs.push(extractedArgs);
            return pairs[i+1].apply(null, finalArgs);
        }
    }

    throw "No pattern match";
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


var patTest = matchFn(
    [1, _], function() { console.log("1 is the lonliest number"); },
    [_, 2], function() { console.log("b is 2"); },
    [_, {foo: "abc", bar:"bar"}], function() { console.log("found an abc"); },
    otherwise, function() { console.log("default"); }
);

var arrayPatTest = matchFn(
    [_, [_, 5, _]], function() { console.log("nested arrays work"); },
    otherwise, function() { console.log("default"); }
);

var manyArgTest = matchFn(
    [1,_,_,_], function() { console.log("multi - match 1");},
    [_,2,rest], function() { console.log("multi - match 2");},
    otherwise, function() { console.log("default"); }
);

var destructTest = matchFn(
    [1,_("a")], function(a,b,vals) { console.log(vals.a); },
    [2,{foo:123, bar: _("bar")}], function(a,b,vals) { console.log("captured property value " + vals.bar); },
    [[_("head"), rest], _("b")], function(x,y,vals) { console.log("captured head with value " + vals.head + " and b is " + vals.b); },
    otherwise, function() { console.log("default"); }
);

match([1,2],
    [1, _], function() { console.log("1 is the lonliest number"); },
    [_, 2], function() { console.log("b is 2"); },
    [_, {foo: "abc", bar:"bar"}], function() { console.log("found an abc"); },
    otherwise, function() { console.log("default"); });

match([3,3],
    [1, _], function() { console.log("1 is the lonliest number"); },
    [_, 2], function() { console.log("b is 2"); },
    [_, {foo: "abc", bar:"bar"}], function() { console.log("found an abc"); },
    otherwise, function() { console.log("default"); });

(patTest(1,2));
(patTest(2,2));
(patTest(2,3));
(patTest(2, {bar: "baz", foo: "abc"}));
(patTest(2, {bar: "bar", foo: "abc"}));
arrayPatTest(0, [1,4,5]);
arrayPatTest(0, [1,5,5]);
manyArgTest(1,2,3,4);
manyArgTest(2,2,3,4);
manyArgTest(2,1,3,4);
manyArgTest(2,1,3,4,5);
console.log("Destructuring...");
destructTest(1,"thisIsArgumentValue a");
destructTest([1,2,3,4,5], "foo");
destructTest([1,2,3,4,5], "foo");
destructTest(2, {foo: 123, bar: "hello world"});
