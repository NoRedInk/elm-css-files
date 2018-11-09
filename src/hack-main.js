//@flow
const fs = require("fs-extra");

module.exports = function hackMain(
  repository /*: string */,
  mainFilename /*: string */
) {
  return new Promise(function(resolve, reject) {
    fs.readFile(mainFilename, { encoding: "utf8" }, function(readError, main) {
      if (readError) return reject(readError);

      const injectionPoint = main.lastIndexOf("var Elm = {};");

      const namespacer = "_" + repositoryToNativePackageName(repository) + "$";

      // Overwrite the implementation of classToSnippet to extract the styles from
      // the opaque type. This is so that the CLI can access the contents of the
      // opaque type, but library consumers cannot. This enforces the guarantee that
      // nobody can depend on the contents of these values--which they never should!
      const injection =
        namespacer +
        "Main$classToSnippet = F2(function(className, styles) { return A2(_rtfeldman$elm_css$Css_Global$class, className, styles._0); });\n" +

        namespacer +
        "Main$globalStyleToString = function(node) {\n" +
				// First, find the nested object.
				"  var nestedObject;\n" +

				"  for (var key in node) {\n" +
				"    if (typeof node[key] === 'object') {\n" +
				"      nestedObject = node[key];\n" +
				"    }\n" +
				"  }\n" +

				"  var children;\n" +

				"  for (var key in nestedObject) {\n" +
				"    if (nestedObject[key] instanceof Array) {\n" +
				"      children = nestedObject[key];\n" +
				"    }\n" +
				"  }\n" +

				"  var child=children[0];\n" +

				"  for (var key in child) {\n" +
				"    if (typeof child[key] === 'string') {\n" +
				"      return child[key];\n" +
				"    }\n" +
				"  }\n" +

				"}\n";

      const newMain = [
        main.slice(0, injectionPoint),
        injection,
        main.slice(injectionPoint, main.length)
      ].join("\n\n");

      fs.writeFile(mainFilename, newMain, function(writeError) {
        if (writeError) return reject(writeError);

        resolve();
      });
    });
  });
};

function repositoryToNativePackageName(repository /*:string*/) {
  // https://github.com/rtfeldman/node-test-runner.git
  //
  // matches[1] = "rtfeldman"
  // matches[2] = "node-test-runner"
  var matches = repository.match(/\/([^\/]+)\/([^\/]+)\.git/);

  if (matches instanceof Array) {
    var userName = matches[1];
    var repoName = matches[2];

    //"A dot in repository name breaks `elm-make`" https://github.com/elm-lang/elm-make/issues/106
    if (userName.indexOf(".") >= 0 || repoName.indexOf(".") >= 0) {
      throw "Elm currently doesn't support having periods in the user/project part of the repository field of elm-package.json. Aborting test run.";
    }
    // From the above example, return "rtfeldman$node_test_runner"
    return [userName, repoName].map(name => name.replace(/-/g, "_")).join("$");
  } else {
    throw "Unable to convert repository " + repository + " to package name.";
  }
}
