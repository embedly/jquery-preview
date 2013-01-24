/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/

var Mustache = function() {
  var Renderer = function() {};

  Renderer.prototype = {
    otag: "{{",
    ctag: "}}",
    pragmas: {},
    buffer: [],
    pragmas_implemented: {
      "IMPLICIT-ITERATOR": true
    },
    context: {},

    render: function(template, context, partials, in_recursion) {
      // reset buffer & set context
      if(!in_recursion) {
        this.context = context;
        this.buffer = []; // TODO: make this non-lazy
      }

      // fail fast
      if(!this.includes("", template)) {
        if(in_recursion) {
          return template;
        } else {
          this.send(template);
          return;
        }
      }

      template = this.render_pragmas(template);
      var html = this.render_section(template, context, partials);
      if(in_recursion) {
        return this.render_tags(html, context, partials, in_recursion);
      }

      this.render_tags(html, context, partials, in_recursion);
    },

    /*
      Sends parsed lines
    */
    send: function(line) {
      if(line != "") {
        this.buffer.push(line);
      }
    },

    /*
      Looks for %PRAGMAS
    */
    render_pragmas: function(template) {
      // no pragmas
      if(!this.includes("%", template)) {
        return template;
      }

      var that = this;
      var regex = new RegExp(this.otag + "%([\\w-]+) ?([\\w]+=[\\w]+)?" +
            this.ctag);
      return template.replace(regex, function(match, pragma, options) {
        if(!that.pragmas_implemented[pragma]) {
          throw({message: 
            "This implementation of mustache doesn't understand the '" +
            pragma + "' pragma"});
        }
        that.pragmas[pragma] = {};
        if(options) {
          var opts = options.split("=");
          that.pragmas[pragma][opts[0]] = opts[1];
        }
        return "";
        // ignore unknown pragmas silently
      });
    },

    /*
      Tries to find a partial in the curent scope and render it
    */
    render_partial: function(name, context, partials) {
      name = this.trim(name);
      if(!partials || partials[name] === undefined) {
        throw({message: "unknown_partial '" + name + "'"});
      }
      if(typeof(context[name]) != "object") {
        return this.render(partials[name], context, partials, true);
      }
      return this.render(partials[name], context[name], partials, true);
    },

    /*
      Renders inverted (^) and normal (#) sections
    */
    render_section: function(template, context, partials) {
      if(!this.includes("#", template) && !this.includes("^", template)) {
        return template;
      }

      var that = this;
      // CSW - Added "+?" so it finds the tighest bound, not the widest
      var regex = new RegExp(this.otag + "(\\^|\\#)\\s*(.+)\\s*" + this.ctag +
              "\n*([\\s\\S]+?)" + this.otag + "\\/\\s*\\2\\s*" + this.ctag +
              "\\s*", "mg");

      // for each {{#foo}}{{/foo}} section do...
      return template.replace(regex, function(match, type, name, content) {
        var value = that.find(name, context);
        if(type == "^") { // inverted section
          if(!value || that.is_array(value) && value.length === 0) {
            // false or empty list, render it
            return that.render(content, context, partials, true);
          } else {
            return "";
          }
        } else if(type == "#") { // normal section
          if(that.is_array(value)) { // Enumerable, Let's loop!
            return that.map(value, function(row) {
              return that.render(content, that.create_context(row),
                partials, true);
            }).join("");
          } else if(that.is_object(value)) { // Object, Use it as subcontext!
            return that.render(content, that.create_context(value),
              partials, true);
          } else if(typeof value === "function") {
            // higher order section
            return value.call(context, content, function(text) {
              return that.render(text, context, partials, true);
            });
          } else if(value) { // boolean section
            return that.render(content, context, partials, true);
          } else {
            return "";
          }
        }
      });
    },

    /*
      Replace {{foo}} and friends with values from our view
    */
    render_tags: function(template, context, partials, in_recursion) {
      // tit for tat
      var that = this;

      var new_regex = function() {
        return new RegExp(that.otag + "(=|!|>|\\{|%)?([^\\/#\\^]+?)\\1?" +
          that.ctag + "+", "g");
      };

      var regex = new_regex();
      var tag_replace_callback = function(match, operator, name) {
        switch(operator) {
        case "!": // ignore comments
          return "";
        case "=": // set new delimiters, rebuild the replace regexp
          that.set_delimiters(name);
          regex = new_regex();
          return "";
        case ">": // render partial
          return that.render_partial(name, context, partials);
        case "{": // the triple mustache is unescaped
          return that.find(name, context);
        default: // escape the value
          return that.escape(that.find(name, context));
        }
      };
      var lines = template.split("\n");
      for(var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(regex, tag_replace_callback, this);
        if(!in_recursion) {
          this.send(lines[i]);
        }
      }

      if(in_recursion) {
        return lines.join("\n");
      }
    },

    set_delimiters: function(delimiters) {
      var dels = delimiters.split(" ");
      this.otag = this.escape_regex(dels[0]);
      this.ctag = this.escape_regex(dels[1]);
    },

    escape_regex: function(text) {
      // thank you Simon Willison
      if(!arguments.callee.sRE) {
        var specials = [
          '/', '.', '*', '+', '?', '|',
          '(', ')', '[', ']', '{', '}', '\\'
        ];
        arguments.callee.sRE = new RegExp(
          '(\\' + specials.join('|\\') + ')', 'g'
        );
      }
      return text.replace(arguments.callee.sRE, '\\$1');
    },

    /*
      find `name` in current `context`. That is find me a value
      from the view object
    */
    find: function(name, context) {
      name = this.trim(name);

      // Checks whether a value is thruthy or false or 0
      function is_kinda_truthy(bool) {
        return bool === false || bool === 0 || bool;
      }

      var value;
      if(is_kinda_truthy(context[name])) {
        value = context[name];
      } else if(is_kinda_truthy(this.context[name])) {
        value = this.context[name];
      }

      if(typeof value === "function") {
        return value.apply(context);
      }
      if(value !== undefined) {
        return value;
      }
      // silently ignore unkown variables
      return "";
    },

    // Utility methods

    /* includes tag */
    includes: function(needle, haystack) {
      return haystack.indexOf(this.otag + needle) != -1;
    },

    /*
      Does away with nasty characters
    */
    escape: function(s) {
      s = String(s === null ? "" : s);
      return s.replace(/&(?!\w+;)|["<>\\]/g, function(s) {
        switch(s) {
        case "&": return "&amp;";
        case "\\": return "\\\\";
        case '"': return '\"';
        case "<": return "&lt;";
        case ">": return "&gt;";
        default: return s;
        }
      });
    },

    // by @langalex, support for arrays of strings
    create_context: function(_context) {
      if(this.is_object(_context)) {
        return _context;
      } else {
        var iterator = ".";
        if(this.pragmas["IMPLICIT-ITERATOR"]) {
          iterator = this.pragmas["IMPLICIT-ITERATOR"].iterator;
        }
        var ctx = {};
        ctx[iterator] = _context;
        return ctx;
      }
    },

    is_object: function(a) {
      return a && typeof a == "object";
    },

    is_array: function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    },

    /*
      Gets rid of leading and trailing whitespace
    */
    trim: function(s) {
      return s.replace(/^\s*|\s*$/g, "");
    },

    /*
      Why, why, why? Because IE. Cry, cry cry.
    */
    map: function(array, fn) {
      if (typeof array.map == "function") {
        return array.map(fn);
      } else {
        var r = [];
        var l = array.length;
        for(var i = 0; i < l; i++) {
          r.push(fn(array[i]));
        }
        return r;
      }
    }
  };

  return({
    name: "mustache.js",
    version: "0.3.0",

    /*
      Turns a template and view into HTML
    */
    to_html: function(template, view, partials, send_fun) {
      var renderer = new Renderer();
      if(send_fun) {
        renderer.send = send_fun;
      }
      renderer.render(template, view, partials);
      if(!send_fun) {
        return renderer.buffer.join("\n");
      }
    }
  });
}();

