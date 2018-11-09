module Dreamwriter.Sidebar exposing (chapter, menu)

import Css exposing (..)
import Css.File exposing (UniqueClass, uniqueClass)
import Css.Global exposing (..)


menu : Snippet
menu =
    button [ color (hex "aabbcc"), textDecoration none ]


chapter : UniqueClass
chapter =
    uniqueClass [ color (hex "eeeeee"), backgroundColor (hex "aabbcc") ]
