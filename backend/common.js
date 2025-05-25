/**
 * This is a fallback implementation of the common.js file from the debug module
 * It's used when the original module fails to load
 */

exports.formatters = {};

/**
 * Map %j to `JSON.stringify()`, since no web browsers support
 * `console.log("%j", formatters.j)` yet.
 */
exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (error) {
    return '[UnexpectedJSONParseError]: ' + error.message;
  }
};

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */
exports.formatArgs = function(args) {
  return args;
};

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
exports.save = function(namespaces) {
  if (namespaces) {
    process.env.DEBUG = namespaces;
  } else {
    delete process.env.DEBUG;
  }
};

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
exports.load = function() {
  return process.env.DEBUG;
};

/**
 * Init logic for `debug` instances.
 *
 * @param {String} namespace
 * @api private
 */
exports.useColors = function() {
  return process.env.NODE_DISABLE_COLORS !== '1';
};

/**
 * Colors available.
 */
exports.colors = [6, 2, 3, 4, 5, 1];

// Setup the logger with a nice format
exports.formatters.O = function(v) {
  return JSON.stringify(v);
}; 