import Foundation

/// Persists user preferences via UserDefaults.
final class Preferences {
    static let shared = Preferences()

    private let defaults = UserDefaults.standard

    private enum Keys {
        static let position         = "pillPosition"
        static let enforceTimer     = "enforcePosition"
        static let launchAtLogin    = "launchAtLogin"
        static let padding          = "edgePadding"
        static let baselineX        = "baselinePillX"
        static let baselineY        = "baselinePillY"
        static let baselineW        = "baselinePillWidth"
        static let baselineH        = "baselinePillHeight"
        static let cornerOvershoot  = "cornerOvershoot"
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

    /// How far (in points) the Electron window is pushed PAST the screen
    /// edge when snapping to a corner, so the visible pill (which sits
    /// inside a much larger transparent BrowserWindow) ends up close to
    /// the edge. Defaults to 130, which is roughly (window_width -
    /// visible_pill_width) / 2 for WISPR's current layout.
    var cornerOvershoot: CGFloat {
        get {
            let v = defaults.double(forKey: Keys.cornerOvershoot)
            return v > 0 ? v : 130
        }
        set { defaults.set(newValue, forKey: Keys.cornerOvershoot) }
    }

    // MARK: - Baseline (WISPR's own default pill position)

    /// WISPR's natural default pill frame in Accessibility coordinates.
    /// We capture this once (when the pill is detected at a reasonable
    /// position) and use it as the anchor for all five positions.
    var baselinePillFrame: CGRect? {
        get {
            guard defaults.object(forKey: Keys.baselineX) != nil else { return nil }
            return CGRect(
                x: defaults.double(forKey: Keys.baselineX),
                y: defaults.double(forKey: Keys.baselineY),
                width:  defaults.double(forKey: Keys.baselineW),
                height: defaults.double(forKey: Keys.baselineH)
            )
        }
        set {
            if let r = newValue {
                defaults.set(r.origin.x,    forKey: Keys.baselineX)
                defaults.set(r.origin.y,    forKey: Keys.baselineY)
                defaults.set(r.size.width,  forKey: Keys.baselineW)
                defaults.set(r.size.height, forKey: Keys.baselineH)
            } else {
                defaults.removeObject(forKey: Keys.baselineX)
                defaults.removeObject(forKey: Keys.baselineY)
                defaults.removeObject(forKey: Keys.baselineW)
                defaults.removeObject(forKey: Keys.baselineH)
            }
        }
    }
}
