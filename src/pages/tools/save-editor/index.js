(function () {
var tree = document.getElementById("tree");

function $$(tagName, attrs, children) {
	var el = document.createElement(tagName);
	if(attrs) {
		for(const attr in attrs) {
			var value = attrs[attr];
			if(attr == "className") {
				var classes = value.split(" ");
				for(const className of classes) {
					el.classList.add(className);
				}
			} else {
				if(typeof value == "function") {
					el[attr] = value;
				} else {
					el.setAttribute(attr, attrs[attr]);
				}
			}
		}
	}
	if(children) {
		for(let child of children) {
			if(typeof child == "string") {
				child = document.createTextNode(child);
			}
			el.appendChild(child);
		}
	}
	return el;
}

var dropzone = document.getElementById("dropzone");
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
	dropzone.addEventListener(eventName, preventDefaults, false);
	document.body.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
	dropzone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop', "dragend"].forEach(eventName => {
	dropzone.addEventListener(eventName, unhighlight, false);
});

dropzone.addEventListener('drop', handleDrop, false);

function preventDefaults(e) {
	e.preventDefault();
	e.stopPropagation();
}

var highlightTimeout = null;

function highlight() {
	dropzone.classList.add('highlight');
	clearTimeout(highlightTimeout);
	highlightTimeout = setTimeout(() => {
		unhighlight();
	}, 1000);
}

function unhighlight() {
	dropzone.classList.remove('highlight');
}

function handleDrop(e) {
	var dt = e.dataTransfer;
	var files = dt.files;
	handleFiles(files);
}

function handleFiles(files) {
	var filename = "No file chosen";
	var fileArray = Array.from(files);
	if(fileArray.length > 0) {
		var files = fileArray;
		if(files.length > 0) {
			var file = files[0];
			// filename = file.name;
			// lastFile = file;
			var reader = new FileReader();
			reader.onload = function(e) {
				console.log("Loaded file " + file.name);
				//output.value = e.target.result;
				loadSaveFile(e.target.result);
			};
			reader.readAsText(file);
		}
	}
	//fileNameDisplay.textContent = filename;
}

/*app.appendChild($("div", null, [
	$("div", null, [
		$("button", {
			onclick: () => {
				alert("Not implemented yet");
			}
		}, ["Load"]),
		$("button", {
			onclick: () => {
				alert("Not implemented yet");
			}
		}, ["Save"])
	])
]));*/

function substr(s,pos,len) {
	if(len == null) {
		len = s.length;
	} else if(len < 0) {
		if(pos == 0) {
			len = s.length + len;
		} else {
			return "";
		}
	}
	return s.substr(pos,len);
}

function fastCharCodeAt(s, pos) {
	return s.charCodeAt(pos);
}

class EnumInfo {
	constructor(edecl, tag, args=null) {
		this.args = args;
		this.edecl = edecl;
		this.tag = tag;
	}
}

class Unserializer {
	static BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%:";

	static CODES = null;

	static initCodes() {
		var codes = [];
		for(var i = 0; i < BASE64.length; i++) {
			codes[BASE64.charCodeAt(i)] = i;
		}
		return codes;
	}

	constructor(buf) {
		this.buf = buf;
		this.length = this.buf.length;
		this.pos = 0;
		this.upos = 0;
		this.scache = [];
		this.cache = [];
	}

	get(p) {
		return this.buf.charCodeAt(p);
	}

	getC(p) {
		return this.buf.charAt(p);
	}

	readDigits() {
		var k = 0;
		var s = false;
		var fpos = this.pos;
		while (true) {
			var c = this.get(this.pos);
			if (c !== c)
				break;
			if (c === 45) { // -
				if (this.pos != fpos)
					break;
				s = true;
				this.pos++;
				continue;
			}
			if (c < 48 || c > 57) // 0-9
				break;
			k = k * 10 + (c - 48); // 0
			this.pos++;
		}
		if (s)
			k *= -1;
		return k;
	}

