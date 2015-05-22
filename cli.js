#! /usr/bin/env node

var meow = require('meow');
var wpmigrate = require('./');

var cli = meow({
  help: [
    'Usage',
    '  $ wpmigrate --from=<source> --to=<target>',
    '',
    'Example',
    '  $ wpmigrate --from=development --to=staging',
    ''
  ].join('\n')
}, {
  string: ['_']
});

function errHandler(err) {
  if (err) {
    throw err;
  }
}

try {
  wpmigrate.push(cli.flags);
} catch (err) {
  errHandler(err);
}
