var gulp = require('gulp'),
	sourcemaps = require('gulp-sourcemaps'),
	rename = require('gulp-rename'),
	less = require('gulp-less')
;

gulp.task('styles', function(){
	gulp.src('./public/css/less/main.less')
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(sourcemaps.write())
		.pipe(rename('tule.min.css'))
		.pipe(gulp.dest('./public/css'))
	;
});

gulp.task('watch', function(){
	gulp.watch('./public/css/less/*.less', ['styles'])
});

gulp.task('default', ['styles', 'watch']);