	readFloat() {
		var p1 = this.pos;
		while (true) {
			var c = this.get(this.pos);
			if (c !== c)
				break;
			// + - . , 0-9
			//if ((c >= 43 && c < 58) || c == "e".code || c == "E".code)
			if ((c >= 43 && c < 58) || c === 101 || c === 69)
				this.pos++;
			else
				break;
		}
		return parseFloat(substr(this.buf, p1, this.pos - p1));
	}

	unserializeObject(o) {
		while (true) {
			if (this.pos >= this.length)
				throw "Invalid object";
			if (this.getC(this.pos) === "g")
				break;
			var k = this.unserialize();
			if (typeof k !== "string")
				throw "Invalid object key";
			var v = this.unserialize();
			o[k] = v;
			//Reflect.setField(o, k, v);
		}
		this.pos++;
	}

	unserializeEnum(edecl, tag) {
		if (this.getC(this.pos++) !== ":")
			throw "Invalid enum format";
		var nargs = this.readDigits();
		if (nargs == 0)
			return new EnumInfo(edecl, tag);
		var args = new Array();
		while (nargs-- > 0)
			args.push(this.unserialize());
		return new EnumInfo(edecl, tag, args);
	}

	unserialize() {
		var char = this.getC(this.pos++);
		switch (char) {
			case "n":
				return null;
			case "t":
				return true;
			case "f":
				return false;
			case "z":
				return 0;
			case "i":
				return this.readDigits();
			case "d":
				return this.readFloat();
			case "y":
				var len = this.readDigits();
				if (this.getC(this.pos++) !== ":" || this.length - this.pos < len)
					throw "Invalid string length";
				var s = substr(this.buf, this.pos, len);
				this.pos += len;
				s = decodeURIComponent(s.split("+").join(" "));
				this.scache.push(s);
				return s;
			case "k":
				return NaN;
			case "m":
				return -Infinity;
			case "p":
				return +Infinity;
			case "a":
				var buf = this.buf;
				var a = new Array();
				this.cache.push(a);
				while (true) {
					var c = this.getC(this.pos);
					if (c === "h") {
						this.pos++;
						break;
					}
					if (c === "u") {
						this.pos++;
						var n = this.readDigits();
						a[a.length + n - 1] = null;
					} else
						a.push(this.unserialize());
				}
				return a;
			case "o":
				var o = {};
				this.cache.push(o);
				this.unserializeObject(o);
				return o;
			case "r":
				var n = this.readDigits();
				if (n < 0 || n >= this.cache.length)
					throw "Invalid reference";
				return this.cache[n];
			case "R":
				var n = this.readDigits();
				if (n < 0 || n >= this.scache.length)
					throw "Invalid string reference";
				return this.scache[n];
			case "x":
				return new ExceptionData(this.unserialize());
			case "c":
				var name = this.unserialize();
				var o = {};
				var cl = new ClassData(name, o);
				this.cache.push(o);
				this.unserializeObject(o);
				return cl;
				/*var cl = resolver.resolveClass(name);
				if (cl == null)
					throw "Class not found " + name;
				var o = Type.createEmptyInstance(cl);
				cache.push(o);
				unserializeObject(o);
				return o;*/

			case "w":
				var name = this.unserialize();
				/*var edecl = resolver.resolveEnum(name);
				if (edecl == null)
					throw "Enum not found " + name;
				var e = unserializeEnum(edecl, unserialize());
				cache.push(e);
				return e;*/

				var e = this.unserializeEnum(name, this.unserialize());
				this.cache.push(e);
				return e;
			case "j":
				/*var name = unserialize();
				var edecl = resolver.resolveEnum(name);
				if (edecl == null)
					throw "Enum not found " + name;
				pos++; // skip ':'
				var index = readDigits();
				var tag = Type.getEnumConstructs(edecl)[index];
				if (tag == null)
					throw "Unknown enum index " + name + "@" + index;
				var e = unserializeEnum(edecl, tag);
				cache.push(e);
				return e;*/
				throw "Not implemented (j, enum)";
			case "l":
				var l = new List();
				this.cache.push(l);
				var buf = this.buf;
				while (this.getC(this.pos) !== "h")
					l.add(this.unserialize());
				this.pos++;
				return l;
			case "b":
				var h = new StringMap();
				this.cache.push(h);
				var buf = this.buf;
				while (this.getC(this.pos) !== "h") {
					var s = this.unserialize();
					h.set(s, this.unserialize());
				}
				this.pos++;
				return h;
			case "q":
				var h = new IntMap();
				this.cache.push(h);
				var buf = this.buf;
				var c = this.getC(this.pos++);
				while (c === ":") {
					var i = this.readDigits();
					h.set(i, this.unserialize());
					c = this.getC(this.pos++);
				}
				if (c != "h")
					throw "Invalid IntMap format";
				return h;
			case "M":
				var h = new ObjectMap();
				this.cache.push(h);
				var buf = this.buf;
				while (this.getC(this.pos) !== "h") {
					var s = this.unserialize();
					h.set(s, this.unserialize());
				}
				this.pos++;
				return h;
			case "v":
				var d;
				if (this.getC(this.pos) >= '0' && this.getC(this.pos) <= '9' && this.getC(this.pos + 1) >= '0' && this.getC(this.pos + 1) <= '9' && this.getC(this.pos + 2) >= '0'
					&& this.getC(this.pos + 2) <= '9' && this.getC(this.pos + 3) >= '0' && this.getC(this.pos + 3) <= '9' && this.getC(this.pos + 4) == '-') {
					// Included for backwards compatibility
					d = Date.fromString(buf.fastSubstr(this.pos, 19));
					this.pos += 19;
				} else
					d = Date.fromTime(this.readFloat());
				this.cache.push(d);
				return d;
			case "s":
				var len = this.readDigits();
				var buf = this.buf;
				if (this.getC(this.pos++) != ":" || this.length - this.pos < len)
					throw "Invalid bytes length";

				var codes = Unserializer.CODES;
				if (codes == null) {
					codes = initCodes();
					Unserializer.CODES = codes;
				}
				var i = this.pos;
				var rest = len & 3;
				var size = (len >> 2) * 3 + ((rest >= 2) ? rest - 1 : 0);
				var max = i + (len - rest);
				var bytes = haxe.io.Bytes.alloc(size);
				var bpos = 0;
				while (i < max) {
					var c1 = codes[fastCharCodeAt(buf, i++)];
					var c2 = codes[fastCharCodeAt(buf, i++)];
					bytes.set(bpos++, (c1 << 2) | (c2 >> 4));
					var c3 = codes[fastCharCodeAt(buf, i++)];
					bytes.set(bpos++, (c2 << 4) | (c3 >> 2));
					var c4 = codes[fastCharCodeAt(buf, i++)];
					bytes.set(bpos++, (c3 << 6) | c4);
				}
				if (rest >= 2) {
					var c1 = codes[fastCharCodeAt(buf, i++)];
					var c2 = codes[fastCharCodeAt(buf, i++)];
					bytes.set(bpos++, (c1 << 2) | (c2 >> 4));
					if (rest == 3) {
						var c3 = codes[fastCharCodeAt(buf, i++)];
						bytes.set(bpos++, (c2 << 4) | (c3 >> 2));
					}
				}
				this.pos += len;
				var ret = new BytesData(bytes);
				this.cache.push(ret);
				return ret;
			case "C":
				throw "Not implemented yet";
				//var name = unserialize();
				//var cl = resolver.resolveClass(name);
				//if (cl == null)
				//	throw "Class not found " + name;
				//var o = Type.createEmptyInstance(cl);
				//cache.push(o);
				//o.hxUnserialize(this);
				//if (getC(pos++) != "g")
				//	throw "Invalid custom data";
				//return o;
			case "A":
				var name = this.unserialize();
				//var cl = resolver.resolveClass(name);
				//if (cl == null)
				//	throw "Class not found " + name;
				return new ClassA(name);
			case "B":
				var name = this.unserialize();
				//var e = resolver.resolveEnum(name);
				//if (e == null)
				//	throw "Enum not found " + name;
				return new EnumB(name);
			default:
		}
		this.pos--;
		throw("Invalid char " + this.buf.charAt(this.pos) + " at position " + this.pos);
	}

