var gulp = require('gulp'),
	p = require('gulp-load-plugins')()
;

gulp.task('styles', function(){
	gulp.src('./public/css/less/main.less')
		.pipe(p.sourcemaps.init())
		.pipe(p.less())
		.pipe(p.sourcemaps.write())
		.pipe(p.rename('tule.min.css'))
		.pipe(gulp.dest('./public/css'))
	;
});

gulp.task('watch', function(){
	gulp.watch('./public/css/less/*.less', ['styles'])
});

gulp.task('default', ['styles', 'watch']);

