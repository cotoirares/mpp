// This is a shim for the debug module
// It handles the case where ./common is not found
module.exports = function debug() {
  return function() {};
};
module.exports.default = module.exports;
module.exports.formatters = {};
module.exports.enable = function() {};
module.exports.disable = function() {};
module.exports.enabled = function() { return false; }; 