'use strict';

var util = require('./lib/util');
var path = require('path');
var shelljs = require('shelljs');
var cli = require('cli');
var exit = require('exit');
var stripJsonComments = require('strip-json-comments');


var configResults = {};


/**
 * Tries to find a configuration file named '.wprc'
 */
var findConfig = function() {
  var dir = path.dirname(path.resolve('.wprc'));
  var conf = findFile('.wprc', dir);

  if (conf) {
    return conf;
  }

  return null;
};


/**
 * Find file
 * @param name
 * @param cwd
 * @returns {*}
 */
var findFile = function(name, cwd) {
  cwd = cwd || process.cwd();

  var filename = path.normalize(path.join(cwd, name));

  if (configResults[filename] !== undefined) {
    return configResults[filename];
  }

  // Parent level
  var parent = path.resolve(cwd, "../");

  // If filename exists
  if (shelljs.test('-e', filename)) {
    configResults[filename] = filename;
    return filename;
  }

  // Check higher level
  return findFile(name, parent);
};


var exports = {

  /**
   * Returns configuration file or nothing if not found
   * @returns {*}
   */
  getConfig: function() {
    return exports.loadConfig(findConfig());
  },

  loadConfig: function(file) {
    if (!file) {
      return;
    }

    if (!shelljs.test("-e", file)) {
      cli.error("Cannot find config file: " + file);
      exports.exit(1);
    }

    try {
      var config = JSON.parse(stripJsonComments(shelljs.cat(file)));
      return config;
    } catch (err) {
      cli.error('Cannot parse config file: ' + file + '\nError:' + err);
      exit(1);
    }
  },

  push: function(flags) {

    var source = flags.from;
    var target = flags.to;

    // Check flags
    if (!source || !target) {
      throw new Error('flags `from` and `to` required');
    }

    // Get configurations
    var config = exports.getConfig();

    // Check environments
    if (!config.environments[source]) {
      cli.error('Source environment \''+source+'\' does not exist');
      exit(1);
    } else if (!config.environments[target]) {
      cli.error('Target environment \''+target+'\' does not exist');
      exit(1);
    }

    var options = config.options;
    var source_options = config.environments[source];
    var target_options = config.environments[target];

    // Generate backup directories and paths
    var source_backup_paths = util.generate_backup_paths(source, options);
    var target_backup_paths = util.generate_backup_paths(target, options);

    // Dump source DB
    util.db_dump(source_options, source_backup_paths);

    // Search and Replace database refs
    util.db_adapt(source_options.url, target_options.url, source_backup_paths.file);

    // Dump target DB
    util.db_dump(target_options, target_backup_paths);

    // Import dump to target DB
    util.db_import(target_options, source_backup_paths.file);
  }

};


module.exports = exports;
