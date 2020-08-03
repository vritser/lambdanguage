var gulp = require('gulp');
var del = require('del');
var ts = require('gulp-typescript');

var tsp = ts.createProject("tsconfig.json");

gulp.task('build', () => gulp.src('src/**/*.ts').pipe(tsp()).pipe(gulp.dest("build")))
gulp.task('clean', () => del(["build"]))
