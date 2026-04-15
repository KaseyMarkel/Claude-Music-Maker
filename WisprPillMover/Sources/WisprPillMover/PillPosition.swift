import Foundation

/// The five supported positions for the WISPR Flow pill.
enum PillPosition: String, CaseIterable, Codable {
    case bottomCenter = "bottom-center"
    case topLeft      = "top-left"
    case topRight     = "top-right"
    case bottomLeft   = "bottom-left"
    case bottomRight  = "bottom-right"

    var menuTitle: String {
        switch self {
        case .bottomCenter: return "Bottom Center (Default)"
        case .topLeft:      return "Top Left"
        case .topRight:     return "Top Right"
        case .bottomLeft:   return "Bottom Left"
        case .bottomRight:  return "Bottom Right"
        }
    }

    var shortcut: String {
        switch self {
        case .bottomCenter: return "1"
        case .topLeft:      return "2"
        case .topRight:     return "3"
        case .bottomLeft:   return "4"
        case .bottomRight:  return "5"
        }
    }
}
