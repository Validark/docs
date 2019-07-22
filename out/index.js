"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const OUTPUT_FOLDER = "C:/Users/blach/Documents/GitHub/dumpling/" || path_1.default.join(__dirname, "..");
const project = new ts_morph_1.Project({
    tsConfigFilePath: path_1.default.join(__dirname, "..", "include", "tsconfig.json")
});
const main = project.getSourceFileOrThrow("include/generated/None.d.ts");
const servicesInterface = main.getInterfaceOrThrow("Services");
const instancesInterface = main.getInterfaceOrThrow("Instances");
const creatableInstancesInterface = main.getInterfaceOrThrow("CreatableInstances");
const instanceInterfaces = main
    .getInterfaces()
    .filter(i => i !== servicesInterface && i !== instancesInterface && i !== creatableInstancesInterface);
function writeFileSync(filePath, data) {
    const pathValues = filePath.normalize().split("/");
    const fileName = pathValues.pop();
    let currentDirectory = OUTPUT_FOLDER;
    for (const folderName of pathValues) {
        fs_1.default.existsSync(currentDirectory) || fs_1.default.mkdirSync(currentDirectory);
        currentDirectory = path_1.default.join(currentDirectory, folderName);
    }
    fs_1.default.existsSync(currentDirectory) || fs_1.default.mkdirSync(currentDirectory);
    fs_1.default.writeFileSync(path_1.default.join(currentDirectory, fileName), data);
}
function processInterface(instanceName, docs, target, typeInfo) {
    let source = new Array();
    let tags = new Array();
    for (const doc of docs) {
        const text = doc.getText();
        const client_serverTag = text.match(/^\/\*\* @rbxts (server|client) \*\/$/);
        if (client_serverTag)
            tags.push(client_serverTag[1].replace(/^\w/, s => s.toUpperCase()));
        else {
            const lines = text.split("\n");
            lines.pop();
            lines.shift();
            source.push(lines
                .map(line => line.replace(/^\s+\* ?/, ""))
                .join("")
                .replace(/Tags: ([\w, ]+)/, (_, s) => {
                tags.push(...s.split(", "));
                return "";
            }));
        }
    }
    source.unshift("");
    source.unshift("+++");
    if (tags.length > 0)
        source.unshift(`Tags = "${tags.join(", ")}"`);
    if (typeInfo)
        source.unshift("Type = " + typeInfo);
    source.unshift(`Target = "${instanceName}${target === "index" ? "" : "." + target}"`);
    source.unshift("+++");
    writeFileSync(`content/Instances/${instanceName}/${target.replace(/^\["/, "").replace(/"]$/, "")}.md`, source.join("\n"));
}
for (const instanceInterface of instanceInterfaces) {
    const instanceName = instanceInterface.getName();
    console.log(instanceName);
    processInterface(instanceName, instanceInterface.getJsDocs(), "index");
    for (const property of instanceInterface.getProperties().filter(property => property.getName() !== "ClassName")) {
        processInterface(instanceName, property.getJsDocs(), property.getName(), property.getType().getText());
    }
    for (const method of instanceInterface.getMethods()) {
        processInterface(instanceName, method.getJsDocs(), method.getName(), method.getType().getText());
    }
}
//# sourceMappingURL=index.js.map