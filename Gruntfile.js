module.exports = function( grunt ) {

	require( 'load-grunt-tasks' )( grunt );

	grunt.initConfig({
		options: {
			sourceComments: 'map',
			outputStyle: 'nested'
		},

		browserify: {
			dev: {
				options: {
					browserifyOptions: {
						debug: true
					}
				},
				src: [ 'js/index.js' ],
				dest: 'js/jetpack-fonts.js'
			},
			dist: {
				src: [ 'js/index.js' ],
				dest: 'js/jetpack-fonts.js'
			}
		},

		uglify: {
			dist: {
				options: {
					maxLineLen: 2048
				},
				src: [ 'js/jetpack-fonts.js' ],
				dest: 'js/jetpack-fonts.js'
			}
		},

		autoprefixer: {
			dev: {
				options: {
					map: true
				},
				files: {
					'css/fonts-customizer.css': 'css/fonts-customizer.css'
				}
			},
			dist: {
				options: {
					map: false
				},
				files: {
					'css/fonts-customizer.css': 'css/fonts-customizer.css'
				}
			}
		},

		watch: {
			js: {
				files: [ 'js/**/*.js' ],
				tasks: [ 'browserify:dev' ]
			}
		}
	});

	grunt.registerTask( 'default', [ 'autoprefixer:dev', 'browserify:dev', 'watch' ] );
};

