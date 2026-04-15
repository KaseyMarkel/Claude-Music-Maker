import AppKit

// Hide the Dock icon so we appear only in the menu bar.
// (Equivalent to LSUIElement = true in an Info.plist.)
NSApplication.shared.setActivationPolicy(.accessory)

let delegate = AppDelegate()
NSApplication.shared.delegate = delegate

NSApplication.shared.run()
