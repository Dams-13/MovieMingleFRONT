// Import required plugins
const { src, dest, parallel, watch } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const uglify = require("gulp-uglify");
const concat = require("gulp-concat");
const rename = require("gulp-rename");
const plumber = require("gulp-plumber");
const eslint = require("gulp-eslint");
const notify = require("gulp-notify");
const gulpIf = require("gulp-if");
const mergeStream = require("merge-stream");
const path = require("path");

const production = process.argv.includes("--production");

// Define file paths
const paths = {
  // Simple SASS file path
  sass: "src/sass/**/*.scss",
  cssOutput: "res/css",
};
function compileSass() {
  return src(paths.sass)
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(gulpIf(!production, sourcemaps.init()))
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(gulpIf(production, postcss([cssnano()])))
    .pipe(rename({ suffix: production ? ".min" : "" }))
    .pipe(gulpIf(!production, sourcemaps.write(".")))
    .pipe(dest(paths.cssOutput));
}

function watchFiles() {
  // Watch SASS files
  watch(paths.sass, compileSass);
}

// Export Gulp
exports.watch = watchFiles;
exports.compileSass = compileSass;
exports.default = watchFiles;
