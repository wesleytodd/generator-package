# <%= props.name %>

[![NPM Version](https://img.shields.io/npm/v/<%= props.fullPackageName %>.svg)](https://npmjs.org/package/<%= props.fullPackageName %>)
[![NPM Downloads](https://img.shields.io/npm/dm/<%= props.fullPackageName %>.svg)](https://npmjs.org/package/<%= props.fullPackageName %>)
<% if (props.travis) { %>[![Build Status](https://travis-ci.org/<%= props.githubUsername %>/<%= props.name %>.svg?branch=master)](https://travis-ci.org/<%= props.githubUsername %>/<%= props.name %>)<% } %>
[![js-happiness-style](https://img.shields.io/badge/code%20style-happiness-brightgreen.svg)](https://github.com/JedWatson/happiness)

## Install

```
$ npm install --save <%= props.fullPackageName %>
```

## Usage

```javascript
var module = require('<%= props.fullPackageName %>');

// ...
```

## Development

The tests can be run with `npm test`, which also runs the linter and any other builds steps for the module.
When a release is ready, use npm to bump the version:

```
$ npm version minor
$ git push
$ npm publish
```

Pull requests should be made against master or the currently active development branch.
