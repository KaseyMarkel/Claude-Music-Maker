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
        guard let (pill, size, currentPos) = findPillWithFrame() else {
            NSLog("[WisprPillMover] Could not identify the pill window.")
            return false
        }

        // Opportunistically capture WISPR's default position the first
        // time we see the pill sitting on a visible screen.
        captureBaselineIfNeeded(currentPos: currentPos, size: size)

        let target = targetPoint(for: position,
                                 pillSize: size,
                                 currentPos: currentPos)
        return moveWindow(pill, to: target)
    }

    /// Explicitly (re)capture WISPR's current pill position as the baseline.
    /// Call after the user has positioned the pill manually (or quit/restarted
    /// WISPR so it snapped back to its own default).
    @discardableResult
    static func captureBaselineNow() -> Bool {
        guard let (_, size, pos) = findPillWithFrame() else { return false }
        Preferences.shared.baselinePillFrame =
            CGRect(origin: pos, size: size)
        NSLog("[WisprPillMover] Baseline captured: \(pos) \(size)")
        return true
    }

    /// Forget the saved baseline. Next successful pill detection will
    /// re-capture (assuming the pill is on a visible screen at that time).
    static func clearBaseline() {
        Preferences.shared.baselinePillFrame = nil
    }

    /// Move the pill to the centre of the main visible screen, regardless
    /// of baseline. Useful for rescuing a pill that has been pushed off-screen.
    @discardableResult
    static func recenterPill() -> Bool {
        guard let (pill, size, _) = findPillWithFrame() else { return false }
        let screen = NSScreen.main ?? NSScreen.screens.first!
        let vf = screen.visibleFrame
        let primaryH = primaryNSScreen().frame.height

        let axTop    = primaryH - (vf.origin.y + vf.height)
        let axBottom = primaryH - vf.origin.y
        let centerY  = (axTop + axBottom) / 2 - size.height / 2
        let centerX  = vf.origin.x + (vf.width - size.width) / 2

        return moveWindow(pill, to: CGPoint(x: centerX, y: centerY))
    }

    /// Dump info about every window across every WISPR-related process.
    static func debugListWindows() -> [String] {
        let apps = findWisprApps()
        if apps.isEmpty { return ["WISPR Flow not running."] }

        var lines: [String] = []
        for app in apps {
            let name = app.localizedName ?? "(?)"
            let pid  = app.processIdentifier
            let bid  = app.bundleIdentifier ?? "?"
            lines.append("── \(name) (pid \(pid), \(bid)) ──")

            let appElement = AXUIElementCreateApplication(pid)
            guard let windows = axWindows(for: appElement), !windows.isEmpty else {
                lines.append("   (no AX windows)")
                continue
            }

            for (i, win) in windows.enumerated() {
                let size  = axSize(of: win) ?? .zero
                let pos   = axPosition(of: win) ?? .zero
                let title = axTitle(of: win) ?? "(no title)"
                let role  = axAttr(win, kAXRoleAttribute) ?? "-"
                let sub   = axAttr(win, kAXSubroleAttribute) ?? "-"
                lines.append(
                    "   W\(i): \"\(title)\"  \(Int(size.width))x\(Int(size.height))  @\(Int(pos.x)),\(Int(pos.y))  role=\(role) sub=\(sub)"
                )
            }
        }

        // Include the currently stored baseline for reference.
        if let b = Preferences.shared.baselinePillFrame {
            lines.append("── Saved baseline ──")
            lines.append("   \(Int(b.width))x\(Int(b.height)) @\(Int(b.origin.x)),\(Int(b.origin.y))")
        } else {
            lines.append("── No baseline captured yet ──")
        }

        return lines
    }

    /// List every on-screen window owned by WISPR, regardless of whether
    /// it is exposed via AX.
    static func debugOnScreenWindows() -> [String] {
        let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
        guard let windows = CGWindowListCopyWindowInfo(options, kCGNullWindowID)
                as? [[String: Any]] else {
            return ["CGWindowListCopyWindowInfo failed."]
        }

        var lines: [String] = []
        for w in windows {
            let owner = w[kCGWindowOwnerName as String] as? String ?? "?"
            guard owner.localizedCaseInsensitiveContains("wispr"),
                  !owner.contains("WisprPillMover") else { continue }

            let name  = w[kCGWindowName as String] as? String ?? ""
            let pid   = w[kCGWindowOwnerPID as String] as? Int ?? 0
            let layer = w[kCGWindowLayer as String] as? Int ?? 0
            let wid   = w[kCGWindowNumber as String] as? Int ?? 0
            let alpha = w[kCGWindowAlpha as String] as? Double ?? -1
            let bounds = w[kCGWindowBounds as String] as? [String: CGFloat] ?? [:]
            let x = Int(bounds["X"] ?? 0)
            let y = Int(bounds["Y"] ?? 0)
            let width = Int(bounds["Width"] ?? 0)
            let height = Int(bounds["Height"] ?? 0)

            lines.append(
                "\(owner) [pid \(pid) wid \(wid) L\(layer) α\(alpha)] \"\(name)\" \(width)x\(height) @\(x),\(y)"
            )
        }
        return lines.isEmpty ? ["No WISPR windows on screen."] : lines
    }

    /// List every small on-screen window across ALL apps.
    static func debugAllSmallWindows() -> [String] {
        let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
        guard let windows = CGWindowListCopyWindowInfo(options, kCGNullWindowID)
                as? [[String: Any]] else {
            return ["CGWindowListCopyWindowInfo failed."]
        }

        var lines: [String] = []
        for w in windows {
            let bounds = w[kCGWindowBounds as String] as? [String: CGFloat] ?? [:]
            let width  = bounds["Width"]  ?? 0
            let height = bounds["Height"] ?? 0

            guard width  >= 40, width  <= 700 else { continue }
            guard height >= 20, height <= 300 else { continue }

            let owner = w[kCGWindowOwnerName as String] as? String ?? "?"
            if owner.contains("WisprPillMover") { continue }
            let name  = w[kCGWindowName as String] as? String ?? ""
            let pid   = w[kCGWindowOwnerPID as String] as? Int ?? 0
            let layer = w[kCGWindowLayer as String] as? Int ?? 0
            let alpha = w[kCGWindowAlpha as String] as? Double ?? -1
            let x = Int(bounds["X"] ?? 0)
            let y = Int(bounds["Y"] ?? 0)

            lines.append(
                "\(owner) [pid \(pid) L\(layer) α\(alpha)] \"\(name)\" \(Int(width))x\(Int(height)) @\(x),\(y)"
            )
        }
        return lines.isEmpty ? ["No small windows found."] : lines
    }

    // MARK: - App Discovery

    private static func findWisprApps() -> [NSRunningApplication] {
        let ownPid = getpid()
        var results: [NSRunningApplication] = []
        for app in NSWorkspace.shared.runningApplications {
            if app.processIdentifier == ownPid { continue }
            if (app.bundleIdentifier ?? "").contains("WisprPillMover") { continue }
            if (app.localizedName ?? "").contains("WisprPillMover") { continue }

            let name = app.localizedName ?? ""
            let bid  = app.bundleIdentifier ?? ""
            let exec = app.executableURL?.lastPathComponent ?? ""

            let bundleMatch = knownBundleIDs.contains { known in
                bid == known || bid.hasPrefix(known)
            } || bid.hasPrefix("com.electron.wispr")

            let nameMatch = processNameSubstrings.contains { sub in
                name.localizedCaseInsensitiveContains(sub)
                || exec.localizedCaseInsensitiveContains(sub)
                || bid.localizedCaseInsensitiveContains(sub)
            }

            if bundleMatch || nameMatch {
                results.append(app)
            }
        }
        return results
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

    private static func axAttr(_ element: AXUIElement, _ attr: String) -> String? {
        var ref: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element,
                                            attr as CFString,
                                            &ref) == .success else { return nil }
        return ref as? String
    }

    // MARK: - Pill Identification

    /// Find the pill element and return (element, size, position).
    private static func findPillWithFrame() -> (AXUIElement, CGSize, CGPoint)? {
        let apps = findWisprApps()
        if apps.isEmpty { return nil }

        var candidates: [(AXUIElement, CGSize, CGPoint)] = []
        for app in apps {
            let el = AXUIElementCreateApplication(app.processIdentifier)
            guard let wins = axWindows(for: el) else { continue }
            for w in wins {
                guard let size = axSize(of: w) else { continue }
                guard let pos  = axPosition(of: w) else { continue }
                guard size.width > 0, size.height > 0 else { continue }
                // Exclude full dashboards.
                if let sub = axAttr(w, kAXSubroleAttribute),
                   sub == kAXStandardWindowSubrole as String { continue }
                // Pill-ish size envelope.
                guard size.width <= 700, size.height <= 400 else { continue }
                candidates.append((w, size, pos))
            }
        }

        // Pick the smallest candidate.
        return candidates.min(by: { $0.1.width * $0.1.height < $1.1.width * $1.1.height })
    }

    // MARK: - Baseline

    private static func captureBaselineIfNeeded(currentPos: CGPoint,
                                                size: CGSize) {
        if Preferences.shared.baselinePillFrame != nil { return }

        // Only save if the current window center lies within some screen.
        let center = CGPoint(x: currentPos.x + size.width  / 2,
                             y: currentPos.y + size.height / 2)
        guard screenContaining(axPoint: center) != nil else {
            NSLog("[WisprPillMover] Skipping baseline capture (pill appears off-screen).")
            return
        }

        Preferences.shared.baselinePillFrame = CGRect(origin: currentPos, size: size)
        NSLog("[WisprPillMover] Captured baseline: \(currentPos) \(size)")
    }

    // MARK: - Screen Math

    /// The NSScreen whose frame origin is (0,0) — i.e. the primary display
    /// that owns the Accessibility coordinate origin.
    private static func primaryNSScreen() -> NSScreen {
        NSScreen.screens.first(where: { $0.frame.origin == .zero })
            ?? NSScreen.main
            ?? NSScreen.screens.first!
    }

    /// Convert an AX point (origin top-left of primary, Y down) to NSScreen
    /// coordinates (origin bottom-left of primary, Y up).
    private static func axToNS(_ p: CGPoint) -> CGPoint {
        let primaryH = primaryNSScreen().frame.height
        return CGPoint(x: p.x, y: primaryH - p.y)
    }

    /// Find the NSScreen that visually contains the given AX point.
    private static func screenContaining(axPoint: CGPoint) -> NSScreen? {
        let ns = axToNS(axPoint)
        for screen in NSScreen.screens where screen.frame.contains(ns) {
            return screen
        }
        return nil
    }

    /// Visible-frame edges converted into AX coordinates for a given screen.
    private static func axVisibleEdges(of screen: NSScreen)
        -> (top: CGFloat, bottom: CGFloat, left: CGFloat, right: CGFloat) {
        let primaryH = primaryNSScreen().frame.height
        let vf = screen.visibleFrame
        return (
            top:    primaryH - (vf.origin.y + vf.height),
            bottom: primaryH - vf.origin.y,
            left:   vf.origin.x,
            right:  vf.origin.x + vf.width
        )
    }

    // MARK: - Positioning

    /// Compute the target AX point to place the pill's Electron window at.
    ///
    /// Anchoring strategy:
    /// - Bottom Y is pulled from the saved baseline (WISPR's own default).
    /// - Top Y mirrors that distance about the visible area's vertical axis.
    /// - X is centred (using baseline X if available) or pushed to an edge
    ///   with `cornerOvershoot`, so the pill's visible body lands at/near
    ///   the screen edge rather than the large transparent window's edge.
    private static func targetPoint(for position: PillPosition,
                                    pillSize: CGSize,
                                    currentPos: CGPoint) -> CGPoint {
        // Pick the screen that currently hosts the pill; fall back to main.
        let screen = screenContaining(axPoint:
                        CGPoint(x: currentPos.x + pillSize.width  / 2,
                                y: currentPos.y + pillSize.height / 2))
                  ?? NSScreen.main
                  ?? NSScreen.screens.first!
        let edges = axVisibleEdges(of: screen)

        // ---- Y anchors ----
        let bottomY: CGFloat
        if let b = Preferences.shared.baselinePillFrame {
            bottomY = b.origin.y
        } else {
            // Fallback: sit the window just above the bottom edge.
            bottomY = edges.bottom - pillSize.height - 20
        }
        // Top Y is a window-level mirror of the baseline about the visible
        // frame. If the baseline window bottom is N points from screen bottom,
        // the mirrored window top will be N points from screen top.
        let bottomInset = edges.bottom - (bottomY + pillSize.height)
        let topY = edges.top + bottomInset

        // ---- X anchors ----
        let centerX: CGFloat
        if let b = Preferences.shared.baselinePillFrame {
            centerX = b.origin.x
        } else {
            centerX = edges.left + ((edges.right - edges.left) - pillSize.width) / 2
        }
        let over = Preferences.shared.cornerOvershoot
        let leftX  = edges.left  - over
        let rightX = edges.right - pillSize.width + over

        switch position {
        case .bottomCenter: return CGPoint(x: centerX, y: bottomY)
        case .bottomLeft:   return CGPoint(x: leftX,   y: bottomY)
        case .bottomRight:  return CGPoint(x: rightX,  y: bottomY)
        case .topLeft:      return CGPoint(x: leftX,   y: topY)
        case .topRight:     return CGPoint(x: rightX,  y: topY)
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
