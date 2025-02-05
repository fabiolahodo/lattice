var noop = {value: () => {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get$1(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$1(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
}

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}

function none() {}

function selector(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

function selection_select(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

function empty() {
  return [];
}

function selectorAll(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}

function selection_selectAll(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$1(subgroups, parents);
}

function matcher(selector) {
  return function() {
    return this.matches(selector);
  };
}

function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}

var find$1 = Array.prototype.find;

function childFind(match) {
  return function() {
    return find$1.call(this.children, match);
  };
}

function childFirst() {
  return this.firstElementChild;
}

function selection_selectChild(match) {
  return this.select(match == null ? childFirst
      : childFind(typeof match === "function" ? match : childMatcher(match)));
}

var filter = Array.prototype.filter;

function children() {
  return Array.from(this.children);
}

function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}

function selection_selectChildren(match) {
  return this.selectAll(match == null ? children
      : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}

function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

function sparse(update) {
  return new Array(update.length);
}

function selection_enter() {
  return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant$4(x) {
  return function() {
    return x;
  };
}

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = new Map,
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
      exit[i] = node;
    }
  }
}

function datum(node) {
  return node.__data__;
}

function selection_data(value, key) {
  if (!arguments.length) return Array.from(this, datum);

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$4(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection$1(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data); // Map, Set, iterable, string, or anything else
}

function selection_exit() {
  return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
}

function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

function selection_merge(context) {
  var selection = context.selection ? context.selection() : context;

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$1(merges, this._parents);
}

function selection_order() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort(compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$1(sortgroups, this._parents).order();
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes() {
  return Array.from(this);
}

function selection_node() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size() {
  let size = 0;
  for (const node of this) ++size; // eslint-disable-line no-unused-vars
  return size;
}

function selection_empty() {
  return !this.node();
}

function selection_each(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$1(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$1(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS$1(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
}

function defaultView(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove$1(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$1(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove$1 : typeof value === "function"
            ? styleFunction$1
            : styleConstant$1)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
}

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

function selection_classed(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}

function textRemove() {
  this.textContent = "";
}

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction$1
          : textConstant$1)(value))
      : this.node().textContent;
}

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise() {
  return this.each(raise);
}

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower() {
  return this.each(lower);
}

function selection_append(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull() {
  return null;
}

function selection_insert(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove() {
  return this.each(remove);
}

function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

function selection_datum(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}

function* selection_iterator() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}

var root = [null];

function Selection$1(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection$1([[document.documentElement]], root);
}

function selection_selection() {
  return this;
}

Selection$1.prototype = selection.prototype = {
  constructor: Selection$1,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator
};

function select(selector) {
  return typeof selector === "string"
      ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
      : new Selection$1([[selector]], root);
}

function sourceEvent(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent) event = sourceEvent;
  return event;
}

function pointer(event, node) {
  event = sourceEvent(event);
  if (node === undefined) node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}

// These are typically used in conjunction with noevent to ensure that we can
// preventDefault on the event.
const nonpassive = {passive: false};
const nonpassivecapture = {capture: true, passive: false};

function nopropagation$1(event) {
  event.stopImmediatePropagation();
}

function noevent$1(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

function dragDisable(view) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", noevent$1, nonpassivecapture);
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", noevent$1, nonpassivecapture);
  } else {
    root.__noselect = root.style.MozUserSelect;
    root.style.MozUserSelect = "none";
  }
}

function yesdrag(view, noclick) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", null);
  if (noclick) {
    selection.on("click.drag", noevent$1, nonpassivecapture);
    setTimeout(function() { selection.on("click.drag", null); }, 0);
  }
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", null);
  } else {
    root.style.MozUserSelect = root.__noselect;
    delete root.__noselect;
  }
}

var constant$3 = x => () => x;

function DragEvent(type, {
  sourceEvent,
  subject,
  target,
  identifier,
  active,
  x, y, dx, dy,
  dispatch
}) {
  Object.defineProperties(this, {
    type: {value: type, enumerable: true, configurable: true},
    sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
    subject: {value: subject, enumerable: true, configurable: true},
    target: {value: target, enumerable: true, configurable: true},
    identifier: {value: identifier, enumerable: true, configurable: true},
    active: {value: active, enumerable: true, configurable: true},
    x: {value: x, enumerable: true, configurable: true},
    y: {value: y, enumerable: true, configurable: true},
    dx: {value: dx, enumerable: true, configurable: true},
    dy: {value: dy, enumerable: true, configurable: true},
    _: {value: dispatch}
  });
}

DragEvent.prototype.on = function() {
  var value = this._.on.apply(this._, arguments);
  return value === this._ ? this : value;
};

// Ignore right-click, since that should open the context menu.
function defaultFilter$1(event) {
  return !event.ctrlKey && !event.button;
}

function defaultContainer() {
  return this.parentNode;
}

function defaultSubject(event, d) {
  return d == null ? {x: event.x, y: event.y} : d;
}

function defaultTouchable$1() {
  return navigator.maxTouchPoints || ("ontouchstart" in this);
}

function drag() {
  var filter = defaultFilter$1,
      container = defaultContainer,
      subject = defaultSubject,
      touchable = defaultTouchable$1,
      gestures = {},
      listeners = dispatch("start", "drag", "end"),
      active = 0,
      mousedownx,
      mousedowny,
      mousemoving,
      touchending,
      clickDistance2 = 0;

  function drag(selection) {
    selection
        .on("mousedown.drag", mousedowned)
      .filter(touchable)
        .on("touchstart.drag", touchstarted)
        .on("touchmove.drag", touchmoved, nonpassive)
        .on("touchend.drag touchcancel.drag", touchended)
        .style("touch-action", "none")
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }

  function mousedowned(event, d) {
    if (touchending || !filter.call(this, event, d)) return;
    var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
    if (!gesture) return;
    select(event.view)
      .on("mousemove.drag", mousemoved, nonpassivecapture)
      .on("mouseup.drag", mouseupped, nonpassivecapture);
    dragDisable(event.view);
    nopropagation$1(event);
    mousemoving = false;
    mousedownx = event.clientX;
    mousedowny = event.clientY;
    gesture("start", event);
  }

  function mousemoved(event) {
    noevent$1(event);
    if (!mousemoving) {
      var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
      mousemoving = dx * dx + dy * dy > clickDistance2;
    }
    gestures.mouse("drag", event);
  }

  function mouseupped(event) {
    select(event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(event.view, mousemoving);
    noevent$1(event);
    gestures.mouse("end", event);
  }

  function touchstarted(event, d) {
    if (!filter.call(this, event, d)) return;
    var touches = event.changedTouches,
        c = container.call(this, event, d),
        n = touches.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i])) {
        nopropagation$1(event);
        gesture("start", event, touches[i]);
      }
    }
  }

  function touchmoved(event) {
    var touches = event.changedTouches,
        n = touches.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        noevent$1(event);
        gesture("drag", event, touches[i]);
      }
    }
  }

  function touchended(event) {
    var touches = event.changedTouches,
        n = touches.length, i, gesture;

    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        nopropagation$1(event);
        gesture("end", event, touches[i]);
      }
    }
  }

  function beforestart(that, container, event, d, identifier, touch) {
    var dispatch = listeners.copy(),
        p = pointer(touch || event, container), dx, dy,
        s;

    if ((s = subject.call(that, new DragEvent("beforestart", {
        sourceEvent: event,
        target: drag,
        identifier,
        active,
        x: p[0],
        y: p[1],
        dx: 0,
        dy: 0,
        dispatch
      }), d)) == null) return;

    dx = s.x - p[0] || 0;
    dy = s.y - p[1] || 0;

    return function gesture(type, event, touch) {
      var p0 = p, n;
      switch (type) {
        case "start": gestures[identifier] = gesture, n = active++; break;
        case "end": delete gestures[identifier], --active; // falls through
        case "drag": p = pointer(touch || event, container), n = active; break;
      }
      dispatch.call(
        type,
        that,
        new DragEvent(type, {
          sourceEvent: event,
          subject: s,
          target: drag,
          identifier,
          active: n,
          x: p[0] + dx,
          y: p[1] + dy,
          dx: p[0] - p0[0],
          dy: p[1] - p0[1],
          dispatch
        }),
        d
      );
    };
  }

  drag.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant$3(!!_), drag) : filter;
  };

  drag.container = function(_) {
    return arguments.length ? (container = typeof _ === "function" ? _ : constant$3(_), drag) : container;
  };

  drag.subject = function(_) {
    return arguments.length ? (subject = typeof _ === "function" ? _ : constant$3(_), drag) : subject;
  };

  drag.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$3(!!_), drag) : touchable;
  };

  drag.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? drag : value;
  };

  drag.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
  };

  return drag;
}

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});

function color_formatHex() {
  return this.rgb().formatHex();
}

function color_formatHex8() {
  return this.rgb().formatHex8();
}

function color_formatHsl() {
  return hslConvert(this).formatHsl();
}

function color_formatRgb() {
  return this.rgb().formatRgb();
}

function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));

function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}

function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}

function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}

function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}

function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}

function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));

function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}

function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var constant$2 = x => () => x;

