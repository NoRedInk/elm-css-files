//@flow
const fs = require("fs-extra");

module.exports = function hackMain(
  mainFilename /*: string */
) {
  return new Promise(function(resolve, reject) {
    fs.readFile(mainFilename, { encoding: "utf8" }, function(readError, main) {
      if (readError) return reject(readError);

      const injectionPoint = main.lastIndexOf("_Platform_export");

      // Overwrite the implementation of classToSnippet to extract the styles from
      // the opaque type. This is so that the CLI can access the contents of the
      // opaque type, but library consumers cannot. This enforces the guarantee that
      // nobody can depend on the contents of these values--which they never should!
      const injection =
        "if (typeof author$project$Main$classToSnippet !== 'undefinded') {\n" +
        "  author$project$Main$classToSnippet = F2(function(className, styles) { return A2(rtfeldman$elm_css$Css$Global$class, className, styles.a); });\n" +
        "}\n\n" +

        "if (typeof author$project$Main$stylesheetToSnippetList !== 'undefined') {\n" +
        "  author$project$Main$stylesheetToSnippetList = function(stylesheet) { return stylesheet.a }\n" +
        "}\n\n" +

        "if (typeof author$project$Main$globalStyleToString !== 'undefined') {\n" +
        "  author$project$Main$globalStyleToString = function(node) {\n" +
				// First, find the nested object.
				"    var nestedObject;\n" +

				"    for (var key in node) {\n" +
				"      if (typeof node[key] === 'object') {\n" +
				"        nestedObject = node[key];\n" +
				"      }\n" +
				"    }\n" +

				"    var children;\n" +

				"    for (var key in nestedObject) {\n" +
				"      if (nestedObject[key] instanceof Array) {\n" +
				"        children = nestedObject[key];\n" +
				"      }\n" +
				"    }\n" +

				"    var child=children[0];\n" +

				"    for (var key in child) {\n" +
				"      if (typeof child[key] === 'string') {\n" +
				"        return child[key];\n" +
				"      }\n" +
				"    }\n" +
        "  }\n" +
        "}";

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
