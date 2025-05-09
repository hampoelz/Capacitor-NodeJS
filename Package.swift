// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorNodejs",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "NodeJSPlugin",
            targets: ["NodeJSPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "NodeJSPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/NodeJSPlugin"),
        .testTarget(
            name: "NodeJSPluginTests",
            dependencies: ["NodeJSPlugin"],
            path: "ios/Tests/NodeJSPluginTests")
    ]
)