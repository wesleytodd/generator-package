var path = require('path');
var yeoman = require('yeoman-generator');
var mkdirp = require('mkdirp');

module.exports = yeoman.Base.extend({
	constructor: function () {
		yeoman.Base.apply(this, arguments);

		this.option('repo', {
			type: Boolean,
			required: false,
			default: true,
			desc: 'Create github repo'
		});

		this.option('travis', {
			type: Boolean,
			required: false,
			default: true,
			desc: 'Include travis config'
		});

		this.option('es2015', {
			type: Boolean,
			required: false,
			desc: 'ES2015 module'
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
	},

	initializing: function () {
		this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

		// Pre set the default props from the information we have at this point
		this.props = {
			name: this.pkg.name || path.basename(process.cwd()),
			description: this.pkg.description || '',
			version: this.pkg.version || '1.0.0',
			homepage: this.pkg.homepage,
			keywords: this.pkg.keywords,
			repo: Boolean(this.options.repo),
			browser: Boolean(this.options.browser),
			es2015: Boolean(this.options.es2015),
			examples: Boolean(this.options.examples),
			travis: Boolean(this.options.travis),
			babel: Boolean(this.options.babel),
			author: this.pkg.author || this.user.git.name()
		};
	},

	prompting: function () {
		var done = this.async();
		this.prompt([{
			name: 'description',
			message: 'Description',
			when: !this.props.description
		}, {
			name: 'keywords',
			message: 'Keywords',
			when: !this.props.keywords,
			filter: function (words) {
				if (!words) {
					return [];
				}
				return words.split(/\s*,\s*/g);
			}
		}, {
			name: 'repo',
			type: 'confirm',
			message: 'Create github repo',
			default: this.props.repo
		}, {
			name: 'es2015',
			type: 'confirm',
			message: 'Use ES2015',
			default: this.props.es2015
		}, {
			name: 'examples',
			type: 'confirm',
			message: 'Create examples',
			default: this.props.examples
		}, {
			name: 'browser',
			type: 'confirm',
			message: 'Browser module',
			default: this.props.browser
		}, {
			name: 'travis',
			type: 'confirm',
			message: 'Use travis',
			default: this.props.travis
		}], function (props) {
			Object.assign(this.props, props);
			done();
		}.bind(this));
	},

	default: {
		setupTravis: function () {
			if (this.props.travis) {
				this.composeWith('fn-awesome-module:travis', {
					options: {
						browser: this.props.browser
					}
				}, {
					local: require.resolve('../travis')
				});

				var done = this.async();
				this.prompt([{
					name: 'githubUsername',
					message: 'GitHub Username',
					store: true,
					validate: function (value) {
						return !!value;
					}
				}], function (props) {
					Object.assign(this.props, props);
					done();
				}.bind(this));
			}
		},
		setupGithub: function () {
			if (this.props.repo) {
				this.composeWith('fn-awesome-module:github', {
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
		}
	},

	writing: {
		writePkgJson: function () {
			var pkg = Object.assign({
				name: this.props.name,
				version: this.props.version,
				description: this.props.description,
				main: 'index.js',
				scripts: {
					test: 'happiness && mocha'
				},
				keywords: this.props.keywords && this.props.keywords.length ? this.props.keywords : undefined,
				author: this.props.author,
				license: 'ISC',
				devDependencies: {
					happiness: '^5.5.0',
					mocha: '^2.3.3'
				}
			}, this.fs.readJSON(this.destinationPath('package.json'), {}));

			// if browser, add mochify
			if (this.props.browser) {
				pkg.scripts.test = 'happiness && mochify --grep \'BROWSER: \' --invert';
				pkg.scripts['test-browser'] = 'mochify --wd';
				pkg.devDependencies.mochify = '^2.15.0';
			}

			if (this.props.es2015) {
				pkg.scripts.babel = 'babel src --out-dir lib';
				pkg.scripts.watch = 'babel src --watch --out-dir lib';
				pkg.devDependencies['babel-cli'] = '^6.5.0';
				pkg.devDependencies['babel-preset-es2015'] = '^6.5.0';
			}

			this.fs.writeJSON(this.destinationPath('package.json'), pkg);
		},

		otherFiles: function () {
			this.template('LICENSE');
			this.template('README.md');
			this.template('index.js');
			mkdirp(this.destinationPath('test'));

			if (this.props.examples) {
				mkdirp(this.destinationPath('examples'));
			}

			if (this.props.browser) {
				this.template('minwd', '.min-wd');
			}

			if (this.props.es2015) {
				this.template('babelrc', '.babelrc');
				mkdirp(this.destinationPath('src'));
				this.template('srcindex.js', 'src/index.js');
			} else {
				mkdirp(this.destinationPath('lib'));
				this.template('srcindex.js', 'lib/index.js');
			}
		}
	},

	installing: function () {
		this.npmInstall();
	},

	end: function () {
		this.log.ok('You are good to go!');
		this.log('(even if the process didnt quit, because f you yeoman)');
	}
});