//     Underscore.js 1.2.0
//     (c) 2011 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `_` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = _;
    _._ = _;
  } else {
    // Exported as a string, for Closure Compiler "advanced" mode.
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.2.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = memo !== void 0;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return memo !== void 0 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = (_.isArray(obj) ? obj.slice() : _.toArray(obj)).reverse();
    return _.reduce(reversed, iterator, memo, context);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator = iterator || _.identity;
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result |= iterator.call(context, value, index, list)) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    any(obj, function(value) {
      if (found = value === target) return true;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (method.call ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      if (index == 0) {
        shuffled[0] = value;
      } else {
        rand = Math.floor(Math.random() * (index + 1));
        shuffled[index] = shuffled[rand];
        shuffled[rand] = value;
      }
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion produced by an iterator
  _.groupBy = function(obj, iterator) {
    var result = {};
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(iterable) {
    if (!iterable)                return [];
    if (iterable.toArray)         return iterable.toArray();
    if (_.isArray(iterable))      return slice.call(iterable);
    if (_.isArguments(iterable))  return slice.call(iterable);
    return _.values(iterable);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.toArray(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head`. The **guard** check allows it to work
  // with `_.map`.
  _.first = _.head = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, array.length - n) : array[array.length - 1];
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(_.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var result = [];
    _.reduce(initial, function(memo, el, i) {
      if (0 == i || (isSorted === true ? _.last(memo) != el : !_.include(memo, el))) {
        memo[memo.length] = el;
        result[result.length] = array[i];
      }
      return memo;
    }, []);
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and another.
  // Only the elements present in just the first array will remain.
  _.difference = function(array, other) {
    return _.filter(array, function(value){ return !_.include(other, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function(func, obj) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(obj, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return hasOwnProperty.call(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(func, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Internal function used to implement `_.throttle` and `_.debounce`.
  var limit = function(func, wait, debounce) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var throttler = function() {
        timeout = null;
        func.apply(context, args);
      };
      if (debounce) clearTimeout(timeout);
      if (debounce || !timeout) timeout = setTimeout(throttler, wait);
    };
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    return limit(func, wait, false);
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds.
  _.debounce = function(func, wait) {
    return limit(func, wait, true);
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = slice.call(arguments);
    return function() {
      var args = slice.call(arguments);
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (hasOwnProperty.call(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (source[prop] !== void 0) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if ((a == null) || (b == null)) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (_.isFunction(a.isEqual)) return a.isEqual(b);
    if (_.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare object types.
    var typeA = typeof a;
    if (typeA != typeof b) return false;
    // Optimization; ensure that both values are truthy or falsy.
    if (!a != !b) return false;
    // `NaN` values are equal.
    if (_.isNaN(a)) return _.isNaN(b);
    // Compare string objects by value.
    var isStringA = _.isString(a), isStringB = _.isString(b);
    if (isStringA || isStringB) return isStringA && isStringB && String(a) == String(b);
    // Compare number objects by value.
    var isNumberA = _.isNumber(a), isNumberB = _.isNumber(b);
    if (isNumberA || isNumberB) return isNumberA && isNumberB && +a == +b;
    // Compare boolean objects by value. The value of `true` is 1; the value of `false` is 0.
    var isBooleanA = _.isBoolean(a), isBooleanB = _.isBoolean(b);
    if (isBooleanA || isBooleanB) return isBooleanA && isBooleanB && +a == +b;
    // Compare dates by their millisecond values.
    var isDateA = _.isDate(a), isDateB = _.isDate(b);
    if (isDateA || isDateB) return isDateA && isDateB && a.getTime() == b.getTime();
    // Compare RegExps by their source patterns and flags.
    var isRegExpA = _.isRegExp(a), isRegExpB = _.isRegExp(b);
    if (isRegExpA || isRegExpB) {
      // Ensure commutative equality for RegExps.
      return isRegExpA && isRegExpB &&
             a.source == b.source &&
             a.global == b.global &&
             a.multiline == b.multiline &&
             a.ignoreCase == b.ignoreCase;
    }
    // Ensure that both values are objects.
    if (typeA != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic structures is
    // adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of unique nested
      // structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    if (a.length === +a.length || b.length === +b.length) {
      // Compare object lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare array-like object contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (hasOwnProperty.call(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = hasOwnProperty.call(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (hasOwnProperty.call(b, key) && !size--) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array or object empty?
  _.isEmpty = function(obj) {
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (hasOwnProperty.call(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return !!(obj && hasOwnProperty.call(obj, 'callee'));
  };

  // Is a given value a function?
  _.isFunction = function(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return !!(obj === 0 || (obj && obj.toExponential && obj.toFixed));
  };

  // Is the given value `NaN`? `NaN` happens to be the only value in JavaScript
  // that does not equal itself.
  _.isNaN = function(obj) {
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(str, data) {
    var c  = _.templateSettings;
    var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
      'with(obj||{}){__p.push(\'' +
      str.replace(/\\/g, '\\\\')
         .replace(/'/g, "\\'")
         .replace(c.escape, function(match, code) {
           return "',_.escape(" + code.replace(/\\'/g, "'") + "),'";
         })
         .replace(c.interpolate, function(match, code) {
           return "'," + code.replace(/\\'/g, "'") + ",'";
         })
         .replace(c.evaluate || null, function(match, code) {
           return "');" + code.replace(/\\'/g, "'")
                              .replace(/[\r\n\t]/g, ' ') + "__p.push('";
         })
         .replace(/\r/g, '\\r')
         .replace(/\n/g, '\\n')
         .replace(/\t/g, '\\t')
         + "');}return __p.join('');";
    var func = new Function('obj', tmpl);
    return data ? func(data) : func;
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      method.apply(this._wrapped, arguments);
      return result(this._wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

})();
/*
 * Embedly Preview JQuery v0.0.2
 * =============================
 * This library allows you to easily create a status or url submisstion tool
 * utilizing Embedly's Preview API. For more information see:
 *
 * Embedly: http://embed.ly
 * Embedly Preview API: http://embed.ly/docs/endpoints/1/preview
 *
 * Requirements:
 * -------------
 * jquery-1.6 or higher
 *
 * Usage:
 * ------
 *
 *
 */

(function($){
function log(){
  if ($.preview !== undefined && $.preview.debug && window.console){
    console.log(Array.prototype.slice.call(arguments));
  }
}
/*!
 * linkify - v0.3 - 6/27/2009
 * http://benalman.com/code/test/js-linkify/
 * 
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Licensed under the MIT license
 * http://benalman.com/about/license/
 * 
 * Some regexps adapted from http://userscripts.org/scripts/review/7122
 */

// Turn text into linkified html.
// 
// var html = linkify( text, options );
// 
// options:
// 
//  callback (Function) - default: undefined - if defined, this will be called
//    for each link- or non-link-chunk with two arguments, text and href. If the
//    chunk is non-link, href will be omitted.
// 
//  punct_regexp (RegExp | Boolean) - a RegExp that can be used to trim trailing
//    punctuation from links, instead of the default.
// 
// This is a work in progress, please let me know if (and how) it fails!

window.linkify = (function(){
  var
    SCHEME = "[a-z\\d.-]+://",
    IPV4 = "(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.){3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",
    HOSTNAME = "(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",
    TLD = "(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|ye|yt|yu|za|zm|zw)",
    HOST_OR_IP = "(?:" + HOSTNAME + TLD + "|" + IPV4 + ")",
    PATH = "(?:[;/][^#?<>\\s]*)?",
    QUERY_FRAG = "(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",
    URI1 = "\\b" + SCHEME + "[^<>\\s]+",
    URI2 = "\\b" + HOST_OR_IP + PATH + QUERY_FRAG + "(?!\\w)",
    
    MAILTO = "mailto:",
    EMAIL = "(?:" + MAILTO + ")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@" + HOST_OR_IP + QUERY_FRAG + "(?!\\w)",
    
    URI_RE = new RegExp( "(?:" + URI1 + "|" + URI2 + "|" + EMAIL + ")", "ig" ),
    SCHEME_RE = new RegExp( "^" + SCHEME, "i" ),
    
    quotes = {
      "'": "`",
      '>': '<',
      ')': '(',
      ']': '[',
      '}': '{',
      'Â»': 'Â«',
      'â€º': 'â€¹'
    },
    
    default_options = {
      callback: function( text, href ) {
        return href ? '<a href="' + href + '" title="' + href + '">' + text + '<\/a>' : text;
      },
      punct_regexp: /(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/
    };
  
  return function( txt, options ) {
    options = options || {};
    
    // Temp variables.
    var arr,
      i,
      link,
      href,
      
      // Output HTML.
      html = '',
      
      // Store text / link parts, in order, for re-combination.
      parts = [],
      
      // Used for keeping track of indices in the text.
      idx_prev,
      idx_last,
      idx,
      link_last,
      
      // Used for trimming trailing punctuation and quotes from links.
      matches_begin,
      matches_end,
      quote_begin,
      quote_end;
    
    // Initialize options.
    for ( i in default_options ) {
      if ( options[ i ] === undefined ) {
        options[ i ] = default_options[ i ];
      }
    }
    
    // Find links.
    while ( arr = URI_RE.exec( txt ) ) {
      
      link = arr[0];
      idx_last = URI_RE.lastIndex;
      idx = idx_last - link.length;
      
      // Not a link if preceded by certain characters.
      if ( /[\/:]/.test( txt.charAt( idx - 1 ) ) ) {
        continue;
      }
      
      // Trim trailing punctuation.
      do {
        // If no changes are made, we don't want to loop forever!
        link_last = link;
        
        quote_end = link.substr( -1 )
        quote_begin = quotes[ quote_end ];
        
        // Ending quote character?
        if ( quote_begin ) {
          matches_begin = link.match( new RegExp( '\\' + quote_begin + '(?!$)', 'g' ) );
          matches_end = link.match( new RegExp( '\\' + quote_end, 'g' ) );
          
          // If quotes are unbalanced, remove trailing quote character.
          if ( ( matches_begin ? matches_begin.length : 0 ) < ( matches_end ? matches_end.length : 0 ) ) {
            link = link.substr( 0, link.length - 1 );
            idx_last--;
          }
        }
        
        // Ending non-quote punctuation character?
        if ( options.punct_regexp ) {
          link = link.replace( options.punct_regexp, function(a){
            idx_last -= a.length;
            return '';
          });
        }
      } while ( link.length && link !== link_last );
      
      href = link;
      
      // Add appropriate protocol to naked links.
      if ( !SCHEME_RE.test( href ) ) {
        href = ( href.indexOf( '@' ) !== -1 ? ( !href.indexOf( MAILTO ) ? '' : MAILTO )
          : !href.indexOf( 'irc.' ) ? 'irc://'
          : !href.indexOf( 'ftp.' ) ? 'ftp://'
          : 'http://' )
          + href;
      }
      
      // Push preceding non-link text onto the array.
      if ( idx_prev != idx ) {
        parts.push([ txt.slice( idx_prev, idx ) ]);
        idx_prev = idx_last;
      }
      
      // Push massaged link onto the array
      parts.push([ link, href ]);
    };
    
    // Push remaining non-link text onto the array.
    parts.push([ txt.substr( idx_prev ) ]);
    
    // Process the array items.
    for ( i = 0; i < parts.length; i++ ) {
      html += options.callback.apply( window, parts[i] );
    }
    
    // In case of catastrophic failure, return the original text;
    return html || txt;
  };
  
})();
function Selector(form, selector) {

  //Base Selector
  var Selector = {
    selector : '.selector',
    type : 'small',
    template : null,
    elem : null,
    partials : {
      'images_small' : [
        '<div class="thumbnail">',
          '<div class="controls">',
            '<a class="left" href="#">&#9664;</a>',
            '<a class="right" href="#">&#9654;</a>',
            '<a class="nothumb" href="#">&#10005;</a>',
          '</div>',
          '<div class="items">',
            '<ul class="images">',
              '{{#images}}',
              '<li><img src="{{url}}"/></li>',
              '{{/images}}',
            '</ul>',
          '</div>',
        '</div>'].join(''),
      'images_large' : ['<div class="thumbnail">',
          '<a class="left" href="#">&#9664;</a>',
          '<div class="items">',
            '<ul class="images">',
              '{{#images}}',
              '<li><img src="{{url}}"/></li>',
              '{{/images}}',
            '</ul>',
          '</div>',
          '<a class="right" href="#">&#9654;</a>',
          '<a class="nothumb" href="#">&#10005;</a>',
        '</div>'].join(''),
      'attributes' : [
          '<a class="title" href="#">{{title}}</a>',
          '<p><a class="description" href="#">{{description}}</a></p>'].join(''),
      'title' : '<a class="title" href="#">{{title}}</a>',
      'description' : '<p><a class="description" href="#">{{description}}</a></p>',
      'favicon' : '<img class="favicon" src="{{favicon_url}}">'
    },
    templates : {
      'small': [
        '<div class="selector small">',
          '{{>images_small}}',
          '<div class="attributes">',
            '{{>attributes}}',
            '<span class="meta">',
              '{{>favicon}}',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
          '<div class="action"><a href="#" class="close">&#10005;</a></div>',
        '</div>'].join(''),
      'large' : [
        '<div class="selector large">',
          '{{>title}}',
          '{{>images_large}}',
          '<div class="attributes">',
            '{{>description}}',
            '<span class="meta">',
              '{{>favicon}}',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
        '</div>'].join(''),
      'rich': {
        'video' : [
          '<div class="selector rich">',
              '{{>title}}',
              '{{>object}}',
            '<div class="attributes">',
              '{{>description}}',
              '<span class="meta">',
                '{{>favicon}}',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
          '</div>'].join(''),
        'rich' : [
          '<div class="selector rich">',
              '{{>title}}',
              '{{>object}}',
            '<div class="attributes">',
              '{{>description}}',
              '<span class="meta">',
                '{{>favicon}}',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
          '</div>'].join(''),
        'photo' : [
          '<div class="selector rich">',
              '{{>title}}',
              '{{>object}}',
            '<div class="attributes">',
              '{{>description}}',
              '<span class="meta">',
                '{{>favicon}}',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
          '</div>'].join(''),
        'link' : [
          '<div class="selector rich">',
              '{{>images_small}}',
            '<div class="attributes">',
              '{{>attributes}}',
              '<span class="meta">',
                '{{>favicon}}',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
          '</div>'].join('')
      }
    },

    // If a developer wants complete control of the selector, they can
    // override the render function.
    render : function (obj) {
      // If the #selector ID is there then replace it with the template. Just
      // tells us where it should be on the page.
      var template = null;

      if (this.template !== null) {
        template = this.template;
      } else {
        template = this.templates[this.type];
      }

      // A template can be a dict of all the use cases.
      if (_.isObject(template)) {
        template = template[obj.object_type];
      }

      var view = this.toView(obj);
      var partials = this.toPartials(obj);

      var html = Mustache.to_html(template, view, partials);

      // If the developer told us where to put the selector, put it there.
      if (form.find(this.selector).length) {
        this.elem = form.find(this.selector).replaceWith(html);
      } else {
        this.elem = form.append(html);
      }

      // We need to keep track of the selector elem so we don't have to do
      // form.find(this.selector) all the time.
      this.elem = form.find(this.selector);

      // Selector may be hidden. Let's show it.
      this.elem.show();

      // If there are images, set the information in the form.
      if (obj.images.length > 0) {
        form.find('#id_thumbnail_url').val(obj.images[0].url);
      } else {
        this.elem.find('.thumbnail').hide();
      }

      // If there is only one image, hide the left and right buttons.
      if (obj.images.length === 1) {
        this.elem.find('.left, .right').hide();
      }

      this.bind();
    },
    // To View. Only exists to be overwritten basiclly.
    toView : function (obj) {
      return obj;
    },
    toPartials : function (obj) {
      // Clone partials for later.
      var p = $.extend(true, {}, this.partials);

      // Set up the object if it's there.
      p.object = '';
      if (obj.object && (obj.object.type === 'video' || obj.object.type === 'rich')) {
        p.object = '<div class="media">{{{html}}}</div>';

      } else if (obj.object && obj.object.type === 'photo') {
        p.object = '<div class="media"><img src="{{url}}"/></div>';
      }

      // If there is no favicon, ignore it.
      if (!obj.favion_url) {
        p.favicon = '';
      }

      return p;
    },
    //Clears the selector post submit.
    clear : function (e) {
      if (e !== undefined) {
        e.preventDefault();
      }
      this.elem.html('');
      this.elem.hide();
      form.find('input[type="hidden"].preview_input').remove();
    },
    scroll : function (dir, e) {
      e.preventDefault();

      var images = this.elem.find('.images');

      //Grabs the current 'left' style
      var width = parseInt(images.find('li').css('width'), 10);

      // Left
      var left = parseInt(images.css('left'), 10);
      //Gets the number of images
      var len = images.find('img').length * width;

      //General logic to set the new left value
      if (dir === 'left') {
        left = parseInt(left, 10) + width;
        if (left > 0) {
          return false;
        }
      } else if (dir === 'right') {
        left = parseInt(left, 10) - width;
        if (left <= -len) {
          return false;
        }
      } else {
        log('not a valid direction: ' + dir);
        return false;
      }

      var thumb = images.find('img').eq((left / -width)).attr('src');

      //  Puts the current thumbnail into the thumbnail_url input
      form.find('#id_thumbnail_url').val(thumb);

      // Sets the new left.
      images.css('left', left + 'px');
    },
    nothumb : function (e) {
      e.preventDefault();
      this.elem.find('.thumbnail').hide();
      form.find('#id_thumbnail_url').val('');
    },
    // When a user wants to Edit a title or description we need to switch out
    // an input or text area
    title : function (e) {
      e.preventDefault();
      //overwrite the a tag with the value of the tag.
      var elem = $('<input/>').attr({
        'value' : $(e.target).text(),
        'class' : 'title',
        'type' : 'text'
      });

      $(e.target).replaceWith(elem);

      //Set the focus on this element
      elem.focus();

      // Sets up for another bind.
      var t = this.title;

      // puts the a tag back on blur. It's a single bind so it will be
      // trashed on blur.
      elem.one('blur', function (e) {
        var elem = $(e.target);
        // Sets the New Title in the hidden inputs
        form.find('#id_title').val(elem.val());

        var a = $('<a/>').attr({
            'class': 'title',
            'href' : '#'
          }).text(elem.val());

        $(e.target).replaceWith(a);

        // Bind it back again.
        a.bind('click', t);
      });
    },
    //Same as before, but for description
    description : function (e) {
      e.preventDefault();
      //overwrite the a tag with the value of the tag.
      var elem = $('<textarea/>').attr({
        'class' : 'description'
      }).text($(e.target).text());

      $(e.target).replaceWith(elem);

      //Set the focus on this element
      elem.focus();

      // Sets up for another bind.
      var d = this.description;

      // puts the a tag back on blur. It's a single bind so it will be
      // trashed on blur.
      elem.one('blur', function (e) {
        var elem = $(e.target);
        // Sets the New Title in the hidden inputs
        form.find('#id_description').val(elem.val());

        var a = $('<a/>').attr({
            'class': 'description',
            'href': '#'
          }).text(elem.val());

        $(e.target).replaceWith(a);

        // Bind it back again.
        a.bind('click', d);

      });
    },
    update : function (e) {
      this.elem.find('.' + $(e.target).attr('name')).text($(e.target).val());
    },
    // Binds the correct events for the controls.
    bind : function () {
      // Thumbnail Controls
      this.elem.find('.left').bind('click', _.bind(this.scroll, {}, 'left'));
      this.elem.find('.right').bind('click', _.bind(this.scroll, {}, 'right'));
      this.elem.find('.nothumb').bind('click', this.nothumb);

      // Binds the close button.
      this.elem.find('.action .close').bind('click', this.clear);
      this.elem.bind('mouseenter mouseleave', function () {
        $(this).find('.action').toggle();
      });

      //Show hide the controls.
      this.elem.find('.thumbnail').one('mouseenter', function () {
        $(this).bind('mouseenter mouseleave', function () {
          $(this).find('.controls').toggle();
        });
      });

      //Edit Title and Description handlers.
      this.elem.find('.title').bind('click', this.title);
      this.elem.find('.description').bind('click', this.description);
    }
  };

  // Overwrites any funtions
  _.extend(Selector, selector);
  _.bindAll(Selector);

  return Selector;
}
/* Display Allows Developers to Easily build a status or link share from the
 * Obj that was created.
 *
 *
 */

function Display(display){

  var Display = {
    selector : '#feed',
    type : 'small',
    template : null,

    partials : {
      'thumbnail' : ['<div class="thumbnail {{object_type}}">',
        '<a href="{{original_url}}" target="_blank">',
          '<img title="{{title}}" src="{{thumbnail_url}}"/>',
          '<span class="overlay"></span>',
        '</a>',
      '</div>'].join('')
    },
    templates : {
      'small' : [
        '<div class="item">',
          '{{>thumbnail}}',
          '<div class="attributes">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '<p class="description">{{description}}</p>',
            '<span class="meta">',
              '<img class="favicon" src="{{favicon_url}}"/>',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
          '<div class="clearfix"></div>',
        '</div>'].join(''),
      'status' :[
        '<div class="item">',
          '<div class="status">{{{status_linked}}}</div>',
          '{{>thumbnail}}',
          '<div class="attributes">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '<p class="description">{{description}}</p>',
            '<span class="meta">',
              '<img class="favicon" src="{{favicon_url}}"/>',
              '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
            '</span>',
          '</div>',
          '<div class="clearfix"></div>',
        '</div>'].join(''),
      'rich' :  {
          'video' :['<div class="item video">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '{{>object}}',
            '<div class="attributes">',
              '<p class="description">{{description}}</p>',
              '<span class="meta">',
                '<img class="favicon" src="{{favicon_url}}"/>',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
            '<div class="clearfix"></div>',
          '</div>'].join(''),
          'rich' : ['<div class="item rich">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '{{>object}}',
            '<div class="attributes">',
              '<p class="description">{{description}}</p>',
              '<span class="meta">',
                '<img class="favicon" src="{{favicon_url}}"/>',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
            '<div class="clearfix"></div>',
          '</div>'].join(''),
          'photo' : ['<div class="item photo">',
            '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
            '{{>object}}',
            '<div class="attributes">',
              '<p class="description">{{description}}</p>',
              '<span class="meta">',
                '<img class="favicon" src="{{favicon_url}}"/>',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
            '<div class="clearfix"></div>',
          '</div>'].join(''),
          'link': ['<div class="item link">',
            '{{>thumbnail}}',
            '<div class="attributes">',
              '<a class="title" href="{{original_url}}" target="_blank">{{title}}</a>',
              '<p class="description">{{description}}</p>',
              '<span class="meta">',
                '<img class="favicon" src="{{favicon_url}}"/>',
                '<a class="provider" href="{{provider_url}}">{{provider_display}}</a>',
              '</span>',
            '</div>',
            '<div class="clearfix"></div>',
          '</div>'].join('')
      }
    },
    // Will do something with this later.
    toView : function(obj){
      if (obj.hasOwnProperty('status')){
        obj.status_linked = linkify(obj.status);
      }
      return obj;
    },
    // Will do something with this later.
    toPartials : function(obj){
      var p = $.extend(true, {}, this.partials);

      if (!obj.thumbnail_url){
        p.thumbnail = '';
      }

      // Set up the object if it's there.
      p.object = '';
      if (obj.object_type === 'video' || obj.object_type === 'rich'){
        p.object = '<div class="media video">{{{html}}}</div>';
      } else if (obj.object_type === 'photo' || obj.type === 'image'){
        p.object = '<div class="media image"><img alt="{{title}}" src="{{image_url}}"/></div>';
      }

      if (this.type === 'rich' && obj.object_type !== 'link'){
        p.thumbnail = '';
      }

      return p;
    },
    //Creates a feed object based on the obj we pass back.
    create : function(obj){
      var template = null;

      // If the developer gives us a template use it.
      if (this.template !== null){
        template = this.template;
      } else{
        template = this.templates[this.type];
      }

      // A template can be a dict of all the use cases.
      if (_.isObject(template)){
        template = template[obj.object_type];
      }

      // Allows us to overwrite the view and partials.
      var view = this.toView(obj);
      var partials = this.toPartials(obj);

      var html = Mustache.to_html(template, view, partials);

      var e = $(this.selector).prepend(html).children().first();

      e.data('preview', obj);
    },
    play : function(e){

    },
    bind : function(){
      $('.thumbnail.video a, .thumbnail.rich a').on('click', function(e){
        e.preventDefault();
        var preview = $(this).parents('.item').data('preview');
        $(this).parents('.item').replaceWith(preview.html);
      });
    }
  };

  _.extend(Display, display);

  _.bindAll(Display);

  Display.bind();

  return Display;
}
/* jQuery Preview - v0.2
 *
 * jQuery Preview is a plugin by Embedly that allows developers to create tools
 * that enable users to share links with rich previews attached.
 *
 */

// Base Preview Object. Holds a common set of functions to interact with
// Embedly's Preview endpoint.
function Preview(elem, options) {

  //Preview Object that We build from the options passed into the function
  var Preview = {

    // List of all the attrs that can be sent to Embedly
    api_args : ['key', 'maxwidth', 'maxheight', 'width', 'wmode', 'autoplay',
      'videosrc', 'allowscripts', 'words', 'chars', 'secure', 'frame'],

    // What attrs we are going to use.
    display_attrs : ['type', 'original_url', 'url', 'title', 'description',
      'favicon_url', 'provider_url', 'provider_display', 'provider_name', 'safe', 'html',
      'thumbnail_url', 'object_type', 'image_url'],

    default_data : {},
    debug : false,
    form : null,
    type : 'link',
    loading_selector : '.loading',
    options : {
      debug : false,
      selector : {},
      field : null,
      display : {},
      preview : {},
      wmode : 'opaque',
      words : 30,
      maxwidth : 560
    },

    init : function (elem, settings) {

      // Sets up options
      this.options = _.extend(this.options, typeof settings !== "undefined" ? settings : {});

      // Sets up the data args we are going to send to the API
      var data = {};
      _.each(_.intersection(_.keys(this.options), this.api_args), function (n) {
        var v = settings[n];
        // 0 or False is ok, but not null or undefined
        if (!(_.isNull(v) || _.isUndefined(v))) {
          data[n] = v;
        }
      });
      this.default_data = data;

      // Just reminds us which form we should be working on.
      this.form = null;
      if (elem){
        this.form = options.form ? options.form : elem.parents('form');
      }

      //Debug used for logging
      this.debug = this.options.debug;

      //Sets up Selector
      this.selector = Selector(this.form, this.options.selector);

      // Sets up display
      this.display = Display(this.options.display);

      // Overwrites any funtions
      _.extend(this, this.options.preview);

      // Binds all the functions that you want.
      if (elem){
        this.bind();
      }
    },
    /*
     * Utils for handling the status.
     */
    getStatusUrl : function (obj) {
      // Grabs the status out of the Form.
      var status = elem.val();

      //ignore the status it's blank.
      if (status === '') {
        return null;
      }

      // Simple regex to make sure the url with a scheme is valid.
      var urlexp = /^http(s?):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;
      var matches = status.match(urlexp);

      var url = matches? matches[0] : null;

      //No urls is the status. Try for urls without scheme i.e. example.com
      if (url === null) {
        urlexp = /[-\w]+(\.[a-z]{2,})+(\S+)?(\/|\/[\w#!:.?+=&%@!\-\/])?/gi;
        matches = status.match(urlexp);
        url = matches? 'http://'+matches[0] : null;
      }

      //Note that in both cases we only grab the first URL.
      return url;
    },
    toggleLoading : function () {
      this.form.find(this.loading_selector).toggle();
    },
    callback : function(obj) {
      // empty. can be overridden by user
    },
    //Metadata Callback
    _callback : function (obj) {
      //tells the loader to stop
      this.toggleLoading();

      // Here is where you actually care about the obj
      log(obj);

      // Every obj should have a 'type'. This is a clear sign that
      // something is off. This is a basic check to make sure we should
      // proceed. Generally will never happen.
      if (!obj.hasOwnProperty('type')) {
        log('Embedly returned an invalid response');
        this.error(obj);
        return false;
      }

      // Error. If the url was invalid, or 404'ed or something else. The
      // endpoint will pass back an obj  of type 'error'. Generally this is
      // were the default workflow should happen.
      if (obj.type === 'error') {
        log('URL ('+obj.url+') returned an error: '+ obj.error_message);
        this.error(obj);
        return false;
      }

      if (!obj.safe) {
        log('URL ('+obj.url+') was deemed unsafe: ' + obj.safe_message);
        this.error(obj);
        return false;
      }

      // Generally you only want to handle preview objs that are of type
      // `html` or `image`. Others could include `ppt`,`video` or `audio`
      // which I don't believe you have a good solution for yet. We could
      // wrap them in HTML5 tags, but won't work cross browser.
      if (!(obj.type in {'html':'', 'image':''})) {
        log('URL ('+obj.url+') returned a type ('+obj.type+') not handled');
        this.error(obj);
        return false;
      }

      // If this is a change in the URL we need to delete all the old
      // information first.
      this.form.find('input[type="hidden"].preview_input').remove();


      //Sets all the data to a hidden inputs for the post.
      var form = this.form;
      _.each(this.display_attrs, function (n) {

        var v = null;

        // Object type let's us know what we are working with.
        if (n === 'object_type') {
          if (obj.hasOwnProperty('object') && obj.object.hasOwnProperty('type')) {
            v = obj.object.type;
          } else{
            v = 'link';
          }
          obj.object_type = v;
        }
        // Sets up HTML for the video or rich type.
        else if (n === 'html') {
          if (obj.hasOwnProperty('object') && obj.object.hasOwnProperty('html')) {
            v = obj.object.html;
          }
        }
        // Set up the image URL for previews of the ful image.
        else if (n === 'image_url') {
          if (obj.hasOwnProperty('object') && obj.object.hasOwnProperty('type') && obj.object.type === 'photo') {
            v = obj.object.url;
          } else if (obj.type === 'image') {
            v = obj.url;
          }
          obj.image_url = v;
        }
        else {
          v = obj[n];
        }

        var d = {
          name : n,
          type : 'hidden',
          id : 'id_'+n,
          value : v
        };

        // It's possible that the title or description or something else is
        // already in the form. If it is then we need to Love them for who they
        // are and fill in values.
        var e = form.find('#id_'+n);

        if(e.length) {
          // It's hidden, use it
          if (e.attr('type') === 'hidden') {
            // jQuery doesn't allow changing the 'type' attribute
            delete d.type;
            
            e.attr(d);
          } else{
            // Be careful here.
            if (!e.val()) {
              e.val(obj[n]);
            } else {
              // Use the value in the obj
              obj[n] = e.val();
            }
            // Bind updates to the select.
            e.bind('keyup', function (e) {
              $.preview.selector.update(e);
            });
          }
          e.addClass('preview_input');
        } else{
          d['class'] ='preview_input';
          form.append($('<input />').attr(d));
        }
      });

      // Now use the selector obj to render the selector.
      this.selector.render(obj);
      this.callback(obj);
    },
    // Used as a generic error callback if something fails.
    error : function () {
      log('error');
      log(arguments);
    },
    // Actually makes the ajax call to Embedly. We make this a seperate
    // function because implementations like Chrome Plugins need to overwrite
    // how the call is made.
    ajax : function(data){
      // Make the request to Embedly. Note we are using the
      // preview endpoint: http://embed.ly/docs/endpoints/1/preview
      $.ajax({
        url: document.location.protocol + '//api.embed.ly/1/preview',
        dataType: 'jsonp',
        data: data,
        success: this._callback,
        error: this.error
      });
    },
    // Fetches the Metadata from the Embedly API
    fetch: function (url) {
      // Get a url out of the status box unless it was passed in.
      if (typeof url === 'undefined' || typeof url !== 'string') {
        url = this.getStatusUrl();
      }

      // If there is no url return false.
      if (url === null) return true;

      //We need to trim the URL.
      url = $.trim(url);

      // If we already looked for a url, there will be an original_url hidden
      // input that we should look for and compare values. If they are the
      // same we will ignore.
      var original_url = this.form.find('#id_original_url').val();
      if (original_url === url) {
        return true;
      }

      //Tells the loaded to start
      this.toggleLoading();

      //sets up the data we are going to use in the request.
      var data = _.clone(this.default_data);
      data.url = url;

      // make the ajax call
      this.ajax(data);

      return true;
    },
    keyUp : function (e) {
      // Only respond to keys that insert whitespace (spacebar, enter)
      if (e.which !== 32 && e.which !== 13) {
        return null;
      }

      //See if there is a url in the status textarea
      var url = this.getStatusUrl();
      if (url === null) {
        return null;
      }
      log('onKeyUp url:'+url);

      // If there is a url, then we need to unbind the event so it doesn't fire
      // again. This is very common for all status updaters as otherwise it
      // would create a ton of unwanted requests.
      $(this.status_selector).unbind('keyup');

      //Fire the fetch metadata function
      this.fetch(url);
    },
    paste : function (e) {
      //We delay the fire on paste.
      _.delay(this.fetch, 200);
    },
    //The submit post back that readys the data for the actual submit.
    _submit : function (e) {
      var data = {};

      this.form.find('textarea, input').not('input[type="submit"]').each(
        function (i, e) {
          var n = $(e).attr('name');
          if (n !== undefined) {
            data[n] = $(e).val();
          }
      });
      // Clears the Selector.
      this.selector.clear();

      // Submits the Event and the Data to the submit function.
      this.submit(e, data);

      //Clear the form.
      elem.val('');

      // This happens in clear, but it may not get get called there. This
      // Makes sure it's cleared.
      this.form.find('input[type="hidden"].preview_input').remove();
    },
    //What we are actually going to do with the data.
    submit : function (e, data) {
      e.preventDefault();
      // We need to submit the data back to the server via the action
      var form = $(e.target);
      $.ajax({
        type : 'post',
        url : form.attr('action'),
        data : $.param(data),
        dataType:'json',
        success : this.display.create
      });
    },
    //Bind a bunch of functions.
    bind : function () {
      log('Starting Bind');

      // Bind Keyup, Blur and Paste
      elem.bind('blur', this.fetch);
      elem.bind('keyup', this.keyUp);
      elem.bind('paste', this.paste);

      //Bind Submit
      this.form.bind('submit', this._submit);

      // the event `attach` tells fetch to run on the input.
      elem.bind('attach', this.fetch);

    }
  };

  //Use Underscore to make ``this`` not suck.
  _.bindAll(Preview);

  //Bind Preview Function
  Preview.init(elem, options);

  //Return the Preview Function that will eventually be namespaced to $.preview.
  return Preview;
}


  // Sets up an initial $.preview for use before the form is initialized.
  // Useful for early access to display if needed.
  $.preview = new Preview(null, {});

  //Set up the Preview Functions for jQuery
  $.fn.preview = function(options, callback){
    $(this).each(function(i,e){
      $.preview = new Preview($(this), options);
    });

    return this;
  }
})(jQuery);
