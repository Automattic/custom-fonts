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
			devPreview: {
				options: {
					browserifyOptions: {
						debug: true
					}
				},
				src: [ 'js/helpers/live-update.js' ],
				dest: 'js/jetpack-fonts-preview.js'
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
				files: {
				'js/jetpack-fonts.js': 'js/jetpack-fonts.js',
				'js/jetpack-fonts-preview.js': 'js/jetpack-fonts-preview.js'
				}
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

		mochaTest: {
			test: {
				options: {
					reporter: 'spec'
				},
				src: [ 'tests/js/*' ]
			}
		},

		watch: {
			js: {
				files: [ 'js/**/*.js' ],
				tasks: [ 'browserify:dev', 'browserify:devPreview' ]
			}
		}
	});

	grunt.registerTask( 'default', [ 'autoprefixer:dev', 'browserify:dev', 'browserify:devPreview', 'uglify:dist', 'watch' ] );
	grunt.registerTask( 'test', [ 'mochaTest' ] );
};

