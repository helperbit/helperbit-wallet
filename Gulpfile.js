"use strict";

const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const uglifycss = require('gulp-uglifycss');
const gettext = require('gulp-angular-gettext');
const browserify = require('browserify');
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
gulp.task('widget:button', gulp.series(() => {
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
}));

gulp.task('webpack:widget', gulp.series((cb) => {
	exec('cd app/widgets && npm run build', function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
}));

gulp.task('lib:distribution', gulp.series((cb) => {
	exec('./node_modules/.bin/tsc app/lib/distribution.ts', function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
}));

gulp.task('sass:widget', gulp.series(() => {
	return gulp.src([
		'app/sass/const.scss', 'app/sass/donate-button.scss', 'app/assets/fonts/fonts.css'
	])
		.pipe(sass().on('error', sass.logError))
		.pipe(concat('widget.css'))
		.pipe(uglifycss({ "maxLineLen": 80, "uglyComments": true }))
		.pipe(gulp.dest('app'));
}));

// 'lib:distribution', 
gulp.task('webpack', gulp.series('sass:widget', 'lib:distribution', 'webpack:widget', 'widget:button'));
/**************** WEBPACK END*/



/**************** TRANSLATE START*/
gulp.task('translate:extract', gulp.series(() => {
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
}));

gulp.task('translate:compile', gulp.series(() => {
	return gulp.src('po/**/*.po')
		.pipe(gettext.compile({ format: 'json' }))
		.pipe(jeditor(json => {
			/* This procedure gets inner context value, linearizing it for 
				the gettext transformer */
			const res = {};
			json = json[Object.keys(json)[0]];

			for (let o of Object.keys(json)) {
				let value = json[o];
				if (typeof(value) == 'object')
					value = json[o][Object.keys(json[o])[0]];
				res[o] = value;
			}
			
			return res;
		}))
		.pipe(gulp.dest('app/assets/lang/'));
}));

gulp.task('translate', gulp.series('translate:extract', 'translate:compile'));
/**************** TRANSLATE END*/




gulp.task('compress-images', gulp.series(() => {
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
}));

