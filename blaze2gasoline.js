var htmlparser = require("htmlparser");
var acorn = require("acorn");
var gasoline = require("gasoline-turbo");

var hasSpace = /\s/
var hasSeparator = /[\W_]/
var hasCamel = /([a-z][A-Z]|[A-Z][a-z])/

/**
 * Remove any starting case from a `string`, like camel or snake, but keep
 * spaces and punctuation that may be important otherwise.
 *
 * @param {String} string
 * @return {String}
 */

var toNoCase = function(string) {
  if (hasSpace.test(string)) return string.toLowerCase();
  if (hasSeparator.test(string)) return (unseparate(string) || string).toLowerCase();
  if (hasCamel.test(string)) return uncamelize(string).toLowerCase();
  return string.toLowerCase();
};

/**
 * Separator splitter.
 */

var separatorSplitter = /[\W_]+(.|$)/g

/**
 * Un-separate a `string`.
 *
 * @param {String} string
 * @return {String}
 */

function unseparate(string) {
  return string.replace(separatorSplitter, function (m, next) {
    return next ? ' ' + next : '';
  });
}

/**
 * Camelcase splitter.
 */

var camelSplitter = /(.)([A-Z]+)/g

/**
 * Un-camelcase a `string`.
 *
 * @param {String} string
 * @return {String}
 */

function uncamelize(string) {
  return string.replace(camelSplitter, function (m, previous, uppers) {
    return previous + ' ' + uppers.toLowerCase().split('').join(' ');
  });
}

var toSpaceCase = function(string) {
  return toNoCase(string).replace(/[\W_]+(.|$)/g, function (matches, match) {
    return match ? ' ' + match : '';
  }).trim();
};

var toCamelCase = function(string) {
  return toSpaceCase(string).replace(/\s(\w)/g, function (matches, letter) {
    return letter.toUpperCase();
  });
};

var toSnakeCase = function(string) {
  return toSpaceCase(string).replace(/\s/g, '_');
};

var toKebabCase = function(string) {
  return toSpaceCase(string).replace(/\s/g, '-');
};

var toTitleCase = function(string) {
  var str = toSpaceCase(string).replace(/\s(\w)/g, function(matches, letter) {
    return " " + letter.toUpperCase();
  });

  if(str) {
    str = str.charAt(0).toUpperCase() + str.slice(1);
  }
  return str;
};

