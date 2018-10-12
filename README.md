# elm-css-files

Use a CLI to generate .css files from elm-css code.

If you want to define auto-generated styles, you need to create a module named `Css.File` which contains (at a minimum) the following types:

```elm
module Css.File exposing (UniqueClass(..), UniqueSvgClass(..))

import Css exposing (Style)

type UniqueClass
    = UniqueClass (List Style)

type UniqueSvgClass
    = UniqueSvgClass (List Style)
```

The CLI recognizes exposed values of type `Css.File.UniqueClass` and `Css.File.UniqueSvgClass` and will assume they are structured this way. (That is, they have a single variant which contains only a `List Style`.)

See the `examples/` folder for an example of doing this in practice!
