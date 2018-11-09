module Dreamwriter.Editor exposing (editor, headerBar, purpleCircle, testStylesheet)

import Css exposing (..)
import Css.File exposing (Stylesheet, UniqueClass, UniqueSvgClass, stylesheet, uniqueClass, uniqueSvgClass)
import Css.Global exposing (..)


editor : Snippet
editor =
    div [ color (hex "ff0000") ]


testStylesheet : Stylesheet
testStylesheet =
    stylesheet
        [ header [ height (px 40) ]
        , footer [ height (px 100) ]
        ]


headerBar : UniqueClass
headerBar =
    uniqueClass [ color (hex "ccbba9"), textDecoration none ]


purpleCircle : UniqueSvgClass
purpleCircle =
    uniqueSvgClass [ backgroundColor (hex "ccbba9") ]
