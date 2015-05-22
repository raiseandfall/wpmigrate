'use strict';

var shell = require('shelljs');
var fs = require('fs-extra');
var dateFormat = require('dateformat');
var _ = require('lodash');
var cli = require('cli');
var shelljs = require('shelljs');

var exports = {};


/**
 *
 * @param config
 * @param output_paths
 */
exports.db_dump = function(config, output_paths) {
  fs.mkdirsSync(output_paths.dir);

  var cmd = exports.mysqldump_cmd(config);
  var pre_output = shell.exec(cmd, {silent: true}).output;
  var output = exports.replace_urls('Warning: Using a password on the command line interface can be insecure.', ' ', pre_output);

  fs.outputFileSync(output_paths.file, output);

  cli.ok('Database DUMP successfully exported to: ' + output_paths.file);
};


/**
 *
 * @param config
 * @param src
 */
exports.db_import = function(config, src) {
  shell.exec(exports.mysql_cmd(config, src));
  cli.ok('Database imported successfully to', config.title);
};


/**
 *
 * @param target
 * @param options
 * @returns {{dir: string, file: string}}
 */
exports.generate_backup_paths = function(target, options) {
  var backup_dir = options['backup_dir'] || 'backups';

  var now = new Date();
  var directory = backup_dir + '/' + target + '/' + dateFormat(now, 'yyyy-mm-dd') + '/' + dateFormat(now, 'HH-MM-ss');
  var filepath = directory + '/db_backup.sql';

  return {
    dir: directory,
    file: filepath
  };
};


/**
 *
 * @param old_url
 * @param new_url
 * @param file
 */
exports.db_adapt = function(old_url, new_url, file) {
  console.log('Updating URLs from', old_url, 'to', new_url);

  var content = shelljs.cat(file);
  var output = exports.replace_urls(old_url, new_url, content);
  fs.outputFileSync(file, output);
};


/**
 *
 * @param search
 * @param replace
 * @param content
 * @returns {*}
 */
exports.replace_urls = function(search, replace, content) {
  content = exports.replace_urls_in_serialized(search, replace, content);
  content = exports.replace_urls_in_string(search, replace, content);

  return content;
};


/**
 *
 * @param search
 * @param replace
 * @param string
 * @returns {*}
 */
exports.replace_urls_in_serialized = function(search, replace, string) {
  var length_delta = search.length - replace.length;
  var search_regexp = new RegExp(search, 'g');

  // Replace for serialized data
  var matches, length, delimiter, old_serialized_data, target_string, new_url, occurences;
  var regexp = /s:(\d+):([\\]*[''])(.*?)\2;/g;

  while (matches = regexp.exec(string)) {
    old_serialized_data = matches[0];
    target_string = matches[3];

    // If the string contains the url make the substitution
    if (target_string.indexOf(search) !== -1) {
      occurences = target_string.match(search_regexp).length;
      length = matches[1];
      delimiter = matches[2];

      // Replace the url
      new_url = target_string.replace(search_regexp, replace);
      length -= length_delta * occurences;

      // Compose the new serialized data
      var new_serialized_data = 's:' + length + ':' + delimiter + new_url + delimiter + ';';

      // Replace the new serialized data into the dump
      string = string.replace(old_serialized_data, new_serialized_data);
    }
  }

  return string;
};


/**
 *
 * @param search
 * @param replace
 * @param string
 * @returns {XML|void|string}
 */
exports.replace_urls_in_string = function (search, replace, string) {
  var regexp = new RegExp('(?!' + replace + ')(' + search + ')', 'g');
  return string.replace(regexp, replace);
};


/**
 * Mysql Dump Command
 * @param config
 */
exports.mysqldump_cmd = function(config) {
  var cmd = exports.compileTpl(tpls.mysqldump, {
    user: config.user,
    pass: config.pass,
    database: config.database,
    host: config.host
  });

  if (typeof config.ssh_host === 'undefined') {
    console.log('Creating DUMP of ' + config.title + ' database');
  } else {
    console.log('Creating DUMP of ' + config.title + ' database');
    var tpl_ssh = exports.compileTpl(tpls.ssh, {
      host: config.ssh_host
    });
    cmd = tpl_ssh + " '" + cmd + "'";
  }

  return cmd;
};


/**
 *
 * @param config
 * @param src
 * @returns {*}
 */
exports.mysql_cmd = function(config, src) {
  var cmd = exports.compileTpl(tpls.mysql, {
    host: config.host,
    user: config.user,
    pass: config.pass,
    database: config.database
  });

  if (typeof config.ssh_host === 'undefined') {
    console.log('Importing DUMP into ' + config.title + ' database');
    cmd = cmd + ' < ' + src;
  } else {
    var tpl_ssh = exports.compileTpl(tpls.ssh, {
      host: config.ssh_host
    });

    console.log('Importing DUMP into ' + config.title + ' database');
    cmd = tpl_ssh + " '" + cmd + "' < " + src;
  }

  return cmd;
};


/**
 * Compiles template with lo-dash
 *
 * @param tpl
 * @param data
 * @returns {*}
 */
exports.compileTpl = function(tpl, data) {
  var compiled = _.template(tpl);
  return compiled(data);
};


var tpls = {
  backup_path: '<%= backups_dir %>/<%= env %>/<%= date %>/<%= time %>',
  mysqldump: 'mysqldump -h <%= host %> -u<%= user %> -p<%= pass %> <%= database %>',
  mysql: 'mysql -h <%= host %> -u <%= user %> -p<%= pass %> <%= database %>',
  ssh: 'ssh <%= host %>'
};


module.exports = exports;
