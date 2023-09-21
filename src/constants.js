import PKG from "../package.json" assert { type: "json" };
import REGISTRIES from "../registries.json" assert { type: "json" };

const REGISTRY_WHITE_LIST = [
  "npm",
  "yarn",
  "tencent",
  "cnpm",
  "taobao",
  "npmMirror",
];

export { REGISTRIES, PKG, REGISTRY_WHITE_LIST };