function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant$2(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb$1(start, end) {
    var r = color((start = rgb(start)).r, (end = rgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$1.gamma = rgbGamma;

  return rgb$1;
})(1);

function interpolateNumber(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

var degrees = 180 / Math.PI;

var identity$1 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

function decompose(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
}

var svgNode;

/* eslint-disable no-undef */
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity$1 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
}

function parseSvg(value) {
  if (value == null) return identity$1;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

var epsilon2 = 1e-12;

function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

var interpolateZoom = (function zoomRho(rho, rho2, rho4) {

  // p0 = [ux0, uy0, w0]
  // p1 = [ux1, uy1, w1]
  function zoom(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
        ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
        dx = ux1 - ux0,
        dy = uy1 - uy0,
        d2 = dx * dx + dy * dy,
        i,
        S;

    // Special case for u0 ≅ u1.
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function(t) {
        return [
          ux0 + t * dx,
          uy0 + t * dy,
          w0 * Math.exp(rho * t * S)
        ];
      };
    }

    // General case.
    else {
      var d1 = Math.sqrt(d2),
          b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
          b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
          r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
          r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function(t) {
        var s = t * S,
            coshr0 = cosh(r0),
            u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [
          ux0 + u * dx,
          uy0 + u * dy,
          w0 * coshr0 / cosh(rho * s + r0)
        ];
      };
    }

    i.duration = S * 1000 * rho / Math.SQRT2;

    return i;
  }

  zoom.rho = function(_) {
    var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
    return zoomRho(_1, _2, _4);
  };

  return zoom;
})(Math.SQRT2, 2, 4);

var frame = 0, // is an animation frame pending?
    timeout$1 = 0, // is a timeout pending?
    interval = 0, // are any timers active?
    pokeDelay = 1000, // how frequently we check for clock skew
    taskHead,
    taskTail,
    clockLast = 0,
    clockNow = 0,
    clockSkew = 0,
    clock = typeof performance === "object" && performance.now ? performance : Date,
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout$1 = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout$1) timeout$1 = clearTimeout(timeout$1);
  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
  if (delay > 24) {
    if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function timeout(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(elapsed => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}

var emptyOn = dispatch("start", "end", "cancel", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

function schedule(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}

function init(node, id) {
  var schedule = get(node, id);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}

function set(node, id) {
  var schedule = get(node, id);
  if (schedule.state > STARTED) throw new Error("too late; already running");
  return schedule;
}

function get(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout(start);

      // Interrupt the active transition, if any.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions.
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(node, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

function interrupt(node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
}

function selection_interrupt(name) {
  return this.each(function() {
    interrupt(this, name);
  });
}

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

function transition_tween(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule = set(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get(node, id).value[name];
  };
}

function interpolate(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color ? interpolateRgb
      : (c = color(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
}

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrConstantNS(fullname, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function attrFunctionNS(fullname, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function transition_attr(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
      : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
}

function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}

function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}

function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_attrTween(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

function transition_delay(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get(this.node(), id).delay;
}

function durationFunction(id, value) {
  return function() {
    set(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set(this, id).duration = value;
  };
}

function transition_duration(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get(this.node(), id).duration;
}

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set(this, id).ease = value;
  };
}

function transition_ease(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get(this.node(), id).ease;
}

function easeVarying(id, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function") throw new Error;
    set(this, id).ease = v;
  };
}

function transition_easeVarying(value) {
  if (typeof value !== "function") throw new Error;
  return this.each(easeVarying(this._id, value));
}

function transition_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
}

function transition_merge(transition) {
  if (transition._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
}

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set;
  return function() {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

function transition_on(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
}

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

function transition_remove() {
  return this.on("end.remove", removeFunction(this._id));
}

function transition_select(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
}

function transition_selectAll(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
}

var Selection = selection.prototype.constructor;

function transition_selection() {
  return new Selection(this._groups, this._parents);
}

function styleNull(name, interpolate) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function styleFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        value1 = value(this),
        string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function styleMaybeRemove(id, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
  return function() {
    var schedule = set(this, id),
        on = schedule.on,
        listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

    schedule.on = on1;
  };
}

function transition_style(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
  return value == null ? this
      .styleTween(name, styleNull(name, i))
      .on("end.style." + name, styleRemove(name))
    : typeof value === "function" ? this
      .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
      .each(styleMaybeRemove(this._id, name))
    : this
      .styleTween(name, styleConstant(name, i, value), priority)
      .on("end.style." + name, null);
}

function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}

function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}

function transition_styleTween(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

function transition_text(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction(tweenValue(this, "text", value))
      : textConstant(value == null ? "" : value + ""));
}

function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}

function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_textTween(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, textTween(value));
}

function transition_transition() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
}

function transition_end() {
  var on0, on1, that = this, id = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = {value: reject},
        end = {value: function() { if (--size === 0) resolve(); }};

    that.each(function() {
      var schedule = set(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }

      schedule.on = on1;
    });

    // The selection was empty, resolve end immediately
    if (size === 0) resolve();
  });
}

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  textTween: transition_textTween,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease,
  easeVarying: transition_easeVarying,
  end: transition_end,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id} not found`);
    }
  }
  return timing;
}

function selection_transition(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
}

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

function forceCenter(x, y) {
  var nodes, strength = 1;

  if (x == null) x = 0;
  if (y == null) y = 0;

  function force() {
    var i,
        n = nodes.length,
        node,
        sx = 0,
        sy = 0;

    for (i = 0; i < n; ++i) {
      node = nodes[i], sx += node.x, sy += node.y;
    }

    for (sx = (sx / n - x) * strength, sy = (sy / n - y) * strength, i = 0; i < n; ++i) {
      node = nodes[i], node.x -= sx, node.y -= sy;
    }
  }

  force.initialize = function(_) {
    nodes = _;
  };

  force.x = function(_) {
    return arguments.length ? (x = +_, force) : x;
  };

  force.y = function(_) {
    return arguments.length ? (y = +_, force) : y;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  return force;
}

function tree_add(d) {
  const x = +this._x.call(null, d),
      y = +this._y.call(null, d);
  return add(this.cover(x, y), x, y, d);
}

function add(tree, x, y, d) {
  if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

  var parent,
      node = tree._root,
      leaf = {data: d},
      x0 = tree._x0,
      y0 = tree._y0,
      x1 = tree._x1,
      y1 = tree._y1,
      xm,
      ym,
      xp,
      yp,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return tree._root = leaf, tree;

  // Find the existing leaf for the new point, or add it.
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
  }

  // Is the new point is exactly coincident with the existing point?
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

  // Otherwise, split the leaf node until the old and new point are separated.
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
  return parent[j] = node, parent[i] = leaf, tree;
}

function addAll(data) {
  var d, i, n = data.length,
      x,
      y,
      xz = new Array(n),
      yz = new Array(n),
      x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  // Compute the points and their extent.
  for (i = 0; i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  // If there were no (valid) points, abort.
  if (x0 > x1 || y0 > y1) return this;

  // Expand the tree to cover the new points.
  this.cover(x0, y0).cover(x1, y1);

  // Add the new points.
  for (i = 0; i < n; ++i) {
    add(this, xz[i], yz[i], data[i]);
  }

  return this;
}

function tree_cover(x, y) {
  if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

  var x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1;

  // If the quadtree has no extent, initialize them.
  // Integer extent are necessary so that if we later double the extent,
  // the existing quadrant boundaries don’t change due to floating point error!
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  }

  // Otherwise, double repeatedly to cover.
  else {
    var z = x1 - x0 || 1,
        node = this._root,
        parent,
        i;

    while (x0 > x || x >= x1 || y0 > y || y >= y1) {
      i = (y < y0) << 1 | (x < x0);
      parent = new Array(4), parent[i] = node, node = parent, z *= 2;
      switch (i) {
        case 0: x1 = x0 + z, y1 = y0 + z; break;
        case 1: x0 = x1 - z, y1 = y0 + z; break;
        case 2: x1 = x0 + z, y0 = y1 - z; break;
        case 3: x0 = x1 - z, y0 = y1 - z; break;
      }
    }

    if (this._root && this._root.length) this._root = node;
  }

  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
}

function tree_data() {
  var data = [];
  this.visit(function(node) {
    if (!node.length) do data.push(node.data); while (node = node.next)
  });
  return data;
}

function tree_extent(_) {
  return arguments.length
      ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
      : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
}

function Quad(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
}

function tree_find(x, y, radius) {
  var data,
      x0 = this._x0,
      y0 = this._y0,
      x1,
      y1,
      x2,
      y2,
      x3 = this._x1,
      y3 = this._y1,
      quads = [],
      node = this._root,
      q,
      i;

  if (node) quads.push(new Quad(node, x0, y0, x3, y3));
  if (radius == null) radius = Infinity;
  else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }

  while (q = quads.pop()) {

    // Stop searching if this quadrant can’t contain a closer node.
    if (!(node = q.node)
        || (x1 = q.x0) > x3
        || (y1 = q.y0) > y3
        || (x2 = q.x1) < x0
        || (y2 = q.y1) < y0) continue;

    // Bisect the current quadrant.
    if (node.length) {
      var xm = (x1 + x2) / 2,
          ym = (y1 + y2) / 2;

      quads.push(
        new Quad(node[3], xm, ym, x2, y2),
        new Quad(node[2], x1, ym, xm, y2),
        new Quad(node[1], xm, y1, x2, ym),
        new Quad(node[0], x1, y1, xm, ym)
      );

      // Visit the closest quadrant first.
      if (i = (y >= ym) << 1 | (x >= xm)) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    }

    // Visit this point. (Visiting coincident points isn’t necessary!)
    else {
      var dx = x - +this._x.call(null, node.data),
          dy = y - +this._y.call(null, node.data),
          d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x - d, y0 = y - d;
        x3 = x + d, y3 = y + d;
        data = node.data;
      }
    }
  }

  return data;
}

function tree_remove(d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

  var parent,
      node = this._root,
      retainer,
      previous,
      next,
      x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1,
      x,
      y,
      xm,
      ym,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return this;

  // Find the leaf node for the point.
  // While descending, also retain the deepest parent with a non-removed sibling.
  if (node.length) while (true) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
    if (!node.length) break;
    if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
  }

  // Find the point to remove.
  while (node.data !== d) if (!(previous = node, node = node.next)) return this;
  if (next = node.next) delete node.next;

  // If there are multiple coincident points, remove just the point.
  if (previous) return (next ? previous.next = next : delete previous.next), this;

  // If this is the root point, remove it.
  if (!parent) return this._root = next, this;

  // Remove this leaf.
  next ? parent[i] = next : delete parent[i];

  // If the parent now contains exactly one leaf, collapse superfluous parents.
  if ((node = parent[0] || parent[1] || parent[2] || parent[3])
      && node === (parent[3] || parent[2] || parent[1] || parent[0])
      && !node.length) {
    if (retainer) retainer[j] = node;
    else this._root = node;
  }

  return this;
}

function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
  return this;
}

function tree_root() {
  return this._root;
}

function tree_size() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length) do ++size; while (node = node.next)
  });
  return size;
}

function tree_visit(callback) {
  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
  if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
    }
  }
  return this;
}

function tree_visitAfter(callback) {
  var quads = [], next = [], q;
  if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
}

function defaultX(d) {
  return d[0];
}

function tree_x(_) {
  return arguments.length ? (this._x = _, this) : this._x;
}

function defaultY(d) {
  return d[1];
}

function tree_y(_) {
  return arguments.length ? (this._y = _, this) : this._y;
}

function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}

function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}

function leaf_copy(leaf) {
  var copy = {data: leaf.data}, next = copy;
  while (leaf = leaf.next) next = next.next = {data: leaf.data};
  return copy;
}

var treeProto = quadtree.prototype = Quadtree.prototype;

treeProto.copy = function() {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
      node = this._root,
      nodes,
      child;

  if (!node) return copy;

  if (!node.length) return copy._root = leaf_copy(node), copy;

  nodes = [{source: node, target: copy._root = new Array(4)}];
  while (node = nodes.pop()) {
    for (var i = 0; i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
        else node.target[i] = leaf_copy(child);
      }
    }
  }

  return copy;
};

treeProto.add = tree_add;
treeProto.addAll = addAll;
treeProto.cover = tree_cover;
treeProto.data = tree_data;
treeProto.extent = tree_extent;
treeProto.find = tree_find;
treeProto.remove = tree_remove;
treeProto.removeAll = removeAll;
treeProto.root = tree_root;
treeProto.size = tree_size;
treeProto.visit = tree_visit;
treeProto.visitAfter = tree_visitAfter;
treeProto.x = tree_x;
treeProto.y = tree_y;

function constant$1(x) {
  return function() {
    return x;
  };
}

function jiggle(random) {
  return (random() - 0.5) * 1e-6;
}

function x$1(d) {
  return d.x + d.vx;
}

function y$1(d) {
  return d.y + d.vy;
}

function forceCollide(radius) {
  var nodes,
      radii,
      random,
      strength = 1,
      iterations = 1;

  if (typeof radius !== "function") radius = constant$1(radius == null ? 1 : +radius);

  function force() {
    var i, n = nodes.length,
        tree,
        node,
        xi,
        yi,
        ri,
        ri2;

    for (var k = 0; k < iterations; ++k) {
      tree = quadtree(nodes, x$1, y$1).visitAfter(prepare);
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[node.index], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data, rj = quad.r, r = ri + rj;
      if (data) {
        if (data.index > node.index) {
          var x = xi - data.x - data.vx,
              y = yi - data.y - data.vy,
              l = x * x + y * y;
          if (l < r * r) {
            if (x === 0) x = jiggle(random), l += x * x;
            if (y === 0) y = jiggle(random), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }

  function prepare(quad) {
    if (quad.data) return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0; i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    radii = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
  }

  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant$1(+_), initialize(), force) : radius;
  };

  return force;
}

function index(d) {
  return d.index;
}

function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("node not found: " + nodeId);
  return node;
}

function forceLink(links) {
  var id = index,
      strength = defaultStrength,
      strengths,
      distance = constant$1(30),
      distances,
      nodes,
      count,
      bias,
      random,
      iterations = 1;

  if (links == null) links = [];

  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }

  function force(alpha) {
    for (var k = 0, n = links.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x = target.x + target.vx - source.x - source.vx || jiggle(random);
        y = target.y + target.vy - source.y - source.vy || jiggle(random);
        l = Math.sqrt(x * x + y * y);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x *= l, y *= l;
        target.vx -= x * (b = bias[i]);
        target.vy -= y * b;
        source.vx += x * (b = 1 - b);
        source.vy += y * b;
      }
    }
  }

  function initialize() {
    if (!nodes) return;

    var i,
        n = nodes.length,
        m = links.length,
        nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
        link;

    for (i = 0, count = new Array(n); i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }

    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }

    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }

  function initializeStrength() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }

  function initializeDistance() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }

  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };

  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };

  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$1(+_), initializeStrength(), force) : strength;
  };

  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant$1(+_), initializeDistance(), force) : distance;
  };

  return force;
}

// https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
const a = 1664525;
const c = 1013904223;
const m = 4294967296; // 2^32

function lcg() {
  let s = 1;
  return () => (s = (a * s + c) % m) / m;
}

function x(d) {
  return d.x;
}

function y(d) {
  return d.y;
}

var initialRadius = 10,
    initialAngle = Math.PI * (3 - Math.sqrt(5));

function simulation(nodes) {
  var simulation,
      alpha = 1,
      alphaMin = 0.001,
      alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
      alphaTarget = 0,
      velocityDecay = 0.6,
      forces = new Map(),
      stepper = timer(step),
      event = dispatch("tick", "end"),
      random = lcg();

  if (nodes == null) nodes = [];

  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }

  function tick(iterations) {
    var i, n = nodes.length, node;

    if (iterations === undefined) iterations = 1;

    for (var k = 0; k < iterations; ++k) {
      alpha += (alphaTarget - alpha) * alphaDecay;

      forces.forEach(function(force) {
        force(alpha);
      });

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        if (node.fx == null) node.x += node.vx *= velocityDecay;
        else node.x = node.fx, node.vx = 0;
        if (node.fy == null) node.y += node.vy *= velocityDecay;
        else node.y = node.fy, node.vy = 0;
      }
    }

    return simulation;
  }

  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      if (node.fx != null) node.x = node.fx;
      if (node.fy != null) node.y = node.fy;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(0.5 + i), angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }

  function initializeForce(force) {
    if (force.initialize) force.initialize(nodes, random);
    return force;
  }

  initializeNodes();

  return simulation = {
    tick: tick,

    restart: function() {
      return stepper.restart(step), simulation;
    },

    stop: function() {
      return stepper.stop(), simulation;
    },

    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
    },

    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },

    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },

    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },

    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },

    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },

    randomSource: function(_) {
      return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
    },

    force: function(name, _) {
      return arguments.length > 1 ? ((_ == null ? forces.delete(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
    },

    find: function(x, y, radius) {
      var i = 0,
          n = nodes.length,
          dx,
          dy,
          d2,
          node,
          closest;

      if (radius == null) radius = Infinity;
      else radius *= radius;

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        dx = x - node.x;
        dy = y - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius) closest = node, radius = d2;
      }

      return closest;
    },

    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
}

function forceManyBody() {
  var nodes,
      node,
      random,
      alpha,
      strength = constant$1(-30),
      strengths,
      distanceMin2 = 1,
      distanceMax2 = Infinity,
      theta2 = 0.81;

  function force(_) {
    var i, n = nodes.length, tree = quadtree(nodes, x, y).visitAfter(accumulate);
    for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length, node;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
  }

  function accumulate(quad) {
    var strength = 0, q, c, weight = 0, x, y, i;

    // For internal nodes, accumulate forces from child quadrants.
    if (quad.length) {
      for (x = y = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = Math.abs(q.value))) {
          strength += q.value, weight += c, x += c * q.x, y += c * q.y;
        }
      }
      quad.x = x / weight;
      quad.y = y / weight;
    }

    // For leaf nodes, accumulate forces from coincident quadrants.
    else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do strength += strengths[q.data.index];
      while (q = q.next);
    }

    quad.value = strength;
  }

  function apply(quad, x1, _, x2) {
    if (!quad.value) return true;

    var x = quad.x - node.x,
        y = quad.y - node.y,
        w = x2 - x1,
        l = x * x + y * y;

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x === 0) x = jiggle(random), l += x * x;
        if (y === 0) y = jiggle(random), l += y * y;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        node.vx += x * quad.value * alpha / l;
        node.vy += y * quad.value * alpha / l;
      }
      return true;
    }

    // Otherwise, process points directly.
    else if (quad.length || l >= distanceMax2) return;

    // Limit forces for very close nodes; randomize direction if coincident.
    if (quad.data !== node || quad.next) {
      if (x === 0) x = jiggle(random), l += x * x;
      if (y === 0) y = jiggle(random), l += y * y;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }

    do if (quad.data !== node) {
      w = strengths[quad.data.index] * alpha / l;
      node.vx += x * w;
      node.vy += y * w;
    } while (quad = quad.next);
  }

  force.initialize = function(_nodes, _random) {
    nodes = _nodes;
    random = _random;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$1(+_), initialize(), force) : strength;
  };

  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };

  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };

  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };

  return force;
}

var constant = x => () => x;

function ZoomEvent(type, {
  sourceEvent,
  target,
  transform,
  dispatch
}) {
  Object.defineProperties(this, {
    type: {value: type, enumerable: true, configurable: true},
    sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
    target: {value: target, enumerable: true, configurable: true},
    transform: {value: transform, enumerable: true, configurable: true},
    _: {value: dispatch}
  });
}

function Transform(k, x, y) {
  this.k = k;
  this.x = x;
  this.y = y;
}

Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y) {
    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y) {
    return y * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y) {
    return (y - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};

var identity = new Transform(1, 0, 0);

Transform.prototype;

function nopropagation(event) {
  event.stopImmediatePropagation();
}

function noevent(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

// Ignore right-click, since that should open the context menu.
// except for pinch-to-zoom, which is sent as a wheel+ctrlKey event
function defaultFilter(event) {
  return (!event.ctrlKey || event.type === 'wheel') && !event.button;
}

function defaultExtent() {
  var e = this;
  if (e instanceof SVGElement) {
    e = e.ownerSVGElement || e;
    if (e.hasAttribute("viewBox")) {
      e = e.viewBox.baseVal;
      return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
    }
    return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
  }
  return [[0, 0], [e.clientWidth, e.clientHeight]];
}

function defaultTransform() {
  return this.__zoom || identity;
}

function defaultWheelDelta(event) {
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
}

function defaultTouchable() {
  return navigator.maxTouchPoints || ("ontouchstart" in this);
}

function defaultConstrain(transform, extent, translateExtent) {
  var dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0],
      dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0],
      dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1],
      dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
  return transform.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
  );
}

function zoom() {
  var filter = defaultFilter,
      extent = defaultExtent,
      constrain = defaultConstrain,
      wheelDelta = defaultWheelDelta,
      touchable = defaultTouchable,
      scaleExtent = [0, Infinity],
      translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
      duration = 250,
      interpolate = interpolateZoom,
      listeners = dispatch("start", "zoom", "end"),
      touchstarting,
      touchfirst,
      touchending,
      touchDelay = 500,
      wheelDelay = 150,
      clickDistance2 = 0,
      tapDistance = 10;

  function zoom(selection) {
    selection
        .property("__zoom", defaultTransform)
        .on("wheel.zoom", wheeled, {passive: false})
        .on("mousedown.zoom", mousedowned)
        .on("dblclick.zoom", dblclicked)
      .filter(touchable)
        .on("touchstart.zoom", touchstarted)
        .on("touchmove.zoom", touchmoved)
        .on("touchend.zoom touchcancel.zoom", touchended)
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }

  zoom.transform = function(collection, transform, point, event) {
    var selection = collection.selection ? collection.selection() : collection;
    selection.property("__zoom", defaultTransform);
    if (collection !== selection) {
      schedule(collection, transform, point, event);
    } else {
      selection.interrupt().each(function() {
        gesture(this, arguments)
          .event(event)
          .start()
          .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
          .end();
      });
    }
  };

  zoom.scaleBy = function(selection, k, p, event) {
    zoom.scaleTo(selection, function() {
      var k0 = this.__zoom.k,
          k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return k0 * k1;
    }, p, event);
  };

  zoom.scaleTo = function(selection, k, p, event) {
    zoom.transform(selection, function() {
      var e = extent.apply(this, arguments),
          t0 = this.__zoom,
          p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p,
          p1 = t0.invert(p0),
          k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
    }, p, event);
  };

  zoom.translateBy = function(selection, x, y, event) {
    zoom.transform(selection, function() {
      return constrain(this.__zoom.translate(
        typeof x === "function" ? x.apply(this, arguments) : x,
        typeof y === "function" ? y.apply(this, arguments) : y
      ), extent.apply(this, arguments), translateExtent);
    }, null, event);
  };

  zoom.translateTo = function(selection, x, y, p, event) {
    zoom.transform(selection, function() {
      var e = extent.apply(this, arguments),
          t = this.__zoom,
          p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
      return constrain(identity.translate(p0[0], p0[1]).scale(t.k).translate(
        typeof x === "function" ? -x.apply(this, arguments) : -x,
        typeof y === "function" ? -y.apply(this, arguments) : -y
      ), e, translateExtent);
    }, p, event);
  };

  function scale(transform, k) {
    k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
    return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
  }

  function translate(transform, p0, p1) {
    var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
    return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
  }

  function centroid(extent) {
    return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
  }

  function schedule(transition, transform, point, event) {
    transition
        .on("start.zoom", function() { gesture(this, arguments).event(event).start(); })
        .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).event(event).end(); })
        .tween("zoom", function() {
          var that = this,
              args = arguments,
              g = gesture(that, args).event(event),
              e = extent.apply(that, args),
              p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point,
              w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
              a = that.__zoom,
              b = typeof transform === "function" ? transform.apply(that, args) : transform,
              i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
          return function(t) {
            if (t === 1) t = b; // Avoid rounding error on end.
            else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
            g.zoom(null, t);
          };
        });
  }

  function gesture(that, args, clean) {
    return (!clean && that.__zooming) || new Gesture(that, args);
  }

  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.sourceEvent = null;
    this.extent = extent.apply(that, args);
    this.taps = 0;
  }

  Gesture.prototype = {
    event: function(event) {
      if (event) this.sourceEvent = event;
      return this;
    },
    start: function() {
      if (++this.active === 1) {
        this.that.__zooming = this;
        this.emit("start");
      }
      return this;
    },
    zoom: function(key, transform) {
      if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
      if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
      if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
      this.that.__zoom = transform;
      this.emit("zoom");
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        delete this.that.__zooming;
        this.emit("end");
      }
      return this;
    },
    emit: function(type) {
      var d = select(this.that).datum();
      listeners.call(
        type,
        this.that,
        new ZoomEvent(type, {
          sourceEvent: this.sourceEvent,
          target: zoom,
          type,
          transform: this.that.__zoom,
          dispatch: listeners
        }),
        d
      );
    }
  };

  function wheeled(event, ...args) {
    if (!filter.apply(this, arguments)) return;
    var g = gesture(this, args).event(event),
        t = this.__zoom,
        k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))),
        p = pointer(event);

    // If the mouse is in the same location as before, reuse it.
    // If there were recent wheel events, reset the wheel idle timeout.
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);
    }

    // If this wheel event won’t trigger a transform change, ignore it.
    else if (t.k === k) return;

    // Otherwise, capture the mouse point and location at the start.
    else {
      g.mouse = [p, t.invert(p)];
      interrupt(this);
      g.start();
    }

    noevent(event);
    g.wheel = setTimeout(wheelidled, wheelDelay);
    g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));

    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }

  function mousedowned(event, ...args) {
    if (touchending || !filter.apply(this, arguments)) return;
    var currentTarget = event.currentTarget,
        g = gesture(this, args, true).event(event),
        v = select(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
        p = pointer(event, currentTarget),
        x0 = event.clientX,
        y0 = event.clientY;

    dragDisable(event.view);
    nopropagation(event);
    g.mouse = [p, this.__zoom.invert(p)];
    interrupt(this);
    g.start();

    function mousemoved(event) {
      noevent(event);
      if (!g.moved) {
        var dx = event.clientX - x0, dy = event.clientY - y0;
        g.moved = dx * dx + dy * dy > clickDistance2;
      }
      g.event(event)
       .zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer(event, currentTarget), g.mouse[1]), g.extent, translateExtent));
    }

    function mouseupped(event) {
      v.on("mousemove.zoom mouseup.zoom", null);
      yesdrag(event.view, g.moved);
      noevent(event);
      g.event(event).end();
    }
  }

  function dblclicked(event, ...args) {
    if (!filter.apply(this, arguments)) return;
    var t0 = this.__zoom,
        p0 = pointer(event.changedTouches ? event.changedTouches[0] : event, this),
        p1 = t0.invert(p0),
        k1 = t0.k * (event.shiftKey ? 0.5 : 2),
        t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);

    noevent(event);
    if (duration > 0) select(this).transition().duration(duration).call(schedule, t1, p0, event);
    else select(this).call(zoom.transform, t1, p0, event);
  }

  function touchstarted(event, ...args) {
    if (!filter.apply(this, arguments)) return;
    var touches = event.touches,
        n = touches.length,
        g = gesture(this, args, event.changedTouches.length === n).event(event),
        started, i, t, p;

    nopropagation(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer(t, this);
      p = [p, this.__zoom.invert(p), t.identifier];
      if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
      else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
    }

    if (touchstarting) touchstarting = clearTimeout(touchstarting);

    if (started) {
      if (g.taps < 2) touchfirst = p[0], touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
      interrupt(this);
      g.start();
    }
  }

  function touchmoved(event, ...args) {
    if (!this.__zooming) return;
    var g = gesture(this, args).event(event),
        touches = event.changedTouches,
        n = touches.length, i, t, p, l;

    noevent(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer(t, this);
      if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
      else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
    }
    t = g.that.__zoom;
    if (g.touch1) {
      var p0 = g.touch0[0], l0 = g.touch0[1],
          p1 = g.touch1[0], l1 = g.touch1[1],
          dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
          dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    }
    else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
    else return;

    g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
  }

  function touchended(event, ...args) {
    if (!this.__zooming) return;
    var g = gesture(this, args).event(event),
        touches = event.changedTouches,
        n = touches.length, i, t;

    nopropagation(event);
    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() { touchending = null; }, touchDelay);
    for (i = 0; i < n; ++i) {
      t = touches[i];
      if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
      else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
    }
    if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
    if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
    else {
      g.end();
      // If this was a dbltap, reroute to the (optional) dblclick.zoom handler.
      if (g.taps === 2) {
        t = pointer(t, this);
        if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
          var p = select(this).on("dblclick.zoom");
          if (p) p.apply(this, arguments);
        }
      }
    }
  }

  zoom.wheelDelta = function(_) {
    return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant(+_), zoom) : wheelDelta;
  };

  zoom.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant(!!_), zoom) : filter;
  };

  zoom.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant(!!_), zoom) : touchable;
  };

  zoom.extent = function(_) {
    return arguments.length ? (extent = typeof _ === "function" ? _ : constant([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
  };

  zoom.scaleExtent = function(_) {
    return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
  };

  zoom.translateExtent = function(_) {
    return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
  };

  zoom.constrain = function(_) {
    return arguments.length ? (constrain = _, zoom) : constrain;
  };

  zoom.duration = function(_) {
    return arguments.length ? (duration = +_, zoom) : duration;
  };

  zoom.interpolate = function(_) {
    return arguments.length ? (interpolate = _, zoom) : interpolate;
  };

  zoom.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom : value;
  };

  zoom.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
  };

  zoom.tapDistance = function(_) {
    return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
  };

  return zoom;
}

// src/core/config.js
// Central configuration file to avoid hardcoding

const GRAPH_CONFIG = {
    dimensions: {
      width: 800, // Default width of the graph
      height: 600, // Default height of the graph
      padding: 50, // Padding around the graph
    },
    node: {
      maxRadius: 10, // Max radius for small graphs
      minRadius: 5, // Smaller minimum radius for very large graphs
      color: 'blue', // Default node color
      selectedColor: 'red', // Color for selected nodes
      labelOffset: 15, // Distance of labels from nodes
    },
    link: {
      color: '#ccc', // Default color for links
      thickness: 2, // Default thickness of links
      highlightedColor: 'red', // Color for highlighted links
      minDistance: 30, // Minimum link distance
      maxDistance: 150, // Maximum link distance for large graphs
      minThickness: 1, // Minimum thickness of links for better performance 
    },
    constraints: {
      topY: 50, // Minimum y-position for the top concept
      bottomY: 50, // Maximum y-position for the bottom concept
    },
    zoom: {
      scaleExtent: [0.1, 2], // Zoom range: 10% to 200% (adjust for large graphs)
    },
    simulation: {
      collisionFactor: 1.2, // Multiplier for collision radius
      chargeFactor: 5, // Multiplier for charge/repulsion strength
      throttling: true, // Enable throttling for simulation updates
      tickInterval: 30, // Minimum interval (ms) between simulation ticks for large graphs
    },
    performance: {
      maxNodes: 5000, // Suggest max nodes for optimal performance
      debounceInterval: 100, // Debounce interval for resize or drag events
    },
    features: {
      enableClustering: false, // Placeholder for future clustering feature
      theme: 'light', // Placeholder for theming (e.g., dark, light)
    },
  };

//src/core/interactivity.js

/**
 * Computes and assigns superconcepts and subconcepts based on graph links.
 * @param {Object} graphData - The graph data containing nodes and links.
 */
function computeSuperSubConcepts(graphData) {
  
  if (!graphData || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.links)) {
    console.error("❌ computeSuperSubConcepts received invalid graphData:", graphData);
    return;
}
console.log("✅ computeSuperSubConcepts received:", graphData.nodes.length, "nodes and", graphData.links.length, "links");
  // Ensure each node has superconcepts and subconcepts properties
    graphData.nodes.forEach(node => {
      if (!Array.isArray(node.superconcepts)) node.superconcepts = [];
      if (!Array.isArray(node.subconcepts)) node.subconcepts = [];
    });

    // Traverse links to assign superconcepts and subconcepts
    graphData.links.forEach(link => {
        let sourceNode = graphData.nodes.find(n => n.id == link.source );
        let targetNode = graphData.nodes.find(n => n.id == link.target );

        if (!sourceNode || !targetNode) {
          console.warn(`⚠️ Link references invalid nodes:`, link);
          return;
      }
      sourceNode.subconcepts.push(targetNode); // Outgoing = Subconcept
      targetNode.superconcepts.push(sourceNode); // Incoming = Superconcept
        
    });

    //Debugging: Log relationships
    graphData.nodes.forEach(node => {
        console.log(`🔗 Node ${node.id} Superconcepts:`, node.superconcepts.map(n => n.id));
        console.log(`🔗 Node ${node.id} Subconcepts:`, node.subconcepts.map(n => n.id));
    });
}

/**
 * Adds interactivity to the graph, including zoom, pan, and drag behaviors to the graph.
 * @param {Object} svg - The SVG element containing the graph.
 * @param {Object} simulation - The D3 force simulation instance.
 */

function addInteractivity(svg, simulation) {
  //const g = svg.append('g').attr('class', 'graph-transform');
  
  // Select the graph transform group for applying transformations
  const g = svg.select('.graph-transform');

  // Add zoom behavior
  svg.call(
    zoom()
      .scaleExtent(GRAPH_CONFIG.zoom.scaleExtent) // Zoom scale limits (10% to 1000%)
      .on('zoom', (event) => {
        // Apply zoom and pan transformations to the graph group
        g.attr('transform', event.transform);
      })
  );

  /*
  g.append(() => svg.select('.links').node());
  g.append(() => svg.select('.nodes').node());
  */
  // Add drag behavior to nodes
  g.selectAll('.node')
    .call(
      drag()
        .on('start', (event, d) => {
          // Start dragging: increase simulation alpha to allow movement
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; // Fix x position during drag
          d.fy = d.y; // Fix y position during drag
        })
        .on('drag', (event, d) => {
          // During drag: update fixed positions to follow the cursor
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          // End dragging: release fixed positions
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );
}

/**
 * Adds node-specific interactivity (hover, click) to the graph.
 * @param {Object} nodeGroup - The selection of nodes in the graph.
 * @param {Object} linkGroup - The selection of links in the graph.
 * @param {Object} graphData - The graph data containing nodes and links.
*/

function addNodeInteractivity(nodeGroup, linkGroup, graphData) {
  let selectedNodes = []; // Track selected nodes for shortest path

  nodeGroup
    .on('mouseover', function (event, d) {
      // Show tooltip on hover
      select('#tooltip')
        .style('left', `${event.pageX + 10}px`) // Position tooltip near the mouse
        .style('top', `${event.pageY + 10}px`)
        .style('display', 'inline-block') // Make tooltip visible
        .html(`
          <strong>ID:</strong> ${d.id}<br>
          <strong>Label:</strong> ${d.label|| 'No Label'}<br>
          <strong>Level:</strong> ${d.level || 'N/A'}
          `); // Display node ID, label and level
    })
    .on('mouseout', () => {
      // Hide tooltip when mouse leaves the node
      select('#tooltip').style('display', 'none');
    })
    .on('click', function (event, clickedNode) {
      // Handle node selection

      console.log(`📌 Node Clicked: ${clickedNode.id}`);

      // Track selected nodes for shortest path calculation
      selectedNodes.push(clickedNode.id);

    if (selectedNodes.length === 2) {
      const [startNode, endNode] = selectedNodes;

      // Calculate the shortest path
      const path = findShortestPath(graphData, startNode, endNode);
      console.log('Shortest Path:', path);

      if (path.length > 0) {
        // Highlight the shortest path
        nodeGroup.attr('fill', (node) =>
          path.includes(node.id) 
            ? 'orange' 
            : GRAPH_CONFIG.node.color
        );

        linkGroup.attr('stroke', (link) =>
          path.includes(link.source.id) && path.includes(link.target.id)
            ? 'orange'
            : GRAPH_CONFIG.link.color
        );

        // Update the HTML to display the shortest path
        select('#shortest-path-display').html(`
          Shortest path between <strong>${startNode}</strong> and <strong>${endNode}</strong>: 
          ${path.join(' → ')}
        `);

      } else {
        alert('No path found between the selected nodes.');
        
        // Clear the shortest path display
        select('#shortest-path-display').html('No path found between the selected nodes.');
      }

      // Reset selection
      selectedNodes = [];
    } else {

      /* Find neighbors
      const superconcepts = [];
      const subconcepts = [];
      
      linkGroup.each(function (link) {
        if (link.source.id === clickedNode.id) {
            subconcepts.push(link.target); // Outgoing link -> Subconcept
        } else if (link.target.id === clickedNode.id) {
            superconcepts.push(link.source); // Incoming link -> Superconcept
        }
    });
      */

    // Ensure relationships exist before accessing them
    if (!clickedNode.superconcepts || !clickedNode.subconcepts) {
      console.warn(`⚠️ Node ${clickedNode.id} missing superconcepts or subconcepts.`);
      return;
  }

    // Use precomputed values instead of recalculating
    const superconcepts = clickedNode.superconcepts;
    const subconcepts = clickedNode.subconcepts;
    
    console.log(`🔗 Node ${clickedNode.id} Superconcepts:`, superconcepts.map(n => n.id));
    console.log(`🔗 Node ${clickedNode.id} Subconcepts:`, subconcepts.map(n => n.id));


    // Format neighbor information
    const superconceptsInfo = superconcepts
        .map((node) => `${node.id} (${node.label || 'No Label'})`)
        .join(', ');
    const subconceptsInfo = subconcepts
        .map((node) => `${node.id} (${node.label || 'No Label'})`)
        .join(', ');

     // Update the UI with the selected node's information
      select('#selected-node-info').html(`
        <strong>Selected Node</strong><br>
        &ensp;  &emsp;ID: ${clickedNode.id}<br>
        &ensp;  &emsp;Label: ${clickedNode.label || 'No Label'}<br>
        <strong>Extent Size:</strong> ${clickedNode.metrics.extentSize}&ensp;  &emsp;<strong>Intent Size:</strong> ${clickedNode.metrics.intentSize}<br>
        <strong>Stability:</strong> ${clickedNode.metrics.stability}&ensp;  &emsp;<strong>Neighborhood Size:</strong> ${clickedNode.metrics.neighborhoodSize}<br>
        <strong>Superconcepts</strong>:${superconceptsInfo || 'None'}<br>
        <strong>Subconcepts:</strong> ${subconceptsInfo || 'None'}
        `);

      // Change color of clicked node
      //d3.select(this).attr('fill', GRAPH_CONFIG.node.selectedColor); // Change node color to red

      // Highlight clicked node and connected links
      nodeGroup.attr('fill', (node) =>
        node.id === clickedNode.id
            ? GRAPH_CONFIG.node.selectedColor
            : GRAPH_CONFIG.node.color
    );


      // Highlight connected links
      linkGroup
        .attr('stroke', (link) =>
          link.source.id === clickedNode.id || link.target.id === clickedNode.id
            ? GRAPH_CONFIG.link.highlightedColor // Highlight linked edges in red
            : GRAPH_CONFIG.link.color // Reset other edges to default
        )
        .attr('stroke-width', (link) =>
          link.source.id === clickedNode.id || link.target.id === clickedNode.id
            ? 4 // Thicker line for connected edges
            : GRAPH_CONFIG.link.thickness // Default thickness for others
        );

      // Reset colors of other nodes
      nodeGroup.attr('fill', (node) =>
        node.id === clickedNode.id 
      ? GRAPH_CONFIG.node.selectedColor // Keep clicked node highlighted 
      : GRAPH_CONFIG.node.color // Default color for others
      );
    }
 });
 // Add double-click to reset graph state
nodeGroup.on('dblclick', () => {
  // Reset all nodes and links
  nodeGroup.attr('fill', GRAPH_CONFIG.node.color);
  linkGroup
    .attr('stroke', GRAPH_CONFIG.link.color)
    .attr('stroke-width', GRAPH_CONFIG.link.thickness);

  select('#selected-node-info').html('Click a node to see its details.');
});
}

//src/core/reducedLabeling.js

/**
 * Extracts extent and intent from the node label.
 * @param {Object} node - The node object containing the `label`.
 * @returns {Object} - An object containing `extent` and `intent` arrays.
 */
function parseNodeLabel$1(node) {
    if (!node.label) {
        console.warn(`⚠️ Missing label for node ${node.id}. Defaulting to empty extent/intent.`);
        return { extent: [], intent: [] };
    }

    const extentMatch = node.label.match(/Extent\s*\{([^}]*)\}/);
    const intentMatch = node.label.match(/Intent\s*\{([^}]*)\}/);

    return {
        extent: extentMatch ? extentMatch[1].split(',').map(e => e.trim()).filter(e => e !== '') : [],
        intent: intentMatch ? intentMatch[1].split(',').map(i => i.trim()).filter(i => i !== '') : []
    };
}

/**
 * Formats extent and intent for visualization.
 * Distinguishes between extent and intent with clear visual markers.
 * @param {Array} extent - Array of extent elements (objects).
 * @param {Array} intent - Array of intent elements (attributes).
 * @returns {string} - Formatted label string for visualization.
 */
function formatLabel(extent, intent) {
    const extentLabel = extent.length > 0 
    ? extent.join(", ") : ""; // Skip empty
    const intentLabel = intent.length > 0 
    ? intent.join(", ") : ""; // Skip empty

    if (extentLabel && intentLabel) {
        return `[E: ${extentLabel}] [: ${intentLabel}]`;
    } else if (extentLabel) {
        return `[E: ${extentLabel}]`;
    } else if (intentLabel) {
        return `[I: ${intentLabel}]`;
    }
    return ""; // No label if both are empty
}

/**
 * Computes reduced labels for nodes based on their superconcepts and subconcepts.
 * Ensures intents and extents are only assigned once to their valid concepts.
 * @param {Array} nodes - The array of nodes in the concept lattice.
 * @param {Array} links - The array of links connecting nodes.
 */
function computeReducedLabels$1(nodes, links) {
    console.log(`✅ computeReducedLabels received: ${nodes?.length || 0} nodes, ${links?.length || 0} links`);

    if (!Array.isArray(nodes) || !Array.isArray(links)) {
        console.error("❌ computeReducedLabels received invalid data!", { nodes, links });
        return;
    }

    // Initialize tracking sets for global usage
    const assignedExtents = new Set(); // Tracks already assigned extents (objects)
    const assignedIntents = new Set(); // Tracks already assigned intents (attributes)

    // Step 1: Ensure every node has necessary properties
    nodes.forEach(node => {
        if (!node || typeof node !== "object" || !node.id) {
            console.warn(`⚠️ Skipping invalid node:`, node);
            return;
        }

        const { extent, intent } = parseNodeLabel$1(node);
        node.extent = extent || [];
        node.intent = intent || [];

        node.superconcepts = [];
        node.subconcepts = [];
        node.fullExtent = new Set(node.extent);
        node.fullIntent = new Set(node.intent);
        node.reducedExtent = [];
        node.reducedIntent = [];
    });

    console.log("✅ Nodes after extent/intent processing:", nodes);

    // Step 2: Compute superconcepts & subconcepts
    computeSuperSubConcepts({ nodes, links });

    /* Identify top and bottom concepts
    const topConcept = nodes.find(node => node.superconcepts.length === 0);
    const bottomConcept = nodes.find(node => node.subconcepts.length === 0);

    if (!topConcept || !bottomConcept) {
        console.error("❌ Could not determine top and bottom concepts!");
        return;
    }

    console.log(`✅ Top Concept: ${topConcept.id}`);
    console.log(`✅ Bottom Concept: ${bottomConcept.id}`);
    */
    // Step 3: Compute full intent (top-down propagation) and full extent (bottom-up propagation)
    nodes.forEach(node => {
        // Propagate intent from superconcepts
        node.superconcepts?.forEach(superconcept => {
            superconcept.fullIntent?.forEach(attr => node.fullIntent.add(attr));
        });
       node.fullIntent = [...node.fullIntent]; // Convert Set to Array
 
    // Propagate extent from subconcepts
    const inheritedExtent = new Set();
    node.subconcepts?.forEach(subconcept => {
        subconcept.fullExtent.forEach(obj => {
            if (!node.fullExtent.has(obj)) {
                node.fullExtent.add(obj);
                inheritedExtent.add(obj); // Avoid duplication
            }
        });
    });
        node.fullExtent = [...node.fullExtent]; // Convert Set to Array
    });
    console.log("✅ Nodes after full extent/intent computation:", nodes);

    // Step 3: Compute reduced labels
    nodes.forEach(node => {
       /* if (node === topConcept || node === bottomConcept) {
            // Skip labeling for the top and bottom concepts
            node.reducedExtent = [];
            node.reducedIntent = [];
            return;
        }
        */    
        const inheritedExtent = new Set();
        node.subconcepts?.forEach(sub => sub.fullExtent?.forEach(obj => inheritedExtent.add(obj))); // Now from bottom-up

         /*
        const inheritedIntent = new Set();
        node.superconcepts?.forEach(sup => sup.fullIntent?.forEach(attr => inheritedIntent.add(attr))); // Now from top-down

        // Reduced Extent: Remove inherited objects
        node.reducedExtent = node.fullExtent.filter(obj => !inheritedExtent.has(obj));

        // Reduced Intent: Remove inherited attributes
        node.reducedIntent = node.fullIntent.filter(attr => !inheritedIntent.has(attr));

        console.log(`✅ Node ${node.id} Reduced Labels:`, {
            fullExtent: node.fullExtent,
            fullIntent: node.fullIntent,
            reducedExtent: node.reducedExtent,
            reducedIntent: node.reducedIntent
        });
         */

     // Compute reducedExtent by excluding objects already assigned to other nodes
     node.reducedExtent = node.fullExtent.filter(obj => 
         !assignedExtents.has(obj)&& !inheritedExtent.has(obj));
     // Add the reducedExtent to the global tracker
     node.reducedExtent.forEach(obj =>  assignedExtents.add(obj));

     // Compute reducedIntent by excluding attributes already assigned to other nodes
     node.reducedIntent = node.intent.filter(attr => !assignedIntents.has(attr));
     // Add the reducedIntent to the global tracker
     node.reducedIntent.forEach(attr =>assignedIntents.add(attr));
    
     console.log(`✅ Node ${node.id} Updated Reduced Label:`, {
        reducedExtent: node.reducedExtent,
        reducedIntent: node.reducedIntent
    });
 });


// Final visualization or debug logs for verification
visualizeReducedLabels(nodes);
}

/**
 * Visualizes reduced labels with clear differentiation between extent and intent.
 * @param {Array} nodes - Array of nodes in the lattice.
 */
function visualizeReducedLabels(nodes) {
    nodes.forEach(node => {
        console.log(
            `Node ${node.id}:\n` +
            ` - Reduced Extent: ${node.reducedExtent.join(", ")}\n` +
            ` - Reduced Intent: ${node.reducedIntent.join(", ")}`
        );
    });
}

//src/core/rendering.js 



/**
 * Updates node labels based on the selected labeling mode.
 * @param {string} mode - The selected labeling mode ("default", "full", "reduced").
 * @param {Object} labelGroup - The D3 selection of node labels.
 */
function updateLabels(mode, labelGroup) {
  console.log(`Updating Labels: Mode = ${mode}`);

  labelGroup.text(d => {
      if (!d) return "";  // Handle undefined nodes

      if (mode === "full") {
          return d.label || d.id;  // Full mode: Use `label` from JSON, fallback to `id`
      } else if (mode === "reduced") {
          // Ensure reduced labels are computed before using them
          if (!Array.isArray(d.reducedExtent) || !Array.isArray(d.reducedIntent)) {
            console.warn(`⚠️ Reduced labels missing for node ${d.id}.`);
            //return `(${d.extent?.join(", ") || "∅"}) | {${d.intent?.join(", ") || "∅"}}`;
            return ""; // Skip empty labels
          }
            /*let reducedExtent = d.reducedExtent.length > 0 ? `(${d.reducedExtent.join(", ")})` : "(∅)";
            let reducedIntent = d.reducedIntent.length > 0 ? `{${d.reducedIntent.join(", ")}}` : "{∅}";
           
            console.log(`🔹 Node ${d.id} Updated Reduced Label: ${reducedExtent} | ${reducedIntent}`);
            return `${reducedExtent} | ${reducedIntent}`;  // Reduced mode
          */
        return formatLabel(d.reducedExtent, d.reducedIntent); // Use formatted reduced label
      } else {
          return d.id;  // Default mode: Only show `id`
      }
  });
}
/**
 * Renders the graph with nodes and links
 * @param {string} container - The CSS selector for the container
 * @param {Object} graphData - The graph data containing nodes and links
 * @param {Object} options - Options for width and height of the SVG
 * @returns {Object} - References to the SVG and groups created
 */

function renderGraph(container, graphData, options) {
  //const { width, height } = options; // Destructure options for width and height
  
  const { width, height, padding } = { ...GRAPH_CONFIG.dimensions, ...options };

  if (!graphData || !graphData.nodes) {
    console.error("Error: graphData is missing nodes!", graphData);
    return;
}
console.log("📌 Computing superconcepts and subconcepts...");
computeSuperSubConcepts(graphData); // ✅ Correct place to compute relationships

console.log("📌 Computing reduced labels with:", graphData.nodes?.length, "nodes");
if (!Array.isArray(graphData.nodes)) {
    console.error("❌ graphData.nodes is not valid:", graphData.nodes);
} else {
    computeReducedLabels$1(graphData.nodes, graphData.links);
}


  /* Validate graph data
  if (!graphData || !graphData.nodes || !graphData.links) {
    console.error('Invalid graph data:', graphData);
    return;
  }

  // Dynamically calculate the size of the SVG container
  const containerNode = d3.select(container).node(); // Select the container element
  const containerRect = containerNode.getBoundingClientRect() || { width, height }; // Get the dimensions (width/height) of the container
 
  // Ensure containerRect dimensions are valid
  if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
    console.error('Invalid container dimensions:', containerRect);
    return;
  }
  
  const svgWidth = containerRect.width || width; // Use container width or fallback to viewport width
  const svgHeight = containerRect.height || height; // Use container height or fallback to viewport height

  // Dynamically calculate padding based on the size of the graph (number of nodes)
  const dynamicPadding = Math.max(padding, Math.sqrt(graphData.nodes.length || 1) * 10); // Scale padding to fit graph dynamically
*/

// Calculate dynamic node radius based on graph size
const dynamicRadius = Math.max(
  GRAPH_CONFIG.node.minRadius,
  Math.min(
    GRAPH_CONFIG.node.maxRadius,
    50 / Math.sqrt(graphData.nodes.length || 1) // Scale inversely with node count
  )
);

  // Create SVG element in the specified container
  const svg = select(container)
    .append('svg') // Append an SVG element to the container
      .attr('width', width) // Set dynamic width
      .attr('height', height) // Set dynamic height
      .style('overflow', 'visible'); // Allow content to overflow the container if needed)

  //Create a <g> group element to center and transform the graph
  const g = svg.append('g')
    .attr('class', 'graph-transform')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
    // Draw links
  const linkGroup = g.selectAll('.link')
    .data(graphData.links) // Bind the links data
    .enter() // Process each link in the data
    .append('line') // Append a <line> element for each link
    .attr('class', 'link') // Add a class for stylingGRAPH_CONFIG.link.minThickness, d.weight || GRAPH_CONFIG.link.defaultThickness)
    .attr('stroke', GRAPH_CONFIG.link.color) // Default link color
    .attr('stroke-width', d => Math.max(GRAPH_CONFIG.link.minThickness, d.weight || GRAPH_CONFIG.link.thickness)); // Dynamic link thickness based on weight

  // Draw nodes
  const nodeGroup = g.selectAll('.node') // Select all nodes (none exist initially)
    .data(graphData.nodes) // Bind the nodes data
    .enter() // Process each node in the data
    .append('circle') // Append a <circle> element for each node
    .attr('class', 'node') // Add a class for styling
    .attr('cx', (d) => d.x) // Use precomputed x
    .attr('cy', (d) => d.y) // Use precomputed y
    //.attr('r', GRAPH_CONFIG.node.defaultRadius) // Radius of the node
    //.attr('r', d =>Math.max(5, 100 / Math.sqrt(graphData.nodes.length))) // Dynamic radius
    .attr('r', dynamicRadius) // Use dynamic radius
    .attr('fill',  (d) => d.color || GRAPH_CONFIG.node.color); // Use updated color or default node color
      
    // Adjust label position dynamically based on node's position
    const labelGroup = g.selectAll('.node-label')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle') // Center text horizontally
      //.attr('dy', d => d.y > height / 2 ? 25 : -25) // Position label above or below node
      .attr('dy', d => (d.y < height / 2 ? -GRAPH_CONFIG.node.labelOffset : GRAPH_CONFIG.node.labelOffset)) // Position label above or below based on node's vertical location
      //.text(d => d.label || d.id); // Fallback to ID if no label is provided
      .text(d => d.id);// Default label

    // Apply initial labeling mode (default mode)
    updateLabels("default", labelGroup);

     // Delay to ensure rendering is complete before calling getBBox()
    // Adjust the SVG size dynamically based on the rendered content  
     setTimeout(() => {
     /*const groupNode = g.node();

      if (!groupNode) {
        console.error('Graph transform group is not found.');
        return;
      }
    */
    const bbox = g.node().getBBox(); // Get the bounding box of the rendered graph
    
    if (!bbox || isNaN(bbox.width) || isNaN(bbox.height)) {
      console.error('Invalid bounding box:', bbox);
      return;
    }
    
    // Debug bounding box dimensions
    console.log('Bounding Box Dimensions:', bbox.width, bbox.height);


  const adjustedWidth = Math.max(width, bbox.width + padding * 2);
  const adjustedHeight = Math.max(height, bbox.height + padding * 2);
    
    svg.attr('width', adjustedWidth).attr('height', adjustedHeight);
    
    /*svg.attr('width', Math.max(graphWidth, width)); 
    svg.attr('width', Math.max(graphHeight, height)); 
    
    // Center the graph dynamically
      centerGraph(svg, { width: graphWidth, height: graphHeight, padding, bbox });// Dynamically center the graph within the SVG
    
  svg.attr('width', bbox.width + padding * 2)
      .attr('height', bbox.height + padding * 2);
    */
  g.attr('transform', `translate(${padding+(width - bbox.width) / 2}, ${padding+(height - bbox.height) / 2})`);    
  
  /* Pass the correct bbox object to centerGraph
        centerGraph(svg, { width, height, padding, bbox }); */
      }, 100); // Delay ensures the graph is fully rendered before centering

    // Add interactivity to nodes
    addNodeInteractivity(nodeGroup, linkGroup);

    console.log('SVG Structure:', svg.node());

    // Return references to the SVG and its groups for further manipulation
    return  { svg, linkGroup, nodeGroup, labelGroup };
}

/**
 * Centers the graph dynamically within the SVG.
 * @param {Object} svg - The SVG element containing the graph.
 * @param {Object} options - Configuration options for dimensions and padding.
 */

function centerGraph(svg, { width, height, padding, bbox }) {
  //const { width, height, padding } = { ...GRAPH_CONFIG.dimensions, ...options };
  
  const g = svg.select('.graph-transform');

  /* Ensure the group contains elements before calculating the bounding box
  if (g.empty() || !bbox()) {
    console.error('Graph transform group is empty or bounding box is invalid.');
    return;
  }

  /*Get the bounding box of the group element
  const bbox = g.node().getBBox();
*/
  // Check for invalid bounding box values
  if (!bbox || isNaN(bbox.width) || isNaN(bbox.height)) {
    console.error('Invalid bounding box:', bbox);
    return;
  }

/*
  // Dynamically calculate padding based on the graph size (bounding box dimensions)
  const dynamicPadding = Math.max(padding, Math.sqrt(bbox.width * bbox.height) / 10); // Adjust factor for better results
  console.log('Dynamic Padding:', dynamicPadding);
  
  // Calculate bounding box of the graph
  const graphWidth = bbox.width;
  const graphHeight = bbox.height; 
  

  // Dynamically ensure container width and height are valid
  const svgWidth = width || GRAPH_CONFIG.dimensions.width; // Default to 800 if not provided
  const svgHeight = height || GRAPH_CONFIG.dimensions.height; // Default to 600 if not provided
 
  //Dynamically calculate padding based on graph size
  const horizontalPadding = Math.max((width - graphWidth) / 4, 20); // Ensure at least 20px padding
  const verticalPadding = Math.max((height - graphHeight) / 4, 20); // Ensure at least 20px padding
  

  if (!bbox || typeof bbox !== 'object') {
    console.error('Invalid bounding box:', bbox);
    return;
  }
*/
  // Calculate the center of the graph
  const graphCenterX = bbox.x + bbox.width / 2;
  const graphCenterY = bbox.y + bbox.height / 2;

  // Calculate the center of the SVG container with padding applied
  const svgCenterX = width / 2;
  const svgCenterY = height / 2;

 // Calculate translation needed to center the graph in the SVG
  const translateX = svgCenterX - graphCenterX; // Center horizontally;
  const translateY = svgCenterY - graphCenterY; // Center vertically

 /* if (isNaN(svgCenterX) || isNaN(svgCenterY)) {
    console.error('Invalid SVG center:', svgCenterX, svgCenterY);
    return;
  }

  // Adjust the SVG view box to include dynamic padding
  const adjustedWidth = bbox.width + dynamicPadding * 2;
  const adjustedHeight = graphHeight + dynamicPadding * 2;
  const adjustedX = bbox.x - dynamicPadding;
  const adjustedY = bbox.y - dynamicPadding;

  // Debugging logs
  console.log('Bounding Box:', bbox);
  console.log('Container Rect:', containerRect);
  console.log('Graph Center (X, Y):', graphCenterX, graphCenterY);
  console.log('SVG Center (X, Y):', svgCenterX, svgCenterY);
  console.log('Translation (X, Y):', translateX, translateY);
*/
  // Apply translation to center the graph
  g.attr('transform', `translate(${translateX}, ${translateY})`);
  
  // Debugging log
  console.log('Graph centered with translation:', { translateX, translateY }); 
  /* Adjust the SVG viewBox for dynamic scaling
  svg.attr(
    'viewBox',
    `${adjustedX} ${adjustedY} ${adjustedWidth} ${adjustedHeight}`
  ).attr('preserveAspectRatio', 'xMidYMid meet');
  */
}

// src/core/nodeMovement.js

/**
 * Applies movement constraints to node positions.
 * Ensures nodes:
 * - Stay inside the graph boundaries
 * - Maintain proper vertical alignment within their assigned layers
 * - Avoid overlapping with other nodes
 * - Do not cross into other layers
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {number} width - Width of the graph area.
 * @param {number} height - Height of the graph area.
 */
function applyNodeConstraints(graphData, width, height) {
    // ✅ Get padding from config to maintain consistent spacing
    const padding = GRAPH_CONFIG.dimensions.padding;

    // ✅ Compute layer spacing dynamically based on the total number of layers
    const maxLevel = Math.max(...graphData.nodes.map(n => n.level)); // Find the deepest level
    const layerSpacing = (height - 2 * padding) / (maxLevel + 1); // Distribute layers evenly

    /**
     * Helper function to find nodes directly connected to a given node.
     * @param {string} nodeId - The ID of the node to find linked nodes for.
     * @returns {Array} - Array of linked nodes.
     */
    function getLinkedNodes(nodeId) {
        return graphData.links
            .filter(link => link.source.id === nodeId || link.target.id === nodeId) // Find links where this node is a source or target
            .map(link => (link.source.id === nodeId ? link.target : link.source)); // Return the connected nodes
    }

    // ✅ Apply constraints to all nodes in the graph
    graphData.nodes.forEach(node => {
        if (node.id === 'Top Concept') {
            // 🔹 Keep "Top Concept" fixed at the top
            node.y = padding; // Strictly fix at top padding
        } else if (node.id === 'Bottom Concept') {
            // 🔹 Keep "Bottom Concept" fixed at the bottom
            node.y = height - padding; // Strictly fix at bottom padding
        } else {
            // 🔹 Ensure node stays within its assigned layer
            const layerY = padding + node.level * layerSpacing; // Compute base Y position for the layer
            const verticalMargin = layerSpacing * 0.3; // Allow some minor movement within the layer

            // 🔹 Ensure the node stays within its assigned layer boundaries
            const minY = layerY - verticalMargin;
            const maxY = layerY + verticalMargin;
            
            // Ensure the node stays within its assigned layer boundaries
            node.y = Math.max(minY, Math.min(maxY, node.y));

            // 🔹 Adjust y-position dynamically based on its linked neighbors
            const linkedNodes = getLinkedNodes(node.id); // Find connected nodes
            const upperNeighbors = linkedNodes.filter(n => n.level < node.level); // Nodes above this one
            const lowerNeighbors = linkedNodes.filter(n => n.level > node.level); // Nodes below this one

            // ✅ Compute new vertical positioning constraints based on linked neighbors
            const topY = upperNeighbors.length > 0
                ? Math.max(...upperNeighbors.map(n => n.y + padding)) // Ensures node stays below its upper neighbors
                : minY; // Default to minY if no upper neighbors

            const bottomY = lowerNeighbors.length > 0
                ? Math.min(...lowerNeighbors.map(n => n.y - padding)) // Ensures node stays above its lower neighbors
                : maxY; // Default to maxY if no lower neighbors

            // ✅ Apply the computed constraints to prevent overlapping with neighbors
            node.y = Math.max(topY, Math.min(bottomY, node.y));
        }

        // ✅ Ensure nodes stay within the graph's horizontal & vertical boundaries
        node.x = Math.max(padding, Math.min(width - padding, node.x)); // Keeps nodes inside left-right bounds
        node.y = Math.max(padding, Math.min(height - padding, node.y)); // Keeps nodes inside top-bottom bounds
    });

    // ✅ Apply an additional step to prevent nodes from overlapping
    preventNodeOverlap(graphData);
}

/**
 * Prevents nodes from overlapping by applying a simple repulsion force.
 * Ensures:
 * - Nodes do not get too close to each other
 * - Labels and nodes do not collide
 * - Maintains better readability of the graph
 * @param {Object} graphData - The graph data containing nodes.
 */
function preventNodeOverlap(graphData) {
    const minDistance = GRAPH_CONFIG.node.maxRadius * 2; // ✅ Defines the minimum spacing between nodes

    graphData.nodes.forEach((nodeA) => {
        graphData.nodes.forEach((nodeB) => {
            if (nodeA !== nodeB) { // ✅ Only compare different nodes
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distance = Math.sqrt(dx * dx + dy * dy); // Compute Euclidean distance between nodes

                if (distance < minDistance) { // If nodes are too close
                    const angle = Math.atan2(dy, dx); // Find the angle between the nodes
                    const moveAmount = (minDistance - distance) / 2; // Compute how much they need to be moved apart

                    // ✅ Move both nodes apart by a small amount
                    nodeA.x += Math.cos(angle) * moveAmount;
                    nodeA.y += Math.sin(angle) * moveAmount;
                    nodeB.x -= Math.cos(angle) * moveAmount;
                    nodeB.y -= Math.sin(angle) * moveAmount;
                }
            }
        });
    });
}

// src/core/simulation.js

/**
 * Creates and configures a D3 force simulation.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} linkGroup - The D3 selection for links.
 * @param {Object} nodeGroup - The D3 selection for nodes.
 * @param {Object} labelGroup - The D3 selection for labels.
 * @param {Object} options - Configuration options for the simulation.
 * @returns {Object} - A configured D3 force simulation instance.
 */

function createSimulation(graphData, linkGroup, nodeGroup, labelGroup, options) {
  const { width, height } = { ...GRAPH_CONFIG.dimensions, ...options };
  const padding = GRAPH_CONFIG.dimensions.padding;

// Initialize node positions if not already set
const layerSpacing = (height - 2 * padding) / ((graphData.layers.length || 1) + 1);
 graphData.nodes.forEach((node) => {
        node.x = node.x || width / 2;
        node.y = node.y || (node.layer !== undefined ? padding + node.layer * layerSpacing : height / 2);
    }); 

/* Ensure node positions are assigned ONLY if they are undefined
graphData.nodes.forEach((node) => {
  if (node.x === undefined) node.x = width / 2; // Default center horizontally
  if (node.y === undefined) node.y = height / 2; // Default center vertically
});
*/
//Dynamically adjust force parameters
const baseDistance = Math.min(width, height) / 5; // Base distance relative to canvas size
const dynamicLinkDistance = Math.max(
  GRAPH_CONFIG.link.minDistance, 
  baseDistance / Math.sqrt(graphData.nodes.length)); // Link distance scales with node count

const collisionRadius = Math.max(30, dynamicLinkDistance * GRAPH_CONFIG.simulation.collisionFactor); // Increased collision radius
const chargeStrength = Math.min(-100, -dynamicLinkDistance * GRAPH_CONFIG.simulation.chargeFactor); // Stronger repulsion for larger graphs

  const simulation$1 = simulation(graphData.nodes)
    .force('link', forceLink(graphData.links).id(d => d.id).distance(dynamicLinkDistance)) // Dynamic link distance
    .force('charge', forceManyBody().strength(chargeStrength)) // Adjust repulsion dynamically
    .force('collision', forceCollide().radius(collisionRadius)) // Dynamic collision radius
    .force('center', forceCenter(width / 2, height / 2)) // Center graph
    .on('tick', () => {
      // Update positions dynamically on every tick

       // Update link positions
      linkGroup
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      // Update node positions
      nodeGroup
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
      
      // Update label positions dynamically
      labelGroup
        .attr('x', (d)=> d.x)
        .attr('y', (d) => d.y + GRAPH_CONFIG.node.labelOffset); // Adjust below the node
    
      // Apply node constraints
      applyNodeConstraints(graphData, width, height);
      preventNodeOverlap(graphData); // Ensure nodes don't overlap

      // Debug: Log positions of first few nodes and links
  if (graphData.nodes.length > 0) {
    console.log('Node positions:', graphData.nodes.slice(0, 5).map(n => ({ id: n.id, x: n.x, y: n.y })));
  }
  if (graphData.links.length > 0) {
    console.log('Link positions:', graphData.links.slice(0, 5).map(l => ({ source: l.source.id, target: l.target.id })));
  }
      
}); 
  
    return simulation$1;
  }

// src/core/metrics.js

/**
 * Calculates metrics for the concept lattice.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} formalContext - The formal context containing objects and attributes.
 * @returns {Object} - The calculated metrics (number of concepts, objects, attributes).
 */
// Exporting a function to calculate metrics (concepts, objects, attributes).
function calculateMetrics(graphData) {

     // Check if the graph data is valid (should include nodes and links).
    if (!graphData || !graphData.nodes || !graphData.links) {
      throw new Error('Invalid input: Ensure graphData includes nodes and links.');
    }
  
     // **Global Metrics**
    const totalConcepts = graphData.nodes.length;// Number of concepts is the number of nodes in the graph
    const totalLinks = graphData.links.length; // Total number of links between concepts
    const maxPossibleLinks = (totalConcepts * (totalConcepts - 1)) / 2; // Maximum possible links in a complete graph
    const density = maxPossibleLinks > 0 ? (totalLinks / maxPossibleLinks).toFixed(4) : 0; // Ratio of actual links to possible links
  
    // Calculate the total number of unique objects across all nodes.
  // Each node's label contains an "Extent" block that specifies the objects it represents.
  // Extract and count unique objects
  new Set(
    graphData.nodes.flatMap((node) => {
      // Extract the "Extent" part from the node's label using a regular expression.
      const match = node.label.match(/Extent\s*\{([^}]*)\}/);
      // If a match is found, split the contents of the "Extent" by commas and trim whitespace.
      return match 
      ? match[1]
        .split(',')
        .map((item) => item.trim()) 
        .filter((item) => item !== '') // Exclude empty strings
      : [];
    })
  ).size; // Use a Set to ensure unique objects are counted.

  // Calculate the total number of unique attributes across all nodes.
  // Each node's label contains an "Intent" block that specifies the attributes it represents.
  // Extract and count unique attributes
  const uniqueAttributes = new Set();
  const uniqueObjects = new Set();

  // Compute concept-specific metrics
    graphData.nodes.forEach((node) => {

      // Extract the "Extent" (objects) from the node's label using a regular expression
      const extentMatch = node.label.match(/Extent\s*\{([^}]*)\}/);
      
      // Extract the "Intent" part from the node's label using a regular expression.
      const intentMatch = node.label.match(/Intent\s*\{([^}]*)\}/);
      
      // Parse the extent and intent into arrays, trimming whitespace and filtering out empty values
      const extent = extentMatch ? extentMatch[1].split(',').map(e => e.trim()).filter(Boolean) : [];
      const intent = intentMatch ? intentMatch[1].split(',').map(a => a.trim()).filter(Boolean) : [];

      // Add each unique object and attribute to the respective sets
      extent.forEach(obj => uniqueObjects.add(obj));
      intent.forEach(attr => uniqueAttributes.add(attr));

      // **Concept-level Metrics**
      // Stability: Proportion of the extent size to the sum of extent and intent sizes
      const stability = (extent.length + intent.length) > 0
          ? (extent.length / (extent.length + intent.length)).toFixed(4)
          : 0;

      // Neighborhood size: Number of direct links (edges) connected to the node
      const neighborhoodSize = graphData.links.filter(link =>
          link.source.id === node.id || link.target.id === node.id
      ).length;

      // Attach the calculated metrics to the node object for later use
      node.metrics = {
          stability, // The stability of the concept
          neighborhoodSize, // Number of connections for this concept
          extentSize: extent.length, // Number of objects in the extent
          intentSize: intent.length, // Number of attributes in the intent
      };
  });

  // Return global metrics for the entire lattice

      /* If a match is found, split the contents of the "Intent" by commas and trim whitespace.
      return match 
      ? match[1]
        .split(',')
        .map((item) => item.trim()) 
        .filter((item) => item !== '') // Exclude empty strings
      : [];
    })
  ).size; // Use a Set to ensure unique attributes are counted.
*/
  // Return an object containing the calculated metrics.
    return {
      totalConcepts,
      totalObjects: uniqueObjects.size,
      totalAttributes: uniqueAttributes.size,
      density, // Density of the lattice (global connectivity)
      averageStability: (
        // Calculate the average stability of all concepts
          graphData.nodes.reduce((sum, node) => sum + parseFloat(node.metrics.stability || 0), 0) /
          totalConcepts
      ).toFixed(4),
    };
  }

// src/core/canonicalBase.js

/**
 * Extracts concepts (extent and intent) from graph data.
 * @param {Object} graphData - The graph data containing nodes.
 * @returns {Array} - An array of concepts with "extent" and "intent".
 */
function extractConceptsFromGraph(graphData) {
    return graphData.nodes.map(node => {
       // Extract the Extent set from the node label using regex
      const extentMatch = node.label.match(/Extent\s*{([^}]*)}/);
      // Extract the Intent set from the node label using regex
      const intentMatch = node.label.match(/Intent\s*{([^}]*)}/);
      
      // Parse the Extent values if found; otherwise, return an empty array
      const extent = extentMatch 
        ? extentMatch[1]
            .split(',') // Split by comma
            .map(item => item.trim()) // Remove unnecessary spaces
        : [];

      // Parse the Intent values if found; otherwise, return an empty array
      const intent = intentMatch 
        ? intentMatch[1]
            .split(',')
            .map(item => item.trim()) 
        : [];
  
     // Return the concept as an object containing its Extent and Intent  
     return { extent, intent };
    });
  }

/**
 * Computes the canonical base (Duquenne–Guigues Base) for a given concept lattice.
 * @param {Array} concepts - The list of concepts, where each concept is an object with "extent" and "intent".
 * @returns {Array} - The canonical base as an array of implications (each implication has "premise" and "conclusion").
 */
function computeCanonicalBase(concepts) {
    const canonicalBase = [];
  
    /**
     * Helper function to compute the closure of a given set of attributes (intent).
     * The closure consists of all attributes that are implied by the given set.
     * @param {Array} attributes - The attribute set to compute the closure for.
     * @returns {Array} - The closure of the given attributes.
     */
    const computeClosure = (attributes) => {
      return concepts
      // Filter concepts that contain all attributes in the input set
        .filter(concept => attributes.every(attr => concept.intent.includes(attr)))
        .reduce((closure, concept) => {
          // Add new attributes from the matched concepts
          concept.intent.forEach(attr => {
            if (!closure.includes(attr)) {
              closure.push(attr);
            }
          });
          return closure;
        }, []); // Start with an empty closure set
    };
  
    // Iterate over each concept in the lattice to generate implications
    concepts.forEach(concept => {
      const premise = [...concept.intent]; // The premise starts as the concept's intent
      const closure = computeClosure(premise); // Compute the closure of the premise
      const conclusion = closure.filter(attr => !premise.includes(attr)); // Attributes in closure but not in premise
  
      // If the closure introduces new attributes, add the implication
      if (conclusion.length > 0) {
        canonicalBase.push({ premise, conclusion });
      }
    });
  
    // Minimize the canonical base by removing redundant implications
    const minimizedBase = minimizeImplications(canonicalBase);
  
    return minimizedBase;
  }
  
  /**
   * Minimizes a set of implications to ensure the canonical base is minimal.
   * @param {Array} implications - The list of implications (each with "premise" and "conclusion").
   * @returns {Array} - The minimized set of implications.
   */
  function minimizeImplications(implications) {
    const minimized = [];
  
    implications.forEach(implication => {
      const { premise, conclusion } = implication;
  
      // Check if the premise can be reduced while preserving the implication
      const reducedPremise = premise.filter(attr => {
        // Create a test premise by removing one attribute
        const testPremise = premise.filter(a => a !== attr);
        // Compute the closure of the test premise with the existing minimized implications
        const closure = computeClosureForImplications(testPremise, minimized);
        // If removing the attribute removes the conclusion, it is necessary
        return !conclusion.every(attr => closure.includes(attr));
      });
  
      // Add the minimized implication to the base
      minimized.push({ premise: reducedPremise, conclusion });
    });
  
    return minimized;
  }
  
  /**
   * Computes the closure of a set of attributes using a given set of implications.
   * @param {Array} attributes - The set of attributes to compute the closure for.
   * @param {Array} implications - The set of implications to use.
   * @returns {Array} - The closure of the given attributes.
   */
  function computeClosureForImplications(attributes, implications) {
    let closure = [...attributes]; // Initialize closure with the given attributes
    let changed; // Track whether the closure has changed
  
    do {
      changed = false;
  
      implications.forEach(({ premise, conclusion }) => {
        // Check if the premise is fully contained in the current closure
        if (premise.every(attr => closure.includes(attr)) &&
            conclusion.some(attr => !closure.includes(attr))) {
          // Add new attributes to the closure
          closure.push(...conclusion.filter(attr => !closure.includes(attr)));
          changed = true; // Mark that a change occurred
        }
      });
    } while (changed); // Repeat until no further changes occur
  
    return closure;
  }

// src/features/legend.js

/**
 * Updates the legend dynamically based on the color coding of the nodes.
 */
function updateLegend() {
    const legendContainer = document.getElementById('legend');
  
    // Clear the existing legend
    legendContainer.innerHTML = '';
  
    // Define the color mapping for the legend
    const legendItems = [
      { color: 'orange', label: 'Matches both extent and intent' },
      { color: 'green', label: 'Matches extent' },
      { color: 'gray', label: 'Matches intent' },
      { color: 'blue', label: 'No match' },
    ];
  
    // Dynamically create legend items
    legendItems.forEach((item) => {
      const legendItem = document.createElement('li');
  
      // Create the color indicator
      const colorIndicator = document.createElement('span');
      colorIndicator.style.backgroundColor = item.color;
  
      // Create the label text
      const label = document.createTextNode(item.label);
  
      // Append color indicator and label to the legend item
      legendItem.appendChild(colorIndicator);
      legendItem.appendChild(label);
  
      // Append the legend item to the legend container
      legendContainer.appendChild(legendItem);
    });
  }

// src/features/setupFilters.js

/**
 * Sets up the filtering controls and handles the filtering process.
 * 
 * @param {Object} originalGraphData - The original unfiltered graph data.
 */
function setupFilterControls(originalGraphData) {
  // Ensure the required elements exist in the DOM
  const objectFilterInput = document.getElementById('object-filter');
  const attributeFilterInput = document.getElementById('attribute-filter');
  const applyFiltersButton = document.getElementById('apply-filters');

  if (!objectFilterInput || !attributeFilterInput || !applyFiltersButton) {
    console.error('Filter controls are missing in the DOM.');
    return;
  }

  // Add event listener to the "Apply Filters" button
  applyFiltersButton.addEventListener('click', () => {
    // Get the object filter values from the input field
    const objectFilter = objectFilterInput.value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');

    // Get the attribute filter values from the input field
    const attributeFilter = attributeFilterInput.value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');

    console.log('Filter Criteria:', { objectFilter, attributeFilter });

    try {
      // Highlight nodes based on the specified filters
      const updatedData = filterLattice(originalGraphData, {
        objectFilter,
        attributeFilter,
      });

      // Re-render the lattice visualization with the updated colors
      createLattice(updatedData, { container: '#graph-container' });

      // Update the legend
      updateLegend();
    } catch (error) {
      console.error('Error during filtering:', error);
    }
  });
}
  
  // Programmatically add the filter UI
  //createFilterUI();

// src/core/layering.js

/**
 * Assigns nodes to hierarchical layers.
 * Use predefined `level` values from the JSON if available.
 * If no levels exist, it computes layers dynamically using the Coffman-Graham algorithm.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {Array} - An array of layers, each containing nodes.
 * @throws {Error} - If the graph data is invalid or malformed.
 */
function assignLayers$1(graphData) {
    if (!graphData || !Array.isArray(graphData.nodes)) {
        throw new Error("Invalid graph data: 'nodes' must be an array.");
    }

    const layers = [];
    const width = GRAPH_CONFIG.dimensions.width; // Canvas width (adjustable)
    const height = GRAPH_CONFIG.dimensions.height; // Canvas height (adjustable)
    const padding = GRAPH_CONFIG.dimensions.padding;
    //const layerSpacing = height / 10; // Vertical spacing between layers

    // Check if all nodes have a `level` property (predefined layering)
    const usePredefinedLevels = graphData.nodes.every(node => node.hasOwnProperty("level"));

    if (usePredefinedLevels) {
        console.log("✅ Using predefined levels from JSON...");

        // Calculate spacing dynamically based on the highest level in the dataset
        const maxLevel = Math.max(...graphData.nodes.map(n => n.level));
        const layerSpacing = (height - 2 * padding) / (maxLevel + 1);

    // Group nodes by their `level` property
    graphData.nodes.forEach((node) => {
        const layerIndex = node.level - 1; // Level 1 corresponds to layer 0
        if (!layers[layerIndex]) layers[layerIndex] = [];
        layers[layerIndex].push(node);

        // Assign initial y position for the node
        node.y = padding + layerIndex * layerSpacing; // Vertical spacing based on layer index
    });
   
} else {
    console.log("⚠️ No predefined levels detected. Computing layers using Coffman-Graham algorithm...");

    // Compute layers dynamically using the Coffman-Graham algorithm
    return computeCoffmanGrahamLayers(graphData);
}

// Evenly distribute nodes within each layer (improves horizontal alignment)
layers.forEach((layer) => {
    const xSpacing = (width - 2 * padding) / (layer.length + 1);
    layer.forEach((node, index) => {
        node.x = padding + (index + 1) * xSpacing; // Distribute evenly with padding
    });
});

    console.debug(
        "Layers Assigned:",
        layers.map((layer, index) => ({
            layer: index + 1, // Converts zero-based index to 1-based layer number for readability
            nodes: layer.map((node) => node.id),
        }))
    );

    return layers;
}

/**
 * Computes hierarchical layers dynamically using the Coffman-Graham algorithm.
 * This method is used if nodes do not have predefined `level` values.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {Array} - The computed layers using the Coffman-Graham algorithm.
 */
function computeCoffmanGrahamLayers(graphData) {
    const layers = [];
    const height = GRAPH_CONFIG.dimensions.height; // Canvas height
    const nodeQueue = [...graphData.nodes]; // Copy nodes for processing
    const placedNodes = new Set();

    // Sort nodes by decreasing number of dependencies (Coffman-Graham approach)
    nodeQueue.sort((a, b) => b.superconcepts.length - a.superconcepts.length);

    nodeQueue.forEach((node) => {
        let layer = 0;

        // Find the first available layer where all dependencies are placed
        while (layer < layers.length) {
            const dependenciesMet = node.superconcepts.every((parent) =>
                layers[layer].some((layerNode) => layerNode.id === parent.id)
            );

            if (dependenciesMet) break;
            layer++;
        }

        // Place the node in the correct layer
        if (!layers[layer]) layers[layer] = [];
        layers[layer].push(node);
        placedNodes.add(node.id);

        // Compute spacing
        const layerSpacing = height / (layers.length + 1);
        node.y = layer * layerSpacing;
    });

    console.debug(
        "Computed Layers (Coffman-Graham):",
        layers.map((layer, index) => ({
            layer: index + 1,
            nodes: layer.map((node) => node.id),
        }))
    );

    return layers;
}

/**
 * Orders nodes within layers to reduce edge crossings using the barycenter heuristic.
 * @param {Array} layers - The array of layers containing nodes.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @throws {Error} - If the input data is invalid or malformed.
 */
function orderVerticesWithinLayers(layers, graphData) {
    if (!Array.isArray(layers)) {
        throw new Error("Invalid input: 'layers' must be an array.");
    }
    if (!graphData || !Array.isArray(graphData.nodes)) {
        throw new Error("Invalid graph data: 'nodes' must be an array.");
    }

    //const width = 800; // Canvas width for horizontal positioning

    layers.forEach((layer) => {
        // Compute barycenters for nodes in the current layer
        layer.forEach((node) => {
            node.barycenter = computeBarycenter(node, graphData);
        });

        // Sort nodes within the layer by their barycenter
        layer.sort((a, b) => a.barycenter - b.barycenter);

        // ✅ Recompute **x-coordinates** after sorting for **better alignment**
        const layerWidth = GRAPH_CONFIG.dimensions.width - 2 * GRAPH_CONFIG.dimensions.padding;
        const xSpacing = layerWidth / (layer.length + 1);

        // Reassign x positions for evenly spaced nodes after sorting
        layer.forEach((node, index) => {
            node.x = GRAPH_CONFIG.dimensions.padding + (index + 1) * xSpacing; // Horizontal spacing
        });
    });

    console.debug("Nodes Ordered Within Layers");
}

/**
 * Computes the barycenter for a node based on its neighbors' positions.
 * Helps in minimizing edge crossings during node ordering.
 * @param {Object} node - The node for which to compute the barycenter.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {number} - The computed barycenter value, or 0 if no neighbors.
 */
function computeBarycenter(node, graphData) {
    const neighbors = [...node.superconcepts, ...node.subconcepts];

    // Map neighbors to their x positions
    const neighborPositions = neighbors
        .map((neighbor) => {
            const neighborNode = graphData.nodes.find((n) => n.id === neighbor.id);
            return neighborNode ? neighborNode.x : undefined; // Undefined if not found
        })
        .filter((x) => x !== undefined); // Filter out undefined values

    // Return 0 if no valid neighbors
    if (neighborPositions.length === 0) return 0;

    // Compute and return average x position (barycenter)
    return neighborPositions.reduce((sum, x) => sum + x, 0) / neighborPositions.length;
}

//src/core/lattice.js

/**
 * Creates a concept lattice based on the provided graph data.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} options - Configuration options for the graph.
 * @returns {Object} - The SVG and simulation instances for further use.
 */
function createLattice(graphData, options = {}) {
  //const { container = 'body', width = 800, height = 600 } = options;
  
  // Merge options with defaults from the config file
  const { container = 'body', width, height } = {
    ...GRAPH_CONFIG.dimensions,
    ...options,
};
   
  // Validate graph data
   if (!graphData || !graphData.nodes || !graphData.links) {
    throw new Error('⚠️Invalid graphData. Ensure it includes nodes and links.');
  }
  
  console.log("📌 Nodes before reduced labeling:", graphData.nodes);
  console.log("📌 Links before reduced labeling:", graphData.links);

    // Ensure nodes and links are valid before calling reduced labeling

    if (Array.isArray(graphData.nodes) && Array.isArray(graphData.links)) {
      computeReducedLabels$1(graphData.nodes, graphData.links);
  } else {
      console.error("❌ Nodes or links are not in array format!", graphData);
  }

  // ✅ Compute superconcepts and subconcepts before rendering
  computeSuperSubConcepts(graphData);

  console.log("📌 Assigning layers using the Coffman-Graham Algorithm...");
  const layers = assignLayers$1(graphData);
  graphData.layers = layers; // Add layers to graphData
  
  // Set y-coordinates for nodes based on their assigned layers
  const layerSpacing = height / (layers.length + 1);
  layers.forEach((layer, layerIndex) => {
      layer.forEach((node, nodeIndex) => {
          node.y = layerIndex * layerSpacing; // Assign vertical spacing based on layer index
          node.x = (nodeIndex + 1) * (width / (layer.length + 1)); // Horizontal spacing
          node.layer = layerIndex; // Add layer information for constraints
      });
  });

   /* Adjust top and bottom concepts to be centered horizontally
  const topConcept = graphData.nodes.find((node) => node.superconcepts.length === 0);
  const bottomConcept = graphData.nodes.find((node) => node.subconcepts.length === 0);

  if (topConcept) {
      topConcept.x = width / 2;
      console.log("📌 Top concept positioned at center:", topConcept.id);
  }

  if (bottomConcept) {
      bottomConcept.x = width / 2;
      console.log("📌 Bottom concept positioned at center:", bottomConcept.id);
  }
*/

  // Order nodes within layers to minimize edge crossings
  console.log("📌 Ordering nodes within layers...");
  orderVerticesWithinLayers(layers, graphData);
  
  // ✅ Compute reduced labels before rendering
  computeReducedLabels$1(graphData.nodes, graphData.links);

  // Calculate metrics and log them
  const metrics = calculateMetrics(graphData);
  console.log('Metrics:', metrics);

  // Update metrics in the DOM
  updateMetricsInDOM(metrics);

  // Update Filtering
  setupFilterControls(graphData);

   // Clear existing graph content before rendering the new graph
   const containerElement = select(container);
   containerElement.selectAll('svg').remove();
  
  // Render the graph using dynamic dimensions and get the SVG elements
  const { svg, linkGroup, nodeGroup, labelGroup } = renderGraph(container, graphData, { width, height });
  //const g = svg.select('.graph-transform'); // Select the `g` group
 
  /* Adjust the graph transform group for padding from config
  const padding =  GRAPH_CONFIG.dimensions.padding;
  svg
    .attr('width', GRAPH_CONFIG.dimensions.padding * 2) // Increase SVG width with dynamic padding
    .attr('height', GRAPH_CONFIG.dimensions.padding * 2); // Increase SVG height with dynamic padding

  // Adjust the translation of the graph transform group
  const g = svg.select('.graph-transform');
  g.attr('transform', `translate(${width / 2 + padding}, ${height / 2 + padding})`);
  */
  // Create the simulation and add interactivity
  const simulation = createSimulation(graphData, linkGroup, nodeGroup,labelGroup, { width, height });

  // Add interactivity after creating the simulation
  addInteractivity(svg, simulation);

  // Add node-specific interactivity (hover, click, shortest path, etc.)
  addNodeInteractivity(nodeGroup, linkGroup, graphData);

   /*Center graph dynamically after initial rendering
   centerGraph(svg,{width, height});
  */
 // Dynamically center the graph
 //const graphGroup = svg.select('.graph-transform');
 setTimeout(() => {
  const bbox = svg.select('.graph-transform').node().getBBox();
  centerGraph(svg, { width, height, padding: GRAPH_CONFIG.dimensions.padding, bbox });
 }, 100);

  // Add export options after rendering
  addExportOptions(graphData, svg.node());

  // Return the SVG, simulation and metrics for further use
  return { svg, simulation, metrics };
}


/**
 * Updates the metrics in the DOM.
 * @param {Object} metrics - The metrics to display.
 */
// Function to update metrics in the DOM
function updateMetricsInDOM(metrics) {
  // Update the total count of concepts, objects, and attributes in the UI
  document.getElementById('total-concepts').textContent = metrics.totalConcepts;
  document.getElementById('total-objects').textContent = metrics.totalObjects;
  document.getElementById('total-attributes').textContent = metrics.totalAttributes;
  document.getElementById('lattice-density').textContent = metrics.density;
  document.getElementById('lattice-stability').textContent = metrics.averageStability;
}


/**
 * Finds the shortest path between two nodes using Breadth-First Search (BFS).
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {string} startNodeId - ID of the starting node.
 * @param {string} endNodeId - ID of the ending node.
 * @returns {Array} - The shortest path as an array of node IDs, or an empty array if no path exists.
 */
function findShortestPath(graphData, startNodeId, endNodeId) {
  const adjacencyList = new Map();

  // Build adjacency list
  graphData.links.forEach((link) => {
    if (!adjacencyList.has(link.source.id)) adjacencyList.set(link.source.id, []);
    if (!adjacencyList.has(link.target.id)) adjacencyList.set(link.target.id, []);
    adjacencyList.get(link.source.id).push(link.target.id);
    adjacencyList.get(link.target.id).push(link.source.id);
  });

  // BFS setup
  const visited = new Set();
  const queue = [[startNodeId]];

  while (queue.length > 0) {
    const path = queue.shift();
    const currentNode = path[path.length - 1];

    // Return the path if the end node is reached
    if (currentNode === endNodeId) return path;

    if (!visited.has(currentNode)) {
      visited.add(currentNode);

      // Add unvisited neighbors to the queue
      const neighbors = adjacencyList.get(currentNode) || [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) queue.push([...path, neighbor]);
      });
    }
  }

  // Return an empty array if no path exists
  return [];
}

/**
 * Filters the lattice graph data based on the provided filter criteria.
 * 
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} filterCriteria - An object with `objectFilter` and `attributeFilter` arrays.
 * @returns {Object} - A filtered graph data object with updated nodes and links.
 */
function filterLattice(graphData, filterCriteria) {
  
  if (!graphData || !graphData.nodes || !graphData.links) {
    throw new Error('Invalid graphData: Ensure it includes nodes and links.');
  }
  // Destructure object and attribute filters from the filter criteria
  const { objectFilter, attributeFilter } = filterCriteria;

  console.log('Graph Data Before Filtering:', graphData); // Debugging log
  console.log('Filter Criteria:', filterCriteria); // Debugging log

   // Update node colors based on the filtering criteria
   graphData.nodes.forEach((node) => {
    const extentMatch = objectFilter
      ? objectFilter.some((obj) => node.label.includes(obj))
      : false;
    const intentMatch = attributeFilter
      ? attributeFilter.some((attr) => node.label.includes(attr))
      : false;

    // Set color based on matching extent or intent
    if (extentMatch && intentMatch) {
      node.color = 'orange'; // Highlight nodes matching both criteria
    } else if (extentMatch) {
      node.color = 'green'; // Highlight nodes matching extent
    } else if (intentMatch) {
      node.color = 'gray'; // Highlight nodes matching intent
    } else {
      node.color = 'blue'; // Default color for nodes not matching
    }
  });

  // Filter the nodes based on the extent (objects) and intent (attributes)
  const filteredNodes = graphData.nodes.filter((node) => {
    // Check if the node's extent matches all specified object filters
    objectFilter
      ? objectFilter.every(obj => node.label.includes(obj)) // Ensure every object in the filter is present in the node's label
      : true; // If no filter is provided, allow all nodes
    
    // Check if the node's intent matches all specified attribute filters
    attributeFilter
      ? attributeFilter.every(attr => node.label.includes(attr)) // Ensure every attribute in the filter is present in the node's label
      : true; // If no filter is provided, allow all nodes
    
    /* Include the node only if it matches both the extent and intent filters
    return extentMatch && intentMatch;
    */
   
   // Keep all nodes and links
  return { nodes: graphData.nodes, links: graphData.links };
  });

  // Create a set of IDs for the filtered nodes for easy lookup
  const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

  // Filter the links to include only those that connect filtered nodes
  const filteredLinks = graphData.links.filter(
    link =>
      filteredNodeIds.has(link.source.id) && // Check if the source node is in the filtered set
      filteredNodeIds.has(link.target.id)   // Check if the target node is in the filtered set
  );
  
  console.log('Filtered Nodes:', filteredNodes); // Debugging log
  console.log('Filtered Links:', filteredLinks); // Debugging log
  
  // Return the filtered graph data with updated nodes and links
  return { nodes: filteredNodes, links: filteredLinks };
}

// src/core/latticeParser.js

/**
 * Parses the SERIALIZED data into a format suitable for visualization.
 * Converts serialized lattice data into `nodes` and `links` with labels, levels, and all neighbor links.
 * 
 * @param {Object} serialized - The serialized lattice data.
 * @returns {Object} Parsed data with nodes and links.
 */
function parseSerialized(serialized) {
    const objects = serialized.objects || [];
    const properties = serialized.properties || [];
    const context = serialized.context || [];
    const lattice = serialized.lattice || [];

    // Helper to create labels for nodes
    const createLabel = (extents, intents) => {
        const extentLabels = extents.map((index) => objects[index] || 'Unknown').join(', ');
        const intentLabels = intents.map((index) => properties[index] || 'Unknown').join(', ');
        return `Extent\n{${extentLabels}}\nIntent\n{${intentLabels}}`;
    };

    // Parse nodes
    const nodes = lattice.map((latticeNode, index) => {
        const [extents, intents, upperNeighbors] = latticeNode;
        const label = createLabel(extents, intents);
        //const level = latticeNode[2]?.length || 0; // Use the size of upper neighbors as the level
        const level = upperNeighbors.length; // Use the number of upper neighbors to calculate the level
        return {
            id: index + 1, // Unique ID for the node starting from 1
            label,
            level,
        };
    });

    // Parse links
    const links = [];
    lattice.forEach((latticeNode, sourceIndex) => {
        const [_, __, upperNeighbors, lowerNeighbors] = latticeNode;

        // Add links to upper neighbors
        upperNeighbors.forEach((upperIndex) => {
            links.push({
                source: sourceIndex + 1, // Adjust for 1-based indexing
                target: upperIndex + 1, // Adjust for 1-based indexing
            });
        });

        // Add links to lower neighbors
        lowerNeighbors.forEach((lowerIndex) => {
            links.push({
                source: lowerIndex + 1, // Adjust for 1-based indexing
                target: sourceIndex + 1, // Adjust for 1-based indexing
            });
        });
    });

    // Return parsed data
    return { nodes, links, context };
}

/*
/**
 * Load serialized data from a file, parse it, and save the parsed output.
 * @param {string} inputFilePath - Path to the input file with serialized data.
 * @param {string} outputBasePath - Base path to save the parsed data.
 */
/*
function processSerializedFile(inputFilePath, outputBasePath) {
    // Ensure input file exists
    if (!fs.existsSync(inputFilePath)) {
        console.error(`Input file not found: ${inputFilePath}`);
        return;
    }

    // Read serialized data from file
    const serializedData = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));

    // Parse the serialized data
    const parsedData = parseSerialized(serializedData);

    // Create a new folder under the output base path
    const folderName = `lattice_${Date.now()}`; // Use a timestamp for unique folder name
    const outputFolder = path.join(outputBasePath, folderName);

    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    // Save the parsed data as a JSON file
    const outputFilePath = path.join(outputFolder, 'parsedLattice.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(parsedData, null, 2));
    console.log(`Parsed data saved to: ${outputFilePath}`);
}

// Example usage
const inputFilePath = path.join('input', 'bob-ros.json'); // Path to the input file
const outputBasePath = 'data'; // Base path for the parsed output

processSerializedFile(inputFilePath, outputBasePath);
*/

// src/features/fileUpload.js

/**
 * Sets up file upload handling and triggers concept lattice generation upon user interaction.
 */

function setupFileUpload() {

    console.log("Initializing file upload setup...");

    // Get references to the file input, compute button, and results container from the DOM
    const fileInput = document.getElementById('file-upload');
    const loadButton = document.getElementById('load-json-file');
    const computeButton = document.getElementById('compute-canonical-base');
    const resultsContainer = document.getElementById('results');
    const convertButton = document.getElementById("convert-and-download");



     // Debug: Log what elements exist
     console.log("🔍 Checking DOM elements...");
     console.log("📂 fileInput:", fileInput);
     console.log("📂 loadButton:", loadButton);
     console.log("📂 computeButton:", computeButton);
     console.log("📂 resultsContainer:", resultsContainer);
     console.log("📂 convertButton:", convertButton);

     // Debug: Log elements
    console.log("🔍 Checking DOM elements before setup...", {
        fileInput, loadButton, computeButton, resultsContainer
    });

    // Validate elements
    if (!fileInput || !loadButton || !computeButton || !resultsContainer || !convertButton) {
        console.error('File upload elements are missing in the DOM.');
        return;
    }

    console.log("✅ File upload elements exist. Running `setupFileUpload()` now...");

    let uploadedData = null; // Variable to store the uploaded JSON file data

    // File selection event
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0]; // Get the selected file

        // Check if a file was selected
        if (!file) {
            console.warn("⚠️ No file selected. Waiting for a valid upload.");
            return;
        }

        console.log("📂 File selected:", file.name);

        const reader = new FileReader(); // Create a FileReader to read the file

        /**
         * Parses the JSON content from the uploaded file.
         * @param {ProgressEvent} event - The file read event containing the JSON data.
         */
        reader.onload = (event) => {
            try {
                // Parse the uploaded JSON file and store it
                uploadedData = JSON.parse(event.target.result);
                console.log('📂 Successfully loaded JSON Data:', uploadedData);
                
            } catch (error) {
                console.error('Error processing JSON file:', error);
                alert('Invalid JSON file. Please check your file.');
                uploadedData = null; // Reset the data in case of an error
            }
        };

        reader.readAsText(file); // Read the file as text
    });

    // When "Load JSON File" is clicked, process the file
    loadButton.addEventListener("click", () => {
        if (!uploadedData) {
            console.warn("⚠️ No file uploaded. Cannot proceed.");
            alert("⚠️ Please upload a JSON file first.");
            return;
        }

        console.log("📊 Computing metrics and visualizing lattice...");

        // Compute metrics and display metrics
        const metrics = calculateMetrics(uploadedData);
    
        // Update metrics in UI
        document.getElementById('total-concepts').textContent = metrics.totalConcepts;
        document.getElementById('total-objects').textContent = metrics.totalObjects;
        document.getElementById('total-attributes').textContent = metrics.totalAttributes;

        // Visualize lattice immediately after clicking load
        createLattice(uploadedData, { container: "#graph-container" });

        // Setup filters
        setupFilterControls(uploadedData);
    });


    /**
     * Handles the Compute button click event to process the uploaded data.
     */
    computeButton.addEventListener('click', () => {
        
       // const file = fileInput.files[0];

       // Ensure that a file has been uploaded before computing
       if (!uploadedData) {
        console.warn("⚠️ No file uploaded. Cannot compute canonical base.");
        alert('⚠️ Please upload a JSON file first.');
        return;
    }

    try {
        /**
         * Extracts concepts from the uploaded JSON data.
         * @returns {Array} List of extracted concepts (each with extent and intent).
         */
        const concepts = extractConceptsFromGraph(uploadedData);
        console.log('Extracted Concepts:', concepts);

        /**
         * Computes the canonical base (implication rules) for the extracted concepts.
         * @returns {Array} List of implications, each with a premise and conclusion.
         */
        const canonicalBase = computeCanonicalBase(concepts);
        console.log('Computed Canonical Base:', canonicalBase);
        

        /**
         * Displays the computed canonical base in the results section.
         * @param {Array} canonicalBase - The computed implications to display.
         */
        resultsContainer.textContent = JSON.stringify(canonicalBase, null, 2);

    } catch (error) {
        console.error('❌Error computing canonical base:', error);
        alert('❌Error in computation. Please check your file format.');
    }
});

// Convert and Download button click event
convertButton.addEventListener("click", () => {
    if (!uploadedData) {
      console.warn("⚠️ No file uploaded. Cannot proceed with conversion.");
      alert("⚠️ Please upload a JSON file first.");
      return;
    }

    try {
      const parsedData = parseSerialized(uploadedData);

      // Trigger download for parsed data
      const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'parsedLattice.json';
      downloadLink.click();
      URL.revokeObjectURL(downloadLink.href);

      console.log('✅ Parsed data downloaded successfully.');
    } catch (error) {
      console.error('❌ Error converting the file:', error);
      alert('❌ Conversion failed. Please ensure the file format is correct.');
    }
  });
        /*const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const graphData = JSON.parse(event.target.result);
                console.log('Graph Data:', graphData);

                // Additional logic for processing the uploaded file
            } catch (error) {
                console.error('Error reading or processing file:', error);
                alert('Invalid JSON file.');
            }
        };

        reader.readAsText(file);
    });*/


}

// src/index.js 

let originalGraphData = null; // Store uploaded dataset for later processing (ex. filtering)

/**
 * Handles dataset visualization after file upload or predefined dataset.
 * @param {Object} jsonData - The parsed JSON graph data.
 */

function visualizeDataset(jsonData) {
  try {
     console.log('Loaded dataset:', jsonData);

     if (!jsonData || !jsonData.nodes || !jsonData.links) {
      console.error("❌ visualizeDataset: Invalid dataset structure!", jsonData);
      alert("Error: Dataset structure is invalid.");
      return;
  }

     originalGraphData = jsonData; // Store dataset for filtering.

     // Ensure each node has a valid extent/intent
     jsonData.nodes.forEach(node => {
      const parsed = parseNodeLabel(node);
      node.extent = parsed.extent;
      node.intent = parsed.intent;

      // Debugging: Log each node after parsing
      console.log(`🔍 Node ${node.id} Parsed Label:`, node.label, "| Extent:", node.extent, "| Intent:", node.intent);

  });

     // Compute Superconcepts and Subconcepts first
     console.log("📌 Computing superconcepts and subconcepts...");
     computeSuperSubConcepts(jsonData);

      // Assign layers to nodes
      console.log("📌 Assigning layers...");
      const layers = assignLayers(jsonData);
      jsonData.layers = layers;

      // Compute reduced labels after ensuring relationships
      console.log("📌 Computing reduced labels...");   
      computeReducedLabels(jsonData.nodes, jsonData.links);

      // Create the concept lattice visualization
      createLattice(jsonData, { container: '#graph-container' });

      // Compute and display metrics
      const metrics = calculateMetrics(jsonData);
      document.getElementById('total-concepts').textContent = metrics.totalConcepts;
      document.getElementById('total-objects').textContent = metrics.totalObjects;
      document.getElementById('total-attributes').textContent = metrics.totalAttributes;

      // Set up legend and filtering controls after visualization
      updateLegend();
      setupFilterControls(originalGraphData);

  } catch (err) {
      console.error('Error visualizing dataset:', err);
      alert('❌ Error processing dataset. Please check the uploaded file.');
  }
}

/**
* Checks if a dataset is provided via `data-dataset` in `index.html`.
* If provided, loads it automatically.
*/
function checkForPreloadedDataset() {
  // Get the dataset path from the script tag's data-dataset attribute
  const scriptTag = document.querySelector('script[data-dataset]');
  const datasetPath = scriptTag?.getAttribute('data-dataset');
 
// Ensure dataset path is provided
  if (datasetPath) {
    console.error('Preloading dataset from: ${datasetPath}');
 

  // Fetch graph data from the specified JSON file
  fetch(datasetPath)
    .then(response => {
     // Check if the response is valid
     if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }
    return response.json() // Parse JSON data
  })
  .then((data) => 
    {
      visualizeDataset(data); // Load dataset into visualization
  })
  .catch((err) => {
    console.error('Error loading preloaded dataset:', err);
});

} else {
  console.log("No predefined dataset found. Waiting for file upload.");
}
}


/**
 * Initializes the application on DOM load.
 */
document.addEventListener('DOMContentLoaded', () => {
  
  console.log("📌 DOM fully loaded.");

  // First check if a dataset exists in `index.html`
  checkForPreloadedDataset(); 

  setTimeout(() => {
    console.log("🔍 Checking for file upload elements before setup...");
    setupFileUpload(); // Ensure DOM elements exist before setup
}, 500);
  console.log("✅ Initializing file upload...");

  setupFileUpload(); // Enable file upload functionality. Runs only when the DOM is ready
 
  // Labeling mode change handler
  const labelModeSelector = document.getElementById('labeling-mode');
  if (labelModeSelector) {
      labelModeSelector.addEventListener('change', () => {
          const selectedMode = labelModeSelector.value;
          console.log(`🔄 Switching Labeling Mode to: ${selectedMode}`);
          
          // Ensure nodes and labels exist before updating
          const svg = select('svg');
          const labelGroup = svg.selectAll('.node-label');
          if (!labelGroup.empty()) {
              updateLabels(selectedMode, labelGroup);
          }
      });
  }
  /*
  waitForElement('#file-upload', () => {
    console.log("✅ File upload elements exist. Running `setupFileUpload()` now...");
    setupFileUpload();
  });
  */
});