var blaze2gasoline = function(html, js) {
	// inclusion
	var tags = html.match(/{{>(.*?)}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("<INCLUSION " + tag.substring(3).slice(0, -2) + " />");
		});
	}

	// raw html
	tags = html.match(/{{{(.*?)}}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("<HELPER-RAW " + tag.substring(3).slice(0, -3) + " />");
		});
	}

	// condition
	tags = html.match(/{{#if(.*?)}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("<CONDITION " + tag.substring(5).slice(0, -2) + ">");
		});
	}
	tags = html.match(/{{#unless(.*?)}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("<CONDITION INVERTED " + tag.substring(5).slice(0, -2) + ">");
		});
	}
	tags = html.match(/{{else}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("<CONDITION /><CONDITION>");
		});
	}
	tags = html.match(/{{\/if}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("</CONDITION>");
		});
	}

	// loop
	tags = html.match(/{{#each(.*?)}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("<LOOP " + tag.substring(7).slice(0, -2) + ">");
		});
	}
	tags = html.match(/{{\/each}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("</LOOP>");
		});
	}

	// block
	tags = html.match(/{{#(.*?)}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("<BLOCK " + tag.substring(3).slice(0, -2) + ">");
		});
	}
	tags = html.match(/{{\/(.*?)}}/g);
	if(tags) {
		tags.map(function(tag) {
			html = html.split(tag).join("</BLOCK " + tag.substring(3).slice(0, -2) + ">");
		});
	}

	var gas = { templates: [], naked: { children: [] } };
	dom2gas = function(dom, gasObject) {
		if(!dom) {
			return;
		}

		dom.map(function(node, nodeIndex) {
			var gasNode = null;
			switch(node.type) {
				case "tag": {

					switch(node.name) {
						case "template": {
							var template = {};
							template.type = "template";
							template.name = (node.attribs && node.attribs["name"]) ? node.attribs["name"] : "TEMPLATE_NAME";
							template.children = [];
							gas.templates.push(template);
							gasNode = template;
						}; break;
						case "CONDITION": {
							if(node.attribs) {
								var element = {};
								element.type = "condition";
								element.condition = "";
								var inverted = false;
								for(var attrName in node.attribs) {
									if(attrName == "INVERTED") {
										inverted = true;
									} else {
										if(element.condition) {
											element.condition += " ";
										}
										element.condition += attrName;
										if(node.attribs[attrName] && node.attribs[attrName] != attrName) {
											element.condition += "=" + node.attribs[attrName];
										}
									}
								}
								element.children = [];

								var conditionTrue = {
									type: "condition-true",
									children: []
								};

								var conditionFalse = {
									type: "condition-false",
									children: []
								};

								if(inverted) {
									conditionTrue.type = "condition-false";
									conditionFalse.type = "condition-true";

									element.children.push(conditionFalse);
									element.children.push(conditionTrue);
								} else {
									element.children.push(conditionTrue);
									element.children.push(conditionFalse);									
								}

								gasObject.children.push(element);
								gasNode = conditionTrue;

								if(dom[nodeIndex + 1]) {
									var nextNode = dom[nodeIndex + 1];
									if(nextNode.type == "tag" && nextNode.name == "CONDITION" && !nextNode.attribs) {
										if(nextNode.children) {
											dom2gas(nextNode.children, conditionFalse);
										}
									}
								}
							}
						}; break;

						case "LOOP": {
							var element = {};
							element.type = "loop";
							element.dataset = "";
							if(node.attribs) {
								for(var attrName in node.attribs) {
									if(element.dataset) {
										element.dataset += " ";
									}
									element.dataset += attrName;
									if(node.attribs[attrName] && node.attribs[attrName] != attrName) {
										element.dataset += "=" + node.attribs[attrName];
									}
								}
							}
							element.children = [];

							gasObject.children.push(element);
							gasNode = element;
						}; break;

						case "INCLUSION": {
							var element = {};
							element.type = "inclusion";
							element.template = "";
							if(node.attribs) {
								for(var attrName in node.attribs) {
									if(element.template) {
										element.template += " ";
									}
									element.template += attrName;
									if(node.attribs[attrName] && node.attribs[attrName] != attrName) {
										element.template += "=" + node.attribs[attrName];
									}
								}
							}
							element.children = [];
							gasObject.children.push(element);
							gasNode = element;
						}; break;

						case "HELPER-HTML": {
							var element = {};
							element.type = "text";
							element.text = "";
							if(node.attribs) {
								for(var attrName in node.attribs) {
									if(element.text) {
										element.text += " ";
									}
									element.text += attrName;
									if(node.attribs[attrName] && node.attribs[attrName] != attrName) {
										element.text += "=" + node.attribs[attrName];
									}
								}
							}
							if(element.text) {
								element.text = "{{" + element.text + "}}";
							}
							element.children = [];
							gasObject.children.push(element);
							gasNode = element;
						}; break;

						default: {
							var element = {};
							element.type = "html";
							element.element = node.name;
							element.attributes = [];
							element.children = [];
							if(node.attribs) {
								for(var attrName in node.attribs) {
									element.attributes.push({
										name: attrName,
										value: node.attribs[attrName]
									});
								}
							}
							gasObject.children.push(element);
							gasNode = element;
						}
					}
					if(node.children) {
						dom2gas(node.children, gasNode || gas.naked);
					}
				}; break;
				case "text": {
					var element = {};
					element.type = "text";
					element.text = node.data;
					gasObject.children.push(element);
					gasNode = element;
				}; break;
			}
		});
	};

	var handler = new htmlparser.DefaultHandler(function (error, dom) {
		if (error) {
			console.log(error);
			process.exit(1);
		} else {
			dom2gas(dom, gas.naked);
		}
	}, {
		ignoreWhitespace: true,
		enforceEmptyTags: true
	});

	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(html);

	var isObject = function(val) {
		return val != null && typeof val === 'object' && Array.isArray(val) === false;
	};

	var estreeExtract = function(templateName, estree, res) {
		if(!isObject(estree)) {
			return null;
		}

		if(
			estree.type == "ExpressionStatement" && 
			estree.expression && 
			estree.expression.callee && 
			estree.expression.callee.object && 
			estree.expression.callee.object.object && 
			estree.expression.callee.object.property && 
			estree.expression.callee.object.object.name == "Template" && 
			estree.expression.callee.object.property.name == templateName && 
			estree.expression.callee.property.name == "events"
		) {
			res.events = res.events || [];
			if(estree.expression.arguments && estree.expression.arguments.length && estree.expression.arguments[0].properties) {
				estree.expression.arguments[0].properties.map(function(evt) {
					if(evt.key && evt.value && evt.value.body) {
						res.events.push({
							event: evt.key.value || evt.key.name,
							code: js.substring(evt.value.body.start + 1, evt.value.body.end - 1)
						});
					}
				});
			}
		}

		if(
			estree.type == "ExpressionStatement" && 
			estree.expression && 
			estree.expression.callee && 
			estree.expression.callee.object && 
			estree.expression.callee.object.object && 
			estree.expression.callee.object.property && 
			estree.expression.callee.object.object.name == "Template" && 
			estree.expression.callee.object.property.name == templateName && 
			estree.expression.callee.property.name == "helpers"
		) {
			res.helpers = res.helpers || [];
			if(estree.expression.arguments && estree.expression.arguments.length && estree.expression.arguments[0].properties) {
				estree.expression.arguments[0].properties.map(function(evt) {
					if(evt.key && evt.value && evt.value.body) {
						var helper = {};
						helper.name = evt.key.value || evt.key.name;
						helper.arguments = [];
						if(evt.value.params) {
							evt.value.params.map(function(param) {
								helper.arguments.push(param.name);
							});
						}
						helper.code = js.substring(evt.value.body.start + 1, evt.value.body.end - 1);
						res.helpers.push(helper);
					}
				});
			}
		}

		for(var prop in estree) {
			if(Array.isArray(estree[prop])) {
				var len = estree[prop].length;
				for(var ndx = 0; ndx < len; ndx++) {
					if(isObject(estree[prop][ndx])) {
						estreeExtract(templateName, estree[prop][ndx], res);
					}
				}
			} else {
				if(isObject(estree[prop])) {
					estreeExtract(templateName, estree[prop], res);
				}
			}
		}
	};


	// parse js
	js = js ? js.trim() : "";

	if(js) {
		var estree = acorn.parse(js, { sourceType: "module" });

		gas.templates.map(function(template) {
			var code = {
				events: [],
				helpers: []
			};

			estreeExtract(template.name, estree, code);

			template.helpers = template.helpers || [];
			code.helpers.map(function(helper) {
				template.helpers.push({
					type: "helper",
					name: helper.name,
					arguments: helper.arguments,
					code: helper.code
				});
			});

			template.handlers = template.handlers || [];
			code.events.map(function(event) {
				var handlerName = "";
				var map = event.event.split(",");
				map.map(function(tmp) {
					var m = tmp.split(" ");
					var dx = 0;
					var eventName = "";
					var eventSelector = "";
					for(var i = 0; i < m.length; i++) {
						if(m[i].trim()) {
							if(dx == 0) {
								eventName = m[i].trim().toLowerCase();
								dx++;
							} else {
								if(dx == 1) {
									eventSelector = m[i].trim();
									dx++;
								}
							}
						}
					}

					if(eventName && eventSelector) {
						if(!handlerName) {
							handlerName = toCamelCase("on-" + eventName + "-" + eventSelector);
						}

						template.handlers.push({
							type: "handler",
							name: handlerName,
							code: event.code
						});

						var selectedObjects = gasoline.findObjectsBySelector(gas, eventSelector);
						if(selectedObjects) {
							selectedObjects.map(function(selectedObject) {
								selectedObject.events = selectedObject.events || [];
								selectedObject.events.push({
									type: "event",
									event: "on" + eventName,
									handler: handlerName
								});
							});
						}
					}
				});
			});
		});
	}

	return gas;
};

if(typeof module != "undefined" && module.exports) {
  module.exports.blaze2gasoline = blaze2gasoline;
} else {
	this.blaze2gasoline = blaze2gasoline;
}
