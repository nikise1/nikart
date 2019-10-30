'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // configurable paths
    var pathConfig = {
        app: 'app',
        dist: 'dist'
    };

    grunt.initConfig({
        appPaths: pathConfig,
        watch: {
            scripts: {
                files: ['<%= appPaths.app %>/styles/sass/*.scss'],
                tasks: ['compass:dev'],
                options: {
                    spawn: false
                }
            }
        },
        compass: {
            options: {
                sassDir: '<%= appPaths.app %>/styles/sass',
                imagesDir: '<%= appPaths.app %>/img',
                importPath: '<%= appPaths.app %>/bower_components',
                generatedImagesDir: '<%= appPaths.dist %>/img',
                relativeAssets: true
            },
            dist: {
                options: {
                    cssDir: '<%= appPaths.dist %>/styles/css',
                    environment: 'production'
                }
            },
            dev: {
                options: {
                    cssDir: '<%= appPaths.app %>/styles/css'
                }
            }
        },

        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: [
                            '<%= appPaths.dist %>/*'
                        ]
                    }
                ]
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                '<%= appPaths.app %>/scripts/**/*.js'
            ]
        },
        requirejs: {
            dist: {
                options: {
                    baseUrl: './<%= appPaths.app %>/scripts',
                    mainConfigFile: '<%= appPaths.app %>/scripts/main.js',
                    name: 'main',
                    out: '<%= appPaths.dist %>/scripts/main.js'
                }
            }
        },
        uglify: {
            dist: {
                files: {
                    '<%= appPaths.dist %>/bower_components/requirejs/require.js': ['<%= appPaths.app %>/bower_components/requirejs/require.js']
                }
            }
        },
        // Put files not handled in other tasks here
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= appPaths.app %>',
                        dest: '<%= appPaths.dist %>',
                        src: [
                            '*.{ico,txt}',
                            '*.html',
                            'img/{,*/}*.{jpg,png,webp,gif}',
//                            'bower_components/jplayer/jquery.jplayer/Jplayer.swf'
                            'Jplayer.swf'
                        ]
                    }
                ]
            }
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'compass:dist',
        'compass:dev',
        'requirejs:dist',
        'uglify:dist',
        'copy'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'build'
    ]);
};
