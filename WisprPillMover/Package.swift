// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "WisprPillMover",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "WisprPillMover",
            path: "Sources/WisprPillMover",
            linkerSettings: [
                .unsafeFlags(["-framework", "Cocoa"]),
                .unsafeFlags(["-framework", "ApplicationServices"]),
            ]
        )
    ]
)
