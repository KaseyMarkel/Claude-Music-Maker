import Foundation

/// Persists user preferences via UserDefaults.
final class Preferences {
    static let shared = Preferences()

    private let defaults = UserDefaults.standard

    private enum Keys {
        static let position      = "pillPosition"
        static let enforceTimer  = "enforcePosition"
        static let launchAtLogin = "launchAtLogin"
        static let padding       = "edgePadding"
    }

    /// The chosen pill position. Defaults to `.bottomCenter`.
    var position: PillPosition {
        get {
            guard let raw = defaults.string(forKey: Keys.position),
                  let pos = PillPosition(rawValue: raw) else {
                return .bottomCenter
            }
            return pos
        }
        set { defaults.set(newValue.rawValue, forKey: Keys.position) }
    }

    /// When true, a timer re-applies the position every few seconds so
    /// WISPR Flow can't reset it.
    var enforcePosition: Bool {
        get { defaults.bool(forKey: Keys.enforceTimer) }
        set { defaults.set(newValue, forKey: Keys.enforceTimer) }
    }

    /// Whether the app should launch at login (managed via a login item helper).
    var launchAtLogin: Bool {
        get { defaults.bool(forKey: Keys.launchAtLogin) }
        set { defaults.set(newValue, forKey: Keys.launchAtLogin) }
    }

    /// Padding (in points) from the screen edge. Defaults to 20.
    var edgePadding: CGFloat {
        get {
            let v = defaults.double(forKey: Keys.padding)
            return v > 0 ? v : 20
        }
        set { defaults.set(newValue, forKey: Keys.padding) }
    }
}
