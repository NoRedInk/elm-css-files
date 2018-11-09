//@flow
const path = require("path"),
  fs = require("fs-extra"),
  os = require("os"),
  spawn = require("cross-spawn");

function installDeps(pathToElm, cwd) {
  return new Promise(function (resolve, reject) {
    var process = spawn(pathToElm || 'elm', ['install', 'elm/json'], { cwd: cwd });
    var jsonStr = "";
    var stderrStr = "";

    process.stdout.on("data", function(data) {
      jsonStr += data;
    });

    process.stderr.on("data", function(data) {
      stderrStr += data;
    });

    process.on("close", function(code) {
      if (stderrStr !== "") {
        reject(stderrStr);
      } else if (code !== 0) {
        reject("Finding test interfaces failed, exiting with code " + code);
      }
      else {
        resolve()
      }
    });

    // `elm install` has no --yes, and will prompt for a [Yn] input
    // we send EOL to get the default `Y`
    process.stdin.setEncoding("utf-8");
    process.stdin.write(os.EOL);
    process.stdin.end();
  })
}

module.exports = function writeGeneratedElmPackage(
  pathToElm /*: string*/,
  generatedDir /*:string */,
  generatedSrc /*: string */,
  originalElmPackageDir /*: string */
) {
  const originalElmPackage = path.join(
    originalElmPackageDir,
    "elm.json"
  );

  return fs.readJson(originalElmPackage).then(function(elmPackageContents) {
    // Make all the source-directories absolute, and introduce a new one.
    var sourceDirs = (elmPackageContents["source-directories"] || [])
      .map(function(src) {
        return path.resolve(originalElmPackageDir, src);
      });

    elmPackageContents["source-directories"] = [
      // Include elm-stuff/generated-code/rtfeldman/elm-css/src
      // since we'll be generating Main.elm in there.
      generatedSrc
    ].concat(sourceDirs);

    // Generate the new elm.json
    return new Promise(function(resolve, reject) {
      fs.writeFile(
        path.join(generatedDir, "elm.json"),
        JSON.stringify(elmPackageContents, null, 4),
        function(writeError) {
          if (writeError)
            reject("Error writing generated elm.json: " + writeError);

          resolve();
        }
      );
    })
    .then(function () {
      return installDeps(pathToElm, generatedDir)
    });
  });
};
