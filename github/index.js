var yeoman = require('yeoman-generator');
var GitHubApi = require('github');

module.exports = yeoman.Base.extend({
	constructor: function () {
		yeoman.Base.apply(this, arguments);

		this.option('name', {
			type: String,
			required: false,
			desc: 'Package name'
		});

		this.option('description', {
			type: String,
			required: false,
			desc: 'Package description'
		});

		this.option('username', {
			type: String,
			required: false,
			desc: 'Github username'
		});

		this.option('password', {
			type: String,
			required: false,
			desc: 'Github password'
		});

		this.option('es2015', {
			type: Boolean,
			required: false,
			desc: 'ES2015 module'
		});
	},

	initializing: function () {
		this.pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

		this.props = {
			name: this.options.name || this.pkg.name,
			description: this.options.description || this.pkg.description,
			username: this.options.username,
			password: this.options.password,
			es2015: this.options.es2015
		};
	},

	prompting: function () {
		var done = this.async();
		this.prompt([{
			name: 'username',
			message: 'GitHub Username',
			when: this.props.username === undefined,
			store: true,
			validate: function (value) {
				return !!value;
			}
		}, {
			name: 'password',
			type: 'password',
			message: 'GitHub Password',
			when: this.props.password === undefined,
			validate: function (value) {
				return !!value;
			}
		}], function (props) {
			Object.assign(this.props, props);
			done();
		}.bind(this));
	},

	createRepo: function () {
		var done = this.async();
		var github = new GitHubApi({
			version: '3.0.0'
		});

		github.authenticate({
			type: 'basic',
			username: this.props.username,
			password: this.props.password
		});

		// Create the repo
		github.repos.create({
			name: this.props.name,
			description: this.props.description
		}, function (err, newRepo) {
			if (err) {
				// Repo already exists, probably?
				if (err.code === 422) {
					var res;
					try {
						res = JSON.parse(err.message);
					} catch (e) {
						this.log.error(err);
						this.log.error(e);
					}
					if (res.errors && res.errors[0] && res.errors[0].message === 'name already exists on this account') {
						this.log.error('Repo already exists');
						this.prompt({
							name: 'use',
							message: 'Use this repo anyway?',
							type: 'confirm',
							default: false
						}, function (p) {
							if (!p.use) {
								this.log.error('No longer setting up git repository');
								return done();
							}

							github.repos.get({
								user: this.props.username,
								repo: this.props.name
							}, function (err, repo) {
								if (err) {
									this.log.error(err);
								}

								this.log.ok('Got the repo info');
								this.props.githubRepo = repo || {};
								done();
							}.bind(this));
						}.bind(this));
						return;
					}
				}

				// Not sure when we would get this, just log
				this.log.error(err);
				return done();
			}

			// Create was successful
			this.log.ok('Repository created!');
			this.props.githubRepo = newRepo || {};
			done();
		}.bind(this));
	},

	writing: {
		copyIgnore: function () {
			this.template('gitignore', '.gitignore');
		},

		writePkgJson: function () {
			if (!this.props.githubRepo) {
				return;
			}

			var pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
			Object.assign(pkg, {
				repository: pkg.repository || {
					type: 'git',
					url: this.props.githubRepo.clone_url
				},
				bugs: pkg.bugs || {
					url: this.props.githubRepo.html_url + '/issues'
				},
				homepage: pkg.homepage || this.props.githubRepo.html_url
			});

			this.fs.writeJSON(this.destinationPath('package.json'), pkg);
		},

		initGit: function () {
			this.spawnCommandSync('git', ['init', '--quiet']);
			if (this.props.githubRepo) {
				this.spawnCommandSync('git', ['remote', 'add', 'origin', this.props.githubRepo.ssh_url]);
			}
		}
	}
});
