module Css.File exposing (UniqueClass(..), UniqueSvgClass(..), uniqueClass, uniqueSvgClass)

import Css exposing (Style)


{-| Styles scoped under an automatically-generated class.
-}
type UniqueClass
    = UniqueClass (List Style)


{-| Styles scoped under an automatically-generated class. Use these for <svg>
elements, as they require a different mechanism for specifying their class
which is not compatible with the way non-SVG elements do it.
-}
type UniqueSvgClass
    = UniqueSvgClass (List Style)


{-| Create a style scoped under an automatically-generated class that is
guaranteed to be unique - at least relative to other class names generated
using this function!

Note: Use [`uniqueSvgClass`](#uniqueSvgClass) for classes that will be used
with SVG elements. These will not work with them!

-}
uniqueClass : List Style -> UniqueClass
uniqueClass =
    UniqueClass


{-| Create a style scoped under an automatically-generated class that is
guaranteed to be unique - at least relative to other class names generated
using this function!

Note: Use [`uniqueClass`](#uniqueClass) for classes that will be used with
SVG elements. These will only work with SVGs!

-}
uniqueSvgClass : List Style -> UniqueSvgClass
uniqueSvgClass =
    UniqueSvgClass
