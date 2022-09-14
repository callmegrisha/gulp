const { src, dest, watch, parallel, series } = require('gulp');
const browserSync = require('browser-sync').create();
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const plumber = require('gulp-plumber');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const fs = require('fs');
const data = require('gulp-data');
const merge = require('gulp-merge-json');
const del = require('del');

function browser() {
  browserSync.init({
    server: {
      baseDir: './dev/',
    },
    notify: false,
  });
}

function pugToHtml() {
  src('./dev/data/pages/*.json')
    .pipe(merge({ fileName: 'data.json' }))
    .pipe(dest('./dev/data'));
  return src('./dev/pug/pages/*.pug')
    .pipe(plumber())
    .pipe(
      data(function (file) {
        return JSON.parse(fs.readFileSync('./dev/data/data.json'));
      })
    )
    .pipe(
      pug({
        locals: data,
        pretty: true,
      })
    )
    .pipe(dest('./dev/'))
    .pipe(browserSync.stream());
}

function sassToCss() {
  return src('./dev/sass/index.sass')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(concat('style.min.css'))
    .pipe(
      sass({
        outputStyle: 'compressed',
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 10 versions'],
        grid: true,
        cascade: false,
      })
    )
    .pipe(sourcemaps.write())
    .pipe(dest('./dev/css'))
    .pipe(browserSync.stream());
}

function scripts() {
  return src('./dev/js/main.js')
    .pipe(plumber())
    .pipe(concat('main.min.js'))
    .pipe(uglify())
    .pipe(dest('./dev/js'))
    .pipe(browserSync.stream());
}

function images() {
  return src('./dev/img/**/*.**')
    .pipe(plumber())
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 80, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest('./dist/img'));
}

function fonts() {
  return src('./dev/fonts/*.**').pipe(dest('./dist/fonts'));
}

function cleanDist() {
  return del('dist');
}

function build() {
  return src(
    ['./dev/*.html', './dev/css/style.min.css', './dev/js/main.min.js'],
    { base: './dev' }
  ).pipe(dest('./dist'));
}

function watching() {
  watch(['./dev/sass/**/*.sass'], sassToCss);
  watch(['./dev/js/**/*.js', '!./dev/js/main.min.js'], scripts);
  watch(['./dev/data/pages/*.json'], pugToHtml);
  watch(['./dev/pug/pages/*.pug'], pugToHtml);
  watch(['./dev/*.html']).on('change', browserSync.reload);
}

exports.pugToHtml = pugToHtml;
exports.sassToCss = sassToCss;
exports.scripts = scripts;
exports.fonts = fonts;
exports.browser = browser;
exports.watching = watching;
exports.images = images;
exports.cleanDist = cleanDist;
exports.build = series(cleanDist, images, fonts, build);

exports.default = parallel(pugToHtml, sassToCss, scripts, browser, watching);
