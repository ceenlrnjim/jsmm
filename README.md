jsmm
====
Something akin to clojure's multi-methods for javascript

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

