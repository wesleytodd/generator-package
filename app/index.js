var path = require('path');
var yosay = require('yosay');
var yeoman = require('yeoman-generator');
var mkdirp = require('mkdirp');

module.exports = yeoman.Base.extend({
	constructor: function () {
		yeoman.Base.apply(this, arguments);

		this.option('repo', {
			type: Boolean,
			required: false,
			desc: 'Create github repo'
		});

		this.option('travis', {
			type: Boolean,
			required: false,
			desc: 'Include travis config'
		});

		this.option('es2015', {
			type: Boolean,
			required: false,
			desc: 'ES2015 module'
		});

		this.option('jsx', {
			type: Boolean,
			required: false,
			desc: 'JSX module'
		});

		this.option('browser', {
			type: Boolean,
			required: false,
			desc: 'Browser module'
		});

		this.option('examples', {
			type: Boolean,
			required: false,
			desc: 'Include examples'
		});

		this.option('scope', {
			type: String,
			required: false,
			desc: 'NPM scope for package'
		});

		// Package dependencies
		this.deps = [];
		this.devDeps = [];
	},

	initializing: function () {
		this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

		// Get scope from package name
		var scope = this.options.scope;
		var name = this.pkg.name;
		if (name && name.indexOf('@') === 0) {
			var _tmp = name.split('/');
			scope = scope || _tmp[0];
			name = _tmp[1];
		} else if (!name) {
			name = path.basename(process.cwd());
		}

		// Pre set the default props from the information we have at this point
		this.props = {
			scope: scope,
			name: name,
			description: this.pkg.description || '',
			version: this.pkg.version || '1.0.0',
			homepage: this.pkg.homepage,
			keywords: this.pkg.keywords,
			repo: Boolean(this.options.repo),
			browser: Boolean(this.options.browser),
			es2015: Boolean(this.options.es2015),
			jsx: Boolean(this.options.jsx),
			examples: Boolean(this.options.examples),
			travis: Boolean(this.options.travis),
			babel: Boolean(this.options.babel),
			author: this.pkg.author || (this.user.git.name() + ' <' + this.user.git.email() + '>')
		};
	},

	prompting: function () {
		var done = this.async();

		// Have the yeoman say this...
		this.log(yosay('This is going to be one rad module!'));

		this.prompt([{
			name: 'name',
			message: 'Package name:',
			default: this.props.name
		}, {
			name: 'scope',
			message: 'NPM Scope (ex. @wesleytodd):',
			default: this.props.scope
		}, {
			name: 'description',
			message: 'Description:',
			when: !this.props.description
		}, {
			name: 'author',
			message: 'Author:',
			default: this.props.author
		}, {
			name: 'keywords',
			message: 'Keywords (ex: foo, bar, baz):',
			when: !this.props.keywords,
			filter: function (words) {
				if (!words) {
					return [];
				}
				return words.split(/\s*,\s*/g);
			}
		}, {
			name: 'dependencies',
			message: 'Dependencies (ex: express, request):',
			when: !this.props.dependencies,
			filter: function (deps) {
				if (!deps) {
					return [];
				}
				return deps.split(/\s*,\s*/g);
			}
		}, {
			name: 'repo',
			type: 'confirm',
			message: 'Create github repo?',
			default: this.props.repo
		}, {
			name: 'es2015',
			type: 'confirm',
			message: 'Use ES2015?',
			default: this.props.es2015
		}, {
			name: 'jsx',
			type: 'confirm',
			message: 'Use JSX?',
			default: this.props.jsx
		}, {
			name: 'examples',
			type: 'confirm',
			message: 'Create examples directory?',
			default: this.props.examples
		}, {
			name: 'browser',
			type: 'confirm',
			message: 'Does this module run in the browser?',
			default: this.props.browser
		}, {
			name: 'travis',
			type: 'confirm',
			message: 'Setup travis?',
			default: this.props.travis
		}], function (props) {
			// Merge existing answers
			Object.assign(this.props, props);

			// Add on fully qualified package name
			this.props.fullPackageName = this.props.scope ? this.props.scope + '/' + this.props.name : this.props.name;

			if (this.props.repo || this.props.travis) {
				// If we are setting up the github repo, ask for the
				// github username
				this.prompt([{
					name: 'githubUsername',
					message: 'GitHub Username:',
					store: true,
					validate: function (value) {
						return !!value;
					},
					default: this.user.git.name()
				}], function (props2) {
					Object.assign(this.props, props2);
					done();
				}.bind(this));
			} else {
				done();
			}
		}.bind(this));
	},

	default: {
		setupTravis: function () {
			if (!this.props.travis) {
				return;
			}
			this.composeWith('@wesleytodd/package:travis', {
				options: {
					browser: this.props.browser
				}
			}, {
				local: require.resolve('../travis')
			});

		},
		setupGithub: function () {
			if (!this.props.repo) {
				return;
			}
			this.composeWith('@wesleytodd/package:github', {
				options: {
					name: this.props.name,
					description: this.props.description,
					username: this.props.githubUsername,
					es2015: this.props.es2015
				}
			}, {
				local: require.resolve('../github')
			});
		}
	},

	writing: {
		writePkgJson: function () {
			var pkg = Object.assign({
				name: this.fullPackageName,
				version: this.props.version,
				description: this.props.description,
				main: 'index.js',
				scripts: {},
				keywords: this.props.keywords && this.props.keywords.length ? this.props.keywords : undefined,
				author: this.props.author,
				license: 'ISC'
			}, this.fs.readJSON(this.destinationPath('package.json'), {}));

			// Initalize stuff
			var testCommand = 'happiness';
			this.devDeps.push('happiness');
			this.devDeps.push('mocha');

			// If browser, add mochify and test-browser, else just mocha
			if (this.props.browser) {
				testCommand += ' && mochify --grep \'BROWSER: \' --invert';
				pkg.scripts['test-browser'] = 'mochify --wd';
				this.devDeps.push('mochify');
			} else {
				testCommand += ' && mocha';
			}

			// If we need to babel, do that before testing, and add watch
			if (this.props.es2015 || this.props.jsx) {
				testCommand = 'npm run babel && ' + testCommand + ' --compilers js:babel-register';
				pkg.scripts.babel = 'babel src --out-dir lib';
				pkg.scripts.watch = 'babel src --watch --out-dir lib';
				this.devDeps.push('babel-cli');
				this.devDeps.push('babel-register');
			}

			// If we are processing es2015, import the babel preset
			if (this.props.es2015) {
				this.devDeps.push('babel-preset-es2015');
			}

			// If we are processing jsx, add the babel preset
			if (this.props.jsx) {
				this.devDeps.push('babel-preset-react');
			}

			// Add other deps if not already installed
			this.deps = (this.props.dependencies || []).filter(function (d) {
				return !pkg.dependencies || !pkg.dependencies[d];
			});

			// Setup scripts
			pkg.scripts = Object.assign({
				test: testCommand,
				prepublish: 'npm test'
			}, pkg.scripts);

			this.fs.writeJSON(this.destinationPath('package.json'), pkg);
		},

		otherFiles: function () {
			this.template('LICENSE');
			this.template('README.md');
			this.template('index.js');
			this.template('gitignore', '.gitignore');
			mkdirp(this.destinationPath('test'));
			this.template('test-index.js', 'test/index.js');

			if (this.props.examples) {
				mkdirp(this.destinationPath('examples'));
				this.template('examples-example.js', 'examples/example.js');
			}

			if (this.props.browser) {
				this.template('min-wd', '.min-wd');
			}

			if (this.props.es2015 || this.props.jsx) {
				this.template('babelrc', '.babelrc');
				mkdirp(this.destinationPath('src'));
				this.template('src-index.js', 'src/index.js');
			}
		}
	},

	install: {
		devDeps: function () {
			this.npmInstall(this.devDeps, {
				saveDev: true
			});
		},
		deps: function () {
			this.npmInstall(this.deps, {
				save: true
			});
		},
		install: function () {
			this.installDependencies({
				bower: false
			});
		}
	},

	end: function () {
		this.log.ok('Happy authoring!');
	}
});
