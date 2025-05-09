import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(NodeJSPlugin)
public class NodeJSPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NodeJSPlugin" 
    public let jsName = "NodeJS" 
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
    ] 
    private let implementation = NodeJS()

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }
}
