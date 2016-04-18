/**
 * @author Hana Lee
 * @since 2016-04-18 20:38
 */
/*jslint
 browser  : true,
 continue : true,
 devel    : true,
 indent   : 2,
 maxerr   : 50,
 nomen    : true,
 plusplus : true,
 regexp   : true,
 vars     : true,
 white    : true,
 todo     : true,
 node     : true
 */
var gulp = require('gulp');
var minify = require('gulp-minify');
var jslint = require('gulp-jslint');

gulp.task('lint', function () {
  gulp.src('./src/*.js')
    .pipe(jslint({
      browser  : true,
      continue : true,
      devel    : true,
      indent   : 2,
      maxerr   : 50,
      nomen    : true,
      plusplus : true,
      regexp   : true,
      vars     : true,
      white    : true,
      todo     : true,
      node     : true,
      global   : [],
      reporter : 'default'
    }))
    .on('error', function (error) {
      console.error(String(error));
    })
});

gulp.task('compress', ['lint'], function () {
  gulp.src('src/naver-translator.js')
    .pipe(minify({
      ext : {
        src : '.src.js',
        min : '.min.js'
      },
      exclude : ['task']
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['compress']);