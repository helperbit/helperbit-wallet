"use strict";

const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const watch = require('gulp-watch');
const uglifycss = require('gulp-uglifycss');
const browserSync = require('browser-sync').create();
const historyApiFallback = require('connect-history-api-fallback');
const gettext = require('gulp-angular-gettext');
const browserify = require('browserify');
const rename = require('gulp-rename');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const babelify = require("babelify");
const exec = require('child_process').exec;
const persistify = require('persistify');
const nodeResolve = require('resolve');
const tsify = require('tsify');
const imagemin = require('gulp-imagemin');

const vendorLibs = [
	'bitcoinjs-lib',
	'bip32',
	'jquery',
	'angular',
	'moment',
	'moment/locale/it',
	'moment/locale/es',
	'moment/locale/en-gb',
	'bootstrap/dist/js/bootstrap',
	'vis',
	'ng-meta',
	'angular-simple-logger',
	'angular-route',
	'angular-cookies',
	'angular-gettext',
	'angular-recaptcha',
	'angular-qr',
	'ng-file-upload/dist/ng-file-upload-shim',
	'ng-file-upload/dist/ng-file-upload',
	'ng-videosharing-embed',
	'bootstrap-slider/dist/bootstrap-slider',
	'leaflet',
	'angular-leaflet-directive',
	'angular-loading-bar',
	'angular-sanitize',
	'intl-tel-input/build/js/utils',
	'intl-tel-input/build/js/intlTelInput',
	'ng-intl-tel-input/dist/ng-intl-tel-input',
	'angular-ui-bootstrap/dist/ui-bootstrap-tpls',
	'turf',
	'leaflet.heat/dist/leaflet-heat',
	'n3-charts/build/LineChart',
	'angular-formly',
	'angular-formly-templates-bootstrap',
	'angular-messages',
	'angular-wizard',
	'ng-tags-input',
	'bip39',
	'crypto-js',
	'd3/d3',
	'socket.io-client',
	'html2canvas',
	'safe-buffer'
];

let enableWebpack = true;
if ('webpack' in process.env && process.env.WEBPACK === '0')
	enableWebpack = false;


/**************** WEBPACK START*/
gulp.task('widget:button', ['set-env'], () => {
	/*return gulp.src([
		'app/config.js',
		'app/widgets/donate-button/button.js'
	])
		.pipe(concat('button.min.js'))
		.pipe(gulp.dest('dist/widgets/donate-button/'));*/

	if (!enableWebpack)
		return;

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

	if (process.env.NODE_ENV === 'production') {
		return b.pipe(buffer())
			.pipe(sourcemaps.init({ loadMaps: true }))
			//.pipe(uglify({ mangle: false, compress: { warnings: true } }))
			.on('error', gutil.log)
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest('app/widgets/donate-button/'));
	} else {
		return b
			.on('error', gutil.log)
			.pipe(gulp.dest('app/widgets/donate-button/'));
	}
});

gulp.task('webpack:widget', ['set-env'], (cb) => {
	if (!enableWebpack)
		return cb();

	exec('./node_modules/.bin/webpack --config app/widgets/donate-button/webpack.config.js', function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

gulp.task('webpack:distribution', ['set-env'], (cb) => {
	if (!enableWebpack)
		return cb();

	exec('./node_modules/.bin/webpack --config app/lib/distribution.webpack.config.js', function (err, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(err);
	});
});

gulp.task('webpack', ['set-env', 'webpack:widget', 'webpack:distribution', 'widget:button']);
/**************** WEBPACK END*/

gulp.task('transpile-vendor', ['set-env'], () => {
	let b = persistify({
		debug: process.env.NODE_ENV !== 'production',
		detectGlobals: true
	})
	.plugin(tsify);

	vendorLibs.forEach(lib => { b.require(lib); });

	b = b.transform(babelify.configure({
        presets: ["@babel/preset-env"]
    }))
		.bundle()
		.pipe(source('vendor.js'));


	if (process.env.NODE_ENV === 'production') {
		return b.pipe(buffer())
			.pipe(uglify({ mangle: false, compress: { warnings: true } }))
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(sourcemaps.write('.', {sourceRoot: 'vendor.js'}))
			.on('error', gutil.log)
			.on('end', browserSync.reload)
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest('dist/'));
	} else {
		return b.pipe(buffer())
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(sourcemaps.write('.', {sourceRoot: 'vendor.js'}))
			.on('error', gutil.log)
			.on('end', browserSync.reload)
			.pipe(gulp.dest('dist/'));
	}
});

gulp.task('transpile', ['set-env'], () => {
	let b = browserify({ // TODO: persistify does not work weel with ts
		entries: [ 
			'./app/app.ts', 
			// './src/main.ts' // TODO: questo commentato disabilita Angular8
		],
		debug: process.env.NODE_ENV !== 'production',
		detectGlobals: true
	})
	.plugin(tsify)

	vendorLibs.forEach(lib => { b.external(lib); });
	
	b = b.transform(babelify.configure({ 
        presets: ["@babel/preset-env"]
    }))
		.bundle()
		.pipe(source('app.js'));
	
	if (process.env.NODE_ENV === 'production') {
		return b.pipe(buffer())
			.pipe(uglify({ mangle: false, compress: { warnings: true } }))
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(sourcemaps.write('.', {sourceRoot: 'app.js'}))
			.on('error', gutil.log)
			.on('end', browserSync.reload)
			.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest('dist'));
	} else {
		return b.pipe(buffer())
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(sourcemaps.write('.', {sourceRoot: 'app.js'}))
			.on('error', gutil.log)
			.on('end', browserSync.reload)
			.pipe(gulp.dest('dist'));
	}
});

gulp.task('transpileExtend', ['set-env', 'translate:compile', 'webpack:distribution', 'transpile-vendor', 'transpile']);


gulp.task('compress', ['transpileExtend'], () => {
	return gulp.src('dist/app.js')
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(uglify({ mangle: false, compress: { warnings: true } }))
		.on('error', gutil.log)
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('dist'));
});

gulp.task('vendor', () => {
	gulp.src([
		'node_modules/bootstrap/dist/css/bootstrap.min.css',
		'node_modules/leaflet/dist/leaflet.css',
		'node_modules/angular-loading-bar/build/loading-bar.min.css',
		'node_modules/intl-tel-input/build/css/intlTelInput.css',
		'node_modules/vis/dist/vis.min.css',
		'node_modules/angular-ui-bootstrap/dist/ui-bootstrap-csp.css',
		'node_modules/bootstrap-slider/dist/css/bootstrap-slider.min.css',
		'node_modules/bootstrap-social/bootstrap-social.css',
		'node_modules/cryptocoins-icons/webfont/cryptocoins.css',
		'node_modules/font-awesome/css/font-awesome.min.css',
		//'node_modules/leaflet-usermarker/src/leaflet.usermarker.css',
		'node_modules/n3-charts/build/LineChart.min.css',
		'app/assets/fonts/fonts.css',
		'node_modules/angular-wizard/dist/angular-wizard.min.css',
		'node_modules/ng-tags-input/build/ng-tags-input.css'
	])
		.pipe(concat('vendor.css'))
		.pipe(gulp.dest('dist'));
});

gulp.task('vendor_static', () => {
	gulp.src([
		'node_modules/bootstrap/dist/css/bootstrap.min.css',
		'node_modules/font-awesome/css/font-awesome.min.css',
		'app/assets/fonts/fonts.css'
	])
		.pipe(concat('vendor_static.css'))
		.pipe(gulp.dest('dist'));

	gulp.src([
		'node_modules/jquery/dist/jquery.min.js',
		'node_modules/bootstrap/dist/js/bootstrap.min.js'
	])
		.pipe(concat('vendor_static.js'))
		.pipe(gulp.dest('dist'));
});

/**************** TRANSLATE START*/
gulp.task('translate:extract', () => {
	return gulp.src([
		'app/components/**/*.html', 'app/components/**/*.js',
		'app/shared/components/**/*.html', 'app/shared/components/**/*.js',
		'app/shared/directives/*.js', 'app/shared/filters/*.js', 'app/services/**/*.js',
		'app/**/*.js', 'app/**/*.ts', 'app/**/*.html', 
		'app/*.js', 'app/*.ts', 'app/*.html'
	])
		.pipe(babel({ ignore: ['*.html'], presets: ["env"] }))
		.pipe(gettext.extract('template.pot', {
			"startDelim": "{{",
			"endDelim": "}}",
			"markerName": "gettext",
			"markerNames": [],
			"moduleName": "$translate", // was 'gettextCatalog'
			"moduleMethodString": "getString",
			"moduleMethodPlural": "getPlural",
			"attribute": "translate",
			"attributes": [],
			"lineNumbers": true,
			"format": "javascript",
			"defaultLanguage": false,
			"requirejs": false
		}))
		.pipe(gulp.dest('po/'));
});

gulp.task('translate:compile', () => {
	return gulp.src('po/**/*.po')
		.pipe(gettext.compile({ format: 'json' }))
		.pipe(gulp.dest('app/assets/lang/'));
});

gulp.task('translate', ['translate:extract', 'translate:compile']);
/**************** TRANSLATE END*/



/**************** SASS START*/
gulp.task('sass:app', () => {
	return gulp.src(['app/sass/index.scss'])
		.pipe(sass().on('error', sass.logError))
		.pipe(concat('app.css'))
		.pipe(uglifycss({ "maxLineLen": 80, "uglyComments": true }))
		.pipe(gulp.dest('dist'));
});

