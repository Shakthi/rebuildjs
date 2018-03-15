

var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var tsify = require('tsify');
var watchify = require('watchify');
var gutil      = require('gulp-util');



// add custom browserify options here
var customOpts = {
    entries: ['./src/main.js'],
    debug: true
  };
  var opts = Object.assign({}, watchify.args, customOpts);
  var b = watchify(browserify(opts)); 

  b.plugin(tsify, { noImplicitAny: true ,"moduleResolution": "node"});
  gulp.task('js', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('error',gutil.log); // output build logs to terminal

function bundle() {
  return b.bundle()
    
    // log errors if they happen
    .on("error", function(err) {
        gutil.log("Browserify error:", err);
    })    
    .pipe(source('bundle.js'))
    // optional, remove if you don't need to buffer file contents
   // .pipe(buffer())
    // optional, remove if you dont want sourcemaps
  //  .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
       // Add transformation tasks to the pipeline here.
    //.pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./build/'));
}
  


