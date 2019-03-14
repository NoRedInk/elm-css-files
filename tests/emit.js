var assert = require("chai").assert;
var path = require("path");
var emitter = require(path.join(__dirname, "..", "src", "index.js"));
var fs = require("fs");

var fixturesDir = path.join(__dirname, "fixtures");

describe("emitting", function() {
  it("works with HomepageCss.elm", function (done) {
    // Use an epic timeout, because Travis on Linux is SO SLOW.
    this.timeout(6000000);

    var projectDir = path.join(__dirname, "..", "examples");
    var outputDir = __dirname

    emitter(projectDir, outputDir).then(function() {
      fs.readdir(fixturesDir, function(err, files) {
         if (err) {
           console.error("Could not list the directory.", err);
           process.exit(1);
         }

         files.forEach(function(file) {
           var expected = fs.readFileSync(path.join(fixturesDir, file), {encoding: "utf8"});
           var actual = fs.readFileSync(path.join(outputDir, "Dreamwriter", file), {encoding: "utf8"});
           return assert.strictEqual(expected, actual);
         })
      });
    }).then(
      done,
      function(error) {
        done(new Error(error))
      }
    )
  });
});
