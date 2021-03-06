// NOT flow-checked
// because flow will complain about our use of dynamic require().
const stylesheetsPort = "files";

module.exports = function extractCssResults(dest) {
  return new Promise(function(resolve, reject) {
    var Elm = require(dest).Elm;

    /*
      If you have a nested stylesheet Elm module like "My.Nested.Stylesheet"
      the resulting Elm object will be like that:

      Elm = {
        My: {
          Nested: {
            Stylesheet: { worker: function () {...} }
          }
        }
      }

      So we need to split the module name on each dot and iterate
      over the nested objects to reach the targeted one,
      starting with the Elm object itself
      */
    var stylesheetsModule = Elm.Main;
    var worker = stylesheetsModule.init(null);

    worker.ports[stylesheetsPort].subscribe(function(stylesheets) {
      resolve(stylesheets);
    });
  });
};
