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
					map: false
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

		phpunit: {
			classes: {
				dir: 'tests/php/',
				bootstrap: 'vendor/autoload.php'
			},
			options: {
				colors: true
			}
		},

		watch: {
			js: {
				files: [ 'js/**/*.js', '!js/jetpack-fonts.js', '!js/jetpack-fonts-preview.js' ],
				tasks: [ 'browserify:dev', 'browserify:devPreview' ]
			},
			reload: {
				options: { livereload: true },
				files: [ 'js/jetpack-fonts.js', 'js/jetpack-fonts-preview.js', 'css/fonts-customizer.css' ]
			}
		}
	});

	grunt.registerTask( 'default', [ 'autoprefixer:dev', 'browserify:dev', 'browserify:devPreview', 'watch' ] );
	grunt.registerTask( 'dist', [ 'autoprefixer:dist', 'browserify:dev', 'browserify:devPreview', 'uglify:dist' ] );
	grunt.registerTask( 'test', [ 'composer:install', 'mochaTest', 'phpunit' ] );
};

