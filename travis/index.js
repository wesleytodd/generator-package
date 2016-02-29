var yeoman = require('yeoman-generator');
var yaml = require('yamljs');
var sort = require('sort-object');
var travisConfigKeys = require('travis-config-keys');

module.exports = yeoman.Base.extend({
	constructor: function () {
		yeoman.Base.apply(this, arguments);

		this.option('browser', {
			type: Boolean,
			required: false,
			desc: 'Browser module'
		});
	},

	initializing: function () {
		this.props = {
			browser: this.options.browser
		};
	},

	prompting: function () {
		var done = this.async();
		this.prompt([{
			name: 'browser',
			message: 'Browser module',
			type: 'confirm',
			when: this.props.browser === undefined
		}], function (props) {
			Object.assign(this.props, props);
			done();
		}.bind(this));
	},

	writing: function () {
		var dest = this.destinationPath('.travis.yml');
		var tmpl = this.templatePath(this.props.browser ? 'browser-travis.yml' : 'travis.yml');

		var existing = this.fs.exists(dest) ? yaml.parse(this.fs.read(dest)) : {};
		var defaults = yaml.parse(this.fs.read(tmpl));

		var trav = sort(Object.assign(defaults, existing), {
			sort: function (a, b) {
				return travisConfigKeys.indexOf(a) < travisConfigKeys.indexOf(b) ? -1 : 1;
			}
		});

		this.fs.write(dest, yaml.stringify(trav, 3, 2));
	}
});
