import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {

    private var statusBarController: StatusBarController!
    private var enforceTimer: Timer?

    // How often (seconds) to re-apply position when enforcement is on.
    private let enforceInterval: TimeInterval = 3

    // MARK: - Lifecycle

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Request Accessibility permission early so the user sees the prompt.
        promptAccessibilityIfNeeded()

        statusBarController = StatusBarController { [weak self] position in
            self?.applyPosition(position)
        }

        // Watch for WISPR Flow (re-)launching.
        NSWorkspace.shared.notificationCenter.addObserver(
            self,
            selector: #selector(appDidLaunch(_:)),
            name: NSWorkspace.didLaunchApplicationNotification,
            object: nil
        )

        // Apply on startup.
        applyPosition(Preferences.shared.position)
        syncEnforceTimer()
    }

    // MARK: - Position Application

    private func applyPosition(_ position: PillPosition) {
        WindowManager.movePill(to: position)
        syncEnforceTimer()
    }

    private func syncEnforceTimer() {
        enforceTimer?.invalidate()
        enforceTimer = nil

        guard Preferences.shared.enforcePosition else { return }

        enforceTimer = Timer.scheduledTimer(withTimeInterval: enforceInterval,
                                            repeats: true) { _ in
            WindowManager.movePill(to: Preferences.shared.position)
        }
    }

    // MARK: - WISPR Launch Observer

    @objc private func appDidLaunch(_ note: Notification) {
        guard let app = note.userInfo?[NSWorkspace.applicationUserInfoKey]
                as? NSRunningApplication else { return }

        let name = app.localizedName ?? ""
        let bid  = app.bundleIdentifier ?? ""

        let isWispr = name.localizedCaseInsensitiveContains("wispr")
                   || bid.localizedCaseInsensitiveContains("wispr")

        guard isWispr else { return }

        // Give the app a moment to create its pill window, then reposition.
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
            guard let self else { return }
            self.applyPosition(Preferences.shared.position)
        }
    }

    // MARK: - Accessibility

    private func promptAccessibilityIfNeeded() {
        let options = [kAXTrustedCheckOptionPrompt.takeRetainedValue(): true] as CFDictionary
        let trusted = AXIsProcessTrustedWithOptions(options)
        if !trusted {
            NSLog("[WisprPillMover] Accessibility permission not yet granted. " +
                  "The system prompt should appear now.")
        }
    }
}
