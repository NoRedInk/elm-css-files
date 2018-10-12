//@flow

/*::
type ModuleDeclaration = {
  name: string,
  values: Array<{ name : string, signature : string }>
}
*/

const fs = require("fs-extra"),
  mkdirp = require("mkdirp"),
  _ = require("lodash"),
  classNameForValue = require("./generate-class-modules").classNameForValue,
  path = require("path");

// TODO also need to write elm-package.json in that directory.
function writeMain(
  filename /*:string */,
  modules /*: Array<ModuleDeclaration> */
) {
  const contents = generateMain(modules);

  return new Promise(function(resolve, reject) {
    fs.writeFile(filename, contents, function(error) {
      if (error) return reject(error);

      resolve(filename);
    });
  });
}

function generateMain(modules /*: Array<ModuleDeclaration> */) {
  const otherModules = [
    "Css",
    "Css.Global",
    "Html.Styled",
    "Platform",
    "Json.Decode"
  ]; // Json.Decode is needed to avoid a bug in Elm 0.18 where port modules need it to be imported; may be able to remove that import in 0.19
  const imports = otherModules
    .concat(_.map(modules, "name"))
    .map(function(importName) {
      return "import " + importName;
    })
    .join("\n");

  const fileStructure =
    "fileStructure : FileStructure\n" +
    "fileStructure =\n" +
    "    [ " +
    modules.map(generateModule).join("\n        , ") +
    "\n        ]";

  const end =
    "type alias FileStructure = List ( String, String )\n\n\n" +

    "port files : FileStructure -> Cmd msg\n\n\n" +

    "main : Program () () Never\n" +
    "main =\n" +
    // Note: This must take flags so that `getStructure` is not evaluated on
    // startup. We need it to be delayed by 1 tick so we have a chance for
    // hack-main.js to take effect first!
    "    Platform.worker\n" +
    "        { init = \\flags -> ( (), files fileStructure )\n" +
    "        , update = \\_ _ -> ( (), Cmd.none )\n" +
    "        , subscriptions = \\_ -> Sub.none\n" +
    "        }\n\n\n" +

    "classToSnippet : String -> a -> Css.Global.Snippet\n" +
    "classToSnippet str class =\n" +
    "    classToSnippet str class\n\n\n" + // This is just to make type-checking pass. We'll splice in a useful implementation after emitting.

    "globalStyleToString : Html.Styled.Html msg -> String\n" +
    "globalStyleToString node =\n" +
    "    \"\"\n"; // This is just to make type-checking pass. We'll splice in a useful implementation after emitting.

  return ["port module Main exposing (main)", imports, fileStructure, end].join(
    "\n\n\n"
  );
}

function generateStylesheet(modul /*: ModuleDeclaration */) {
  const entries = modul.values.map(function(value) {
    switch (value.signature) {
      case "Css.Global.Snippet":
        return modul.name + "." + value.name;
      case "DEPRECATED.Css.File.UniqueClass":
      case "DEPRECATED.Css.File.UniqueSvgClass":
        const className = classNameForValue(modul.name, value.name);

        return (
          'classToSnippet "' + className + '" ' + modul.name + "." + value.name
        );
      default:
        throw Error("Unsupported signature " + value.signature);
    }
  });

  return (
    "globalStyleToString (Css.Global.global [ " +
    entries.join(", ") +
    " ])"
  );
}

function generateModule(modul /*: ModuleDeclaration */) {
  const filename = modul.name.replace(".", path.sep) + ".css";
  return '( "' + filename + '", ' + generateStylesheet(modul) + " )";
}

module.exports = {
  writeMain: writeMain
};
