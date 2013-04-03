/*global module:false*/
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('jquery-preview.jquery.json'),
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") + "\\n" %>' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */<%= "\\n" %>'
    },
    qunit: {
      all: ['test/**/*.html']
    },
    concat: {
      options:  {
        banner: '<%= meta.banner %>'
      },
      dist: {
        src: [
          'src/intro.js',
          'lib/sprintf-0.7-beta1.js',
          'src/hidden.js',
          'src/thumb.js',
          'src/preview.js',
          'src/outro.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      preview: {
        mangle: true,
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
        }
      }
    },
    connect: {
      server: {
        options: {
          port: 8080,
          base: '.'
        }
      }
    },
    watch: {
      files: 'src/**/*.js',
      tasks: 'concat'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {'jQuery' : true, 'embedly':true, 'utils': true},
      all: ['Gruntfile.js', 'src/hidden.js', 'src/thumb.js', 'src/preview.js', 'test/**/*.js']
    }
  });

  // Default task.
  grunt.registerTask('default', ["jshint", "concat", "uglify"]);
  grunt.registerTask("run", ["connect", "watch"]);
};
