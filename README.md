jsmm
====
Originally just something akin to clojure's multi-methods for javascript, but now includes a dumping ground for various experiments in functional programming with javascript

"overload" a method with an arbitrary dispatch function.

Trivial example: say I want to compute the income tax for people -


    var person1 = { name: "John",
                    address: { state: "NY" },
                    income: 50000 };

    var person2 = { name: "Jane",
                    address: { state: "NH" },
                    income: 50000 };

    var person3 = { name: "Phil",
                    address: { state: "CA" },
                    income: 50000 };
                
But I have different calculations for each state.  I can create a "polymorphic" function using defMulti.


    var computeIncomeTax = defMulti(function (p) { return p.address.state; },
                                    function noState(p) { return -1; });

This creates a function 'computeIncomeTax'.  
This function will apply the specified dispatch function to all its 
arguments and dispatch to a function associated with that value.
So, in this example I will choose the function to call based on the
person's state.  Now I need to add implementations for each state.


    defMethod(computeIncomeTax, "NY", 
            function(p) { 
                // some crazy calculations here
                return p.income * 0.20;
    });
        
    defMethod(computeIncomeTax, "NH", 
            function(p) { 
                // some crazy calculations here
                return 0;
            });

Here I've called defMethod with my function 'computeIncomeTax', and associated
a function with the value NY and NH.  Now I can call computeIncomeTax
for my people and get different results.

    [person1, person2, person3].forEach(function(p) {
        console.log(p.name + "'s income tax is " + computeIncomeTax(p));
    });

This outputs:

    John's income tax is 10000
    Jane's income tax is 0
    Phil's income tax is -1

recur.js
========

Allows some approximation of tail-recursive functions that aren't bound by stack size

A trivial recursive function

    > var sum_range_old = function(a, total) {
    ... if (a === 0) return total;
    ... else return sum_range_old(a-1, total+a);
    ... };
    undefined
    > sum_range_old(6,0);
    21
    > sum_range_old(1000000,0);
    RangeError: Maximum call stack size exceeded

Using recurFunction

    >  var sum_range = recurFunction(function(recur, a, total) {
    ... if (a === 0) return total
    ... else return recur(a-1, total+a);
    ... });
    undefined
    > sum_range(6,0);
    21
    > sum_range(1000000,0);
    500000500000

patmatch.js
===========
experiment for doing function dispatch based on pattern matching in javascript

Obligatory slow Fibonacci implementation and the 'otherwise' pattern

    > var matchFn = patmatch.matchFn;
    undefined
    > var otherwise = patmatch.otherwise;
    undefined
    > var _ = patmatch._;
    undefined
    > var rest = patmatch.rest;
    undefined
    > var fib = matchFn([0], function() { return 1; },
    ...                 [1], function() { return 1; },
    ...                 otherwise, function(n) { return fib(n-2) + fib(n-1); });
    undefined
    > fib(0);
    1
    > fib(1);
    1
    > fib(2);
    2
    > fib(3);
    3

Argument wildcards (note I'm using two underscores in my shorted local var since node uses single underscore for previous operation's result)

    > var otherwise = patmatch.otherwise
    undefined
    > var matchFn = patmatch.matchFn
    undefined
    > var match = patmatch.match
    undefined
    > var __ = patmatch._
    undefined
    > var rest = patmatch.rest
    undefined
    > var noXYZ = matchFn(["XYZ",__,__], function() { return -1; },
    ...                     [__,"S",__], function(a,b,c) { return c+2; },
    ...                     [__,"M",__], function(a,b,c) { return c+4; },
    ...                     otherwise, function(a,b,c) { return c+8; });
    undefined
    > noXYZ("XYZ","L", 100)
    -1
    > noXYZ("XYZ","S", 100)
    -1
    > noXYZ("ABC","S", 100)
    102
    > noXYZ("ABC","M", 100)
    104
    > noXYZ("ABC","XL", 100)
    108
    > noXYZ("DEF","M", 1)
    5

I can also capture the value of a wild card.  Captured values will be passed in an object as an extra argument at the end of the arguments array

    > var capture = matchFn([true, __("v")], function(flag, arg, vals) { return vals.v; },
    ...                     [false, __], function(flag, arg, vals) { return -1; });
    undefined
    > capture(true,4)
    4
    > capture(false,2)
    -1
    > capture(false,8)
    -1
    > capture(true, "ABC")
    'ABC'

Matching against object properties (wildcards and capturing apply to properties as well as nested objects and arrays).

    > var saveObject = matchFn([{id: null}], function(obj) { return "save " + obj.name; },
    ...                        otherwise, function(obj) { return "update " + obj.id; });
    undefined
    > saveObject({id: null, name: "Jane"});
    'save Jane'
    > saveObject({id: 42, name: "John"});
    'update 42'

Array arguments can be matched using all the same syntax as the arguments matching

    > var dimensions = matchFn([__, [0,__,__]], function() { return "no2d"; },
    .....                      [__, [__,0,__]], function() { return "no2d"; },
    .....                      [__, [__,__,0]], function() { return "no2d"; },
    .....                      [__, [__("x"), __("y"), __("z")]], function (color, dims, vs) {
    .......                         return { color: color, x: vs.x, y: vs.y, z: vs.z } });
    undefined
    > dimensions("red", [0,100,100])
    'no2d'
    > dimensions("red", [100,0,100])
    'no2d'
    > dimensions("red", [1,2,3])
    { color: 'red',
      x: 1,
      y: 2,
      z: 3 }