	static run(v) {
		return new Unserializer(v).unserialize();
	}
}

class ClassA {
	constructor(name) {
		this.name = name;
	}
}

class EnumB {
	constructor(name) {
		this.name = name;
	}
}

class BytesData {
	constructor(data) {
		this.data = data;
	}
}

class ObjectMap {
	constructor() {
		this.map = Object.create(null);
	}

	get(key) {
		if(this.map.has(key)) {
			return this.map.get(key);
		}
		return null;
	}

	set(key, value) {
		this.map.set(key, value);
	}

	[Symbol.iterator]() {
		return this.map[Symbol.iterator]();
	}
}

class IntMap {
	constructor() {
		this.map = Object.create(null);
	}

	get(key) {
		if(this.map.has(key)) {
			return this.map.get(key);
		}
		return null;
	}

	set(key, value) {
		this.map.set(key, value);
	}

	[Symbol.iterator]() {
		return this.map[Symbol.iterator]();
	}
}

class StringMap {
	constructor() {
		this.map = Object.create(null);
	}

	set(key, value) {
		this.map[key] = value;
	}

	get(key) {
		return this.map[key];
	}

	[Symbol.iterator]() {
		return this.map[Symbol.iterator]();
	}
}

class List {
	constructor() {
		this.list = [];
	}

