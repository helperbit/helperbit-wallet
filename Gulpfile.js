"use strict";

const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const watch = require('gulp-watch');
const uglifycss = require('gulp-uglifycss');
const gettext = require('gulp-angular-gettext');
const browserify = require('browserify');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const babelify = require("babelify");
const exec = require('child_process').exec;
const tsify = require('tsify');
const imagemin = require('gulp-imagemin');
const execSync = require('child_process').execSync;
const jeditor = require("gulp-json-editor");

/**************** WEBPACK START*/
gulp.task('widget:button', [], () => {
	let b = browserify({
		entries: './app/widgets/donate-button/button.js',
		debug: process.env.NODE_ENV !== 'production',
		blacklist: ["useStrict"]
	})
		.transform(babelify.configure({
			presets: ["@babel/preset-env"]
		}))
		.bundle()
		.pipe(source('button.min.js'));

	return b.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		//.pipe(uglify({ mangle: false, compress: { warnings: true } }))
		.on('error', gutil.log)
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('app/widgets/donate-button/'));
});

gulp.task('webpack:widget', [], (cb) => {
	exec('cd app/widgets && npm run build', function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

gulp.task('lib:distribution', [], (cb) => {
	exec('./node_modules/.bin/tsc app/lib/distribution.ts', function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

// 'lib:distribution', 
gulp.task('webpack', ['sass:widget', 'lib:distribution', 'webpack:widget', 'widget:button']);
/**************** WEBPACK END*/



/**************** TRANSLATE START*/
gulp.task('translate:extract', () => {
	return gulp.src([
		'app/components/**/*.html', 'app/components/**/*.ts',
		'app/shared/components/**/*.html', 'app/shared/components/**/*.ts',
		'app/shared/directives/*.ts', 'app/shared/filters/*.ts', 'app/services/**/*.ts',
		'app/**/*.ts', 'app/**/*.html', 
		'app/*.ts', 'app/*.html'
	])
		// .pipe(babel({ ignore: ['*.html'], presets: ["env"] }))
		.pipe(gettext.extract('template.pot', {
			"startDelim": "{{",
			"endDelim": "}}",
			"markerName": "gettext",
			"markerNames": [],
			"moduleName": "translate",
			"moduleMethodString": "instant",
			"moduleMethodPlural": "getPlural",
			"attribute": "translate",
			"attributes": [],
			"lineNumbers": true,
			"format": "typescript",
			"defaultLanguage": false,
			"requirejs": false
		}))
		.pipe(gulp.dest('po/'));
});

gulp.task('translate:compile', () => {
	return gulp.src('po/**/*.po')
		.pipe(gettext.compile({ format: 'json' }))
		.pipe(jeditor(json => {
			return json[Object.keys(json)[0]];
		}))
		.pipe(gulp.dest('app/assets/lang/'));
});

gulp.task('translate', ['translate:extract', 'translate:compile']);
/**************** TRANSLATE END*/




gulp.task('sass:widget', () => {
	return gulp.src([
		'app/sass/const.scss', 'app/sass/donate-button.scss', 'app/assets/fonts/fonts.css'
	])
		.pipe(sass().on('error', sass.logError))
		.pipe(concat('widget.css'))
		.pipe(uglifycss({ "maxLineLen": 80, "uglyComments": true }))
		.pipe(gulp.dest('app'));
});


gulp.task('compress-images', () => {
	return gulp.src(['app/assets/media/**/*'])
		.pipe(imagemin([
			// imagemin.gifsicle({interlaced: true}),
			// imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 5}),
			/*imagemin.svgo({
				plugins: [
					{removeViewBox: true},
					{cleanupIDs: false}
				]
			})*/
		]))
		.pipe(gulp.dest('app/assets/media/'));
});