gulp.task('sass:widget', () => {
	return gulp.src([
		'app/sass/const.scss', 'app/sass/donate-button.scss', 'app/assets/fonts/fonts.css'
	])
		.pipe(sass().on('error', sass.logError))
		.pipe(concat('widget.css'))
		.pipe(uglifycss({ "maxLineLen": 80, "uglyComments": true }))
		.pipe(gulp.dest('dist'));
});

gulp.task('sass', ['sass:app', 'sass:widget']);
/**************** SASS END*/


gulp.task('set-env', () => {
	return gulp.src([`app/config/${process.env.HB_ENV || 'dev'}.js`])
		.pipe(rename('config.js'))
		.pipe(gulp.dest('app/'));
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


gulp.task('copy-only', () => {		
	gulp.src(['app/**/*.html', '!app/assets/**/*'])
		.pipe(gulp.dest('dist/'));

	gulp.src(['app/widgets/**/*'])
		.pipe(gulp.dest('dist/widgets/'));

	gulp.src(['app/assets/**/*'])
		.pipe(gulp.dest('dist/'));

	gulp.src(['app/shared/**/*.html'])
		.pipe(gulp.dest('dist/'));

	gulp.src(['snapcrawler/snapshots/'])
		.pipe(gulp.dest('dist/'));

	gulp.src(['node_modules/bootstrap/dist/fonts/*'])
		.pipe(gulp.dest('dist/fonts'));

	gulp.src(['node_modules/font-awesome/fonts/*'])
		.pipe(gulp.dest('dist/fonts'));

	gulp.src(['node_modules/font-awesome/css/*'])
		.pipe(gulp.dest('dist/css'));

	gulp.src(['node_modules/cryptocoins-icons/webfont/*'])
		.pipe(gulp.dest('dist/'));

	gulp.src(['node_modules/leaflet/dist/images/*'])
		.pipe(gulp.dest('dist/images/'));

	gulp.src(['node_modules/intl-tel-input/build/img/*'])
		.pipe(gulp.dest('dist/img/'));

	// Apply lossless compression
	//if (process.env.NODE_ENV === 'production') {
	//	return gulp.src(['app/assets/media/**/*'])
	//		.pipe(imagemin([
				// imagemin.gifsicle({interlaced: true}),
				// imagemin.jpegtran({progressive: true}),
	//			imagemin.optipng({optimizationLevel: 5}),
				//imagemin.svgo({
				//	plugins: [
				//		{removeViewBox: true},
				//		{cleanupIDs: false}
				//	]
				//})
	//		]))
	//		.pipe(gulp.dest('dist/media/'));
	//}
});

gulp.task('copy', ['copy-only', 'set-env', 'sass', 'webpack', 'transpileExtend']);


gulp.task('watch', () => {
	browserSync.init({
		port: 8000,
		server: {
			baseDir: './dist',
		},
		middleware: [historyApiFallback()]
	});

	gulp.start(['set-env']);

	watch(['app/*.js', 'src/*.ts', 'src/**/*.ts', 'app/**/*.js', 'app/*.ts', 'app/**/*.ts', '!app/config.js', '!app/widgets/donate-button/button*', '!app/lib/*'], () => {
		gulp.start(['transpile']);
	});

	watch(['app/lib/*'], () => {
		gulp.start(['set-env', 'webpack:distribution', 'transpile']);
	});

	watch('app/**/*.scss', () => {
		gulp.start(['sass', 'copy-only']);
		browserSync.reload();
	});

	watch('app/**/*.html', () => {
		gulp.start('copy-only');
		browserSync.reload();
	});
});


gulp.task('watch-secure', () => {
	browserSync.init({
		port: 8443,
		https: true,
		server: {
			baseDir: './dist',
		},
		middleware: [historyApiFallback()]
	});

	gulp.start(['set-env']);

	watch(['app/*.js', 'app/**/*.js', 'app/*.ts', 'app/**/*.ts', '!app/config.js', '!app/widgets/donate-button/button*', '!app/lib/*'], () => {
		gulp.start(['transpile']);
	});

	watch(['app/lib/*'], () => {
		gulp.start(['set-env', 'webpack:distribution', 'transpile']);
	});

	watch('app/**/*.scss', () => {
		gulp.start(['sass', 'copy-only']);
		browserSync.reload();
	});

	watch('app/**/*.html', () => {
		gulp.start('copy-only');
		browserSync.reload();
	});
});


gulp.task('build', [
	'translate:compile',
	'sass',
	'webpack',
	'vendor_static',
	'vendor',
	'transpile',
	'copy'
]);

gulp.task('serve', [], () => {
	browserSync.init({
		port: 8000,
		server: {
			baseDir: './dist',
		},
		middleware: [historyApiFallback()]
	});
});

gulp.task('serve-secure', [], () => {
	browserSync.init({
		port: 8443,
		https: true,
		server: {
			baseDir: './dist',
		},
		middleware: [historyApiFallback()]
	});
});