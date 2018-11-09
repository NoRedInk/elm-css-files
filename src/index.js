//@flow

const _ = require("lodash"),
  path = require("path"),
  glob = require("glob"),
  mkdirp = require("mkdirp"),
  findExposedValues = require("./find-exposed-values").findExposedValues,
  writeGeneratedElmPackage = require("./generate-elm-package"),
  writeMain = require("./generate-main").writeMain,
  writeFile = require("./generate-class-modules").writeFile,
  findElmFiles = require("./find-elm-files"),
  compileAll = require("./compile-all"),
  fs = require("fs-extra"),
  compile = require("node-elm-compiler").compile,
  extractCssResults = require("./extract-css-results.js"),
  hackMain = require("./hack-main.js");

const binaryExtension = process.platform === "win32" ? ".exe" : "";
const jsEmitterFilename = "emitter.js";

module.exports = function(
  projectDir /*: string*/,
  outputDir /*: string */,
  pathToElm /*: ?string */
) {
  const cssSourceDir = path.join(projectDir, "css");
  const cssElmPackageJson = path.join(cssSourceDir, "elm-package.json");

  if (!fs.existsSync(cssElmPackageJson)) {
    mkdirp.sync(cssSourceDir);

    // TODO do an init here
  }

  const elmFilePaths = findElmFiles(cssSourceDir);
  const generatedDir = path.join(
    projectDir,
    "elm-stuff",
    "generated-code",
    "rtfeldman",
    "elm-css-files"
  );

  // Symlink our existing elm-stuff into the generated code,
  // to avoid re-downloading and recompiling things we already
  // just downloaded and compiled.
  var generatedElmStuff = path.join(generatedDir, "elm-stuff");

  mkdirp.sync(generatedDir);

  if (!fs.existsSync(generatedElmStuff)) {
    try {
      fs.symlinkSync(
        path.join(cssSourceDir, "elm-stuff"),
        generatedElmStuff,
        "junction" // Only affects Windows, but necessary for this to work there. See https://github.com/gulpjs/vinyl-fs/issues/210
      );
    } catch (err) {
      // This will blow up on macOS because !fs.existsSync(generatedElmStuff)
      // fails on macOS for symlinks. Ignore it; if it legit fails, that's
      // fine; this doesn't *need* to be symlinked. It's just a performance optimization.
    }
  }

  const generatedSrc = path.join(generatedDir, "src");
  const mainFilename = path.join(generatedSrc, "Main.elm");

  const makeGeneratedSrcDir = new Promise(function(resolve, reject) {
    mkdirp(generatedSrc, function(error) {
      if (error) reject(error);

      resolve();
    });
  });

  return Promise.all([
    writeGeneratedElmPackage(pathToElm, generatedDir, generatedSrc, cssSourceDir),
    makeGeneratedSrcDir,
    compileAll(pathToElm, cssSourceDir, elmFilePaths)
  ]).then(function(promiseOutputs) {
    return findExposedValues(
      [
        "Css.File.UniqueClass",
        "Css.File.UniqueSvgClass",
        "Css.File.Stylesheet",
        "Css.Global.Snippet",
      ],
      generatedDir,
      elmFilePaths,
      [cssSourceDir],
      true
    ).then(function(modules) {
			if (modules.length === 0) {
				return Promise.reject("I found no exposed styles to compile! Is your css/ directory set up properly?");
			}

      return Promise.all(
        [writeMain(mainFilename, modules)].concat(
          modules.map(function(modul) {
            return writeFile(path.join(generatedDir, "styles"), modul);
          })
        )
      ).then(function() {
        return emit(
          mainFilename,
          path.join(generatedDir, jsEmitterFilename),
          generatedDir,
          pathToElm
        ).then(writeResults(outputDir));
      });
    });
  });
};

function emit(
  src /*: string */,
  dest /*: string */,
  cwd /*: string */,
  pathToElm /*: ?string */
) {
  // Compile the js file.
  return compileEmitter(src, {
    output: dest,
    cwd: cwd,
    pathToElm: pathToElm
  })
    .then(function() {
      return hackMain(dest);
    })
    .then(function() {
      return extractCssResults(dest);
    });
}

function writeResults(outputDir) {
  return function(results) {
    return Promise.all(results.map(writeResult(outputDir)));
  };
}

function writeResult(outputDir) {
  return function(result) {
    return new Promise(function(resolve, reject) {
      const filename = path.join(outputDir, result[0]);
      // It's important to call path.dirname explicitly,
      // because result.filename can have directories in it!
      const directory = path.dirname(filename);

      mkdirp(directory, function(dirError) {
        if (dirError) return reject(dirError);

        fs.writeFile(filename, result[1] + "\n", function(
          fileError,
          file
        ) {
          if (fileError) return reject(fileError);

          resolve(result);
        });
      });
    });
  };
}

function compileEmitter(src, options) {
  return new Promise(function(resolve, reject) {
    compile(src, options).on("close", function(exitCode) {
      if (exitCode === 0) {
        resolve();
      } else {
        reject("Errored with exit code " + exitCode);
      }
    });
  });
}
