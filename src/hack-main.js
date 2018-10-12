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
        "author$project$Main$classToSnippet = F2(function(className, styles) { return A2(rtfeldman$elm_css$Css$Global$class, className, styles.a); });";

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
