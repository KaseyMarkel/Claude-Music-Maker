import AppKit
import ApplicationServices

/// Finds the WISPR Flow pill window and repositions it using the macOS
/// Accessibility API.
final class WindowManager {

    // Known bundle identifiers for WISPR Flow (try each).
    private static let knownBundleIDs = [
        "com.wispr.flow",
        "ai.wispr.flow",
        "com.wisprflow.app",
    ]

    // Fallback: match by process name.
    private static let processNameSubstrings = ["wispr", "Wispr", "WISPR"]

    // MARK: - Public

    /// Move the WISPR Flow pill to `position`. Returns `true` on success.
    @discardableResult
    static func movePill(to position: PillPosition) -> Bool {
        guard let app = findWisprApp() else {
            NSLog("[WisprPillMover] WISPR Flow is not running.")
            return false
        }

        let appElement = AXUIElementCreateApplication(app.processIdentifier)

        guard let windows = axWindows(for: appElement) else {
            NSLog("[WisprPillMover] Could not enumerate WISPR windows.")
            return false
        }

        // The pill is the smallest window (usually ≤ 300 x 100 pt).
        guard let (pill, pillSize) = findPillWindow(in: windows) else {
            NSLog("[WisprPillMover] Could not identify the pill window.")
            return false
        }

        let target = targetPoint(for: position, pillSize: pillSize)
        return moveWindow(pill, to: target)
    }

    /// Dump info about all WISPR windows for debugging.
    static func debugListWindows() -> [String] {
        guard let app = findWisprApp() else { return ["WISPR Flow not running."] }
        let appElement = AXUIElementCreateApplication(app.processIdentifier)
        guard let windows = axWindows(for: appElement) else { return ["No windows found."] }

        var lines: [String] = []
        for (i, win) in windows.enumerated() {
            let size = axSize(of: win) ?? .zero
            let pos  = axPosition(of: win) ?? .zero
            let title = axTitle(of: win) ?? "(no title)"
            lines.append("Window \(i): \"\(title)\"  size=\(size)  pos=\(pos)")
        }
        return lines
    }

    // MARK: - App Discovery

    private static func findWisprApp() -> NSRunningApplication? {
        let apps = NSWorkspace.shared.runningApplications

        // Try bundle ID first.
        for bid in knownBundleIDs {
            if let app = apps.first(where: { $0.bundleIdentifier == bid }) {
                return app
            }
        }

        // Fallback: match by localized name or executable name.
        for app in apps {
            let name = app.localizedName ?? ""
            let exec = app.executableURL?.lastPathComponent ?? ""
            for sub in processNameSubstrings {
                if name.contains(sub) || exec.contains(sub) {
                    return app
                }
            }
        }

        return nil
    }

    // MARK: - Accessibility Helpers

    private static func axWindows(for appElement: AXUIElement) -> [AXUIElement]? {
        var ref: CFTypeRef?
        let err = AXUIElementCopyAttributeValue(appElement,
                                                kAXWindowsAttribute as CFString,
                                                &ref)
        guard err == .success, let array = ref as? [AXUIElement] else { return nil }
        return array
    }

    private static func axSize(of element: AXUIElement) -> CGSize? {
        var ref: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element,
                                            kAXSizeAttribute as CFString,
                                            &ref) == .success,
              let val = ref else { return nil }
        var size = CGSize.zero
        AXValueGetValue(val as! AXValue, .cgSize, &size)
        return size
    }

    private static func axPosition(of element: AXUIElement) -> CGPoint? {
        var ref: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element,
                                            kAXPositionAttribute as CFString,
                                            &ref) == .success,
              let val = ref else { return nil }
        var point = CGPoint.zero
        AXValueGetValue(val as! AXValue, .cgPoint, &point)
        return point
    }

    private static func axTitle(of element: AXUIElement) -> String? {
        var ref: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element,
                                            kAXTitleAttribute as CFString,
                                            &ref) == .success else { return nil }
        return ref as? String
    }

    // MARK: - Pill Identification

    /// Find the pill among WISPR's windows. Heuristic: smallest window with
    /// width ≤ 400 and height ≤ 120.
    private static func findPillWindow(in windows: [AXUIElement]) -> (AXUIElement, CGSize)? {
        var best: (AXUIElement, CGSize)?
        var bestArea: CGFloat = .greatestFiniteMagnitude

        for win in windows {
            guard let size = axSize(of: win) else { continue }
            guard size.width > 0, size.height > 0 else { continue }
            guard size.width <= 400, size.height <= 120 else { continue }
            let area = size.width * size.height
            if area < bestArea {
                bestArea = area
                best = (win, size)
            }
        }
        return best
    }

    // MARK: - Positioning

    /// Compute the target point in Accessibility coordinates (origin at
    /// top-left of the primary display, Y increases downward).
    private static func targetPoint(for position: PillPosition,
                                    pillSize: CGSize) -> CGPoint {
        guard let screen = NSScreen.main else { return .zero }

        let sf = screen.frame         // NSScreen coords (origin bottom-left)
        let vf = screen.visibleFrame  // Excludes menu bar & Dock

        // Convert visibleFrame to Accessibility (AX) coordinates.
        //   AX origin = top-left of primary display.
        //   AX Y      = sf.height - NSScreen.Y - height
        let axVisibleTop    = sf.height - (vf.origin.y + vf.height)
        let axVisibleBottom = sf.height - vf.origin.y
        let axVisibleLeft   = vf.origin.x
        let axVisibleRight  = vf.origin.x + vf.width

        let pad = Preferences.shared.edgePadding

        switch position {
        case .bottomCenter:
            let x = (axVisibleLeft + axVisibleRight) / 2 - pillSize.width / 2
            let y = axVisibleBottom - pillSize.height - pad
            return CGPoint(x: x, y: y)

        case .topLeft:
            return CGPoint(x: axVisibleLeft + pad,
                           y: axVisibleTop + pad)

        case .topRight:
            return CGPoint(x: axVisibleRight - pillSize.width - pad,
                           y: axVisibleTop + pad)

        case .bottomLeft:
            return CGPoint(x: axVisibleLeft + pad,
                           y: axVisibleBottom - pillSize.height - pad)

        case .bottomRight:
            return CGPoint(x: axVisibleRight - pillSize.width - pad,
                           y: axVisibleBottom - pillSize.height - pad)
        }
    }

    /// Set the AX position of a window.
    private static func moveWindow(_ window: AXUIElement, to point: CGPoint) -> Bool {
        var p = point
        guard let value = AXValueCreate(.cgPoint, &p) else { return false }
        let err = AXUIElementSetAttributeValue(window,
                                               kAXPositionAttribute as CFString,
                                               value)
        if err != .success {
            NSLog("[WisprPillMover] AXUIElementSetAttributeValue failed: \(err.rawValue)")
        }
        return err == .success
    }
}
