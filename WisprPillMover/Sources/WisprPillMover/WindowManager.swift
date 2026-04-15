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
        let apps = findWisprApps()
        if apps.isEmpty {
            NSLog("[WisprPillMover] WISPR Flow is not running.")
            return false
        }

        // Collect windows across ALL wispr-related processes (Electron apps
        // typically split windows across several Helper (Renderer) processes).
        var candidates: [AXUIElement] = []
        for app in apps {
            let appElement = AXUIElementCreateApplication(app.processIdentifier)
            if let windows = axWindows(for: appElement) {
                candidates.append(contentsOf: windows)
            }
        }

        guard !candidates.isEmpty else {
            NSLog("[WisprPillMover] No windows found across WISPR processes.")
            return false
        }

        guard let (pill, pillSize) = findPillWindow(in: candidates) else {
            NSLog("[WisprPillMover] Could not identify the pill window.")
            return false
        }

        let target = targetPoint(for: position, pillSize: pillSize)
        return moveWindow(pill, to: target)
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
        return lines
    }

    // MARK: - App Discovery

    /// Return every running application whose bundle ID or name suggests
    /// it belongs to WISPR Flow (main process + Electron helpers).
    private static func findWisprApps() -> [NSRunningApplication] {
        let ownPid = getpid()
        var results: [NSRunningApplication] = []
        for app in NSWorkspace.shared.runningApplications {
            // Never match our own process.
            if app.processIdentifier == ownPid { continue }
            // Also skip by name just in case.
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

    /// List every on-screen window owned by WISPR, regardless of whether
    /// it is exposed via AX. Uses the lower-level CGWindowList API which
    /// sees every window that is actually rendered on screen.
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

    /// List every small (pill-sized-ish) on-screen window across ALL apps,
    /// not just WISPR. Useful if the pill is rendered by a process we
    /// didn't recognise (e.g. a system helper).
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

            // Focus on pill-ish shapes: short, moderate width.
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

    /// Generic string attribute reader.
    private static func axAttr(_ element: AXUIElement, _ attr: String) -> String? {
        var ref: CFTypeRef?
        guard AXUIElementCopyAttributeValue(element,
                                            attr as CFString,
                                            &ref) == .success else { return nil }
        return ref as? String
    }

    // MARK: - Pill Identification

    /// Find the pill among WISPR's windows. Heuristic: smallest window with
    /// width ≤ 700 and height ≤ 400. The range is wide because Electron
    /// apps often use oversized transparent BrowserWindows that draw a
    /// small pill-shaped UI inside.
    private static func findPillWindow(in windows: [AXUIElement]) -> (AXUIElement, CGSize)? {
        var best: (AXUIElement, CGSize)?
        var bestArea: CGFloat = .greatestFiniteMagnitude

        for win in windows {
            guard let size = axSize(of: win) else { continue }
            guard size.width > 0, size.height > 0 else { continue }
            // Exclude full "standard window" dashboards (Hub etc.).
            if let sub = axAttr(win, kAXSubroleAttribute),
               sub == kAXStandardWindowSubrole as String {
                continue
            }
            guard size.width <= 700, size.height <= 400 else { continue }
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
    ///
    /// WISPR Flow wraps its pill in a large (≈440×300) transparent Electron
    /// BrowserWindow, with the visible pill drawn roughly at the window's
    /// centre. To land the visible pill near a screen edge, we centre the
    /// window on that edge — the window's transparent padding is allowed to
    /// extend past the screen.
    private static func targetPoint(for position: PillPosition,
                                    pillSize: CGSize) -> CGPoint {
        let screen = NSScreen.main ?? NSScreen.screens.first!
        let sf = screen.frame         // NSScreen coords (origin bottom-left)
        let vf = screen.visibleFrame  // Excludes menu bar & Dock

        // Convert visibleFrame to Accessibility (AX) coordinates.
        //   AX origin = top-left of primary display.
        //   AX Y      = sf.height - NSScreen.Y - height
        let axVisibleTop    = sf.height - (vf.origin.y + vf.height)
        let axVisibleBottom = sf.height - vf.origin.y
        let axVisibleLeft   = vf.origin.x
        let axVisibleRight  = vf.origin.x + vf.width

        let pad   = Preferences.shared.edgePadding
        let halfW = pillSize.width  / 2
        let halfH = pillSize.height / 2

        // Where we want the visible pill's centre to be.
        let pillX: CGFloat
        let pillY: CGFloat

        switch position {
        case .bottomCenter:
            pillX = (axVisibleLeft + axVisibleRight) / 2
            pillY = axVisibleBottom - pad
        case .topLeft:
            pillX = axVisibleLeft  + pad
            pillY = axVisibleTop   + pad
        case .topRight:
            pillX = axVisibleRight - pad
            pillY = axVisibleTop   + pad
        case .bottomLeft:
            pillX = axVisibleLeft  + pad
            pillY = axVisibleBottom - pad
        case .bottomRight:
            pillX = axVisibleRight - pad
            pillY = axVisibleBottom - pad
        }

        // Convert desired pill-centre back to window top-left.
        return CGPoint(x: pillX - halfW, y: pillY - halfH)
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
