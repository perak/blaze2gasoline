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


if(typeof module != "undefined" && module.exports) {
  exports.toCamelCase = toCamelCase;
}