	add(value) {
		this.list.push(value);
	}

	[Symbol.iterator]() {
		return this.list[Symbol.iterator]();
	}
}


class ExceptionData {
	constructor(data) {
		this.data = data;
	}
}

class ClassData {
	constructor(name, data) {
		this.name = name;
		this.data = data;
	}
}

var $ = window.$; // JQuery

function loadSaveFile(data) {
	console.log(data);

	var data = Unserializer.run(data);

	console.log(data);

	generateTreeDom(data);
}

function generateTreeDom(data) {
	tree.innerHTML = "";
	var builtTree = generateTree(data);
	tree.appendChild(builtTree = $$("div", {}, [builtTree]));

	var btree = $(builtTree);
	btree.jstree({
		"core": {
			"themes": {
				//"dots": false,
				//"stripes": false
			}
		}, "plugins": ["sort"]
	});
	btree.on("changed.jstree", function (e, data) {
		console.log(data.selected);
	});
	// 8 interact with the tree - either way is OK
	$('button').on('click', function () {
		btree.jstree(true).select_node('child_node_1');
		btree.jstree('select_node', 'child_node_1');
		$.jstree.reference('#jstree').select_node('child_node_1');
	});
}

function generateTree(data) {
    var ul = document.createElement("ul");

    for (const key in data) {
        var li = document.createElement("li");

		var value = data[key];

		var bold = document.createElement("b");
		bold.appendChild(document.createTextNode(key));
		li.appendChild(bold);

        if (value instanceof StringMap) {
			li.appendChild(generateTree(value.map));
		} else if (value instanceof IntMap) {
			li.appendChild(generateTree(value.map));
		} else if (value instanceof ObjectMap) {
			li.appendChild(generateTree(value.map));
		} else if (value instanceof List) {
			li.appendChild(generateTree(value.list));
		} else if (value instanceof Array) {
			li.appendChild(document.createTextNode(": "));
			li.appendChild(document.createTextNode(value.length + " items"));
			li.appendChild(generateTree(value));
		} else if (value instanceof Object) {
            li.appendChild(generateTree(value));
        } else {
			li.appendChild(document.createTextNode(": "));
			if(typeof value == "string") {
				value = value.replaceAll("\n", "\\n");
				value = value.replaceAll("\r", "\\r");
				value = value.replaceAll("\t", "\\t");
				value = "\"" + value + "\"";
			} else if(typeof value == "number") {
				value = value.toString();
			} else if(typeof value == "boolean") {
				value = value.toString();
			}
			li.appendChild(document.createTextNode(value));
		}

        ul.appendChild(li);
    }

    return ul;
}

})();