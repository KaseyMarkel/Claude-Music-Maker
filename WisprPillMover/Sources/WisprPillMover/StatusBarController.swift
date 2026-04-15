import AppKit

/// Manages the menu-bar status item and its dropdown menu.
final class StatusBarController {

    private var statusItem: NSStatusItem!
    private var onPositionChanged: ((PillPosition) -> Void)?

    init(onPositionChanged: @escaping (PillPosition) -> Void) {
        self.onPositionChanged = onPositionChanged

        statusItem = NSStatusBar.system.statusItem(
            withLength: NSStatusItem.squareLength
        )

        if let button = statusItem.button {
            // SF Symbol for a move cursor; falls back to text.
            if let img = NSImage(systemSymbolName: "arrow.up.and.down.and.arrow.left.and.right",
                                 accessibilityDescription: "WISPR Pill Mover") {
                img.isTemplate = true
                button.image = img
            } else {
                button.title = "WPM"
            }
            button.toolTip = "WISPR Pill Mover"
        }

        statusItem.menu = buildMenu()
    }

    /// Rebuild the menu (e.g., after a position change).
    func refreshMenu() {
        statusItem.menu = buildMenu()
    }

    // MARK: - Menu Construction

    private func buildMenu() -> NSMenu {
        let menu = NSMenu(title: "WISPR Pill Mover")
        let current = Preferences.shared.position

        // ---- Position choices ----
        let header = NSMenuItem(title: "Move Pill To:", action: nil, keyEquivalent: "")
        header.isEnabled = false
        menu.addItem(header)

        for pos in PillPosition.allCases {
            let item = NSMenuItem(
                title: pos.menuTitle,
                action: #selector(positionSelected(_:)),
                keyEquivalent: pos.shortcut
            )
            item.target = self
            item.representedObject = pos
            item.state = (pos == current) ? .on : .off
            menu.addItem(item)
        }

        menu.addItem(.separator())

        // ---- Enforce toggle ----
        let enforceItem = NSMenuItem(
            title: "Re-apply Position Continuously",
            action: #selector(toggleEnforce(_:)),
            keyEquivalent: "e"
        )
        enforceItem.target = self
        enforceItem.state = Preferences.shared.enforcePosition ? .on : .off
        menu.addItem(enforceItem)

        // ---- Move now ----
        let moveNow = NSMenuItem(
            title: "Move Now",
            action: #selector(moveNowClicked(_:)),
            keyEquivalent: "m"
        )
        moveNow.target = self
        menu.addItem(moveNow)

        menu.addItem(.separator())

        // ---- Debug ----
        let debugItem = NSMenuItem(
            title: "List WISPR Windows (Debug)",
            action: #selector(debugWindows(_:)),
            keyEquivalent: "d"
        )
        debugItem.target = self
        menu.addItem(debugItem)

        menu.addItem(.separator())

        // ---- Quit ----
        let quit = NSMenuItem(
            title: "Quit WISPR Pill Mover",
            action: #selector(quitApp(_:)),
            keyEquivalent: "q"
        )
        quit.target = self
        menu.addItem(quit)

        return menu
    }

    // MARK: - Actions

    @objc private func positionSelected(_ sender: NSMenuItem) {
        guard let pos = sender.representedObject as? PillPosition else { return }
        Preferences.shared.position = pos
        onPositionChanged?(pos)
        refreshMenu()
    }

    @objc private func toggleEnforce(_ sender: NSMenuItem) {
        Preferences.shared.enforcePosition.toggle()
        onPositionChanged?(Preferences.shared.position)
        refreshMenu()
    }

    @objc private func moveNowClicked(_ sender: NSMenuItem) {
        onPositionChanged?(Preferences.shared.position)
    }

    @objc private func debugWindows(_ sender: NSMenuItem) {
        let lines = WindowManager.debugListWindows()
        let msg = lines.joined(separator: "\n")

        let alert = NSAlert()
        alert.messageText = "WISPR Flow Windows"
        alert.informativeText = msg.isEmpty ? "No windows found." : msg
        alert.alertStyle = .informational
        alert.runModal()
    }

    @objc private func quitApp(_ sender: NSMenuItem) {
        NSApp.terminate(nil)
    }
}
