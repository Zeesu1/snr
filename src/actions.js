import chalk from "chalk";
import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { exec, execSync } from "child_process";
import inquirer from "inquirer";
import fetch from "node-fetch";

import { PKG, REGISTRIES, REGISTRY_WHITE_LIST } from "./constants.js";
import {
  exit,
  geneDashLine,
  printError,
  printMessages,
  printSuccess,
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getCurrentOrigin = async () => {
  return execSync("npm get registry", { encoding: "utf-8" });
};

const listFn = async () => {
  const curRegistry = await getCurrentOrigin();

  const keys = Object.keys(REGISTRIES);

  const max = Math.max(...keys.map((v) => v.length)) + 3;
  const messages = [];
  keys.forEach((k) => {
    const newK =
      REGISTRIES[k][["registry"]] == curRegistry.trim() ? "* " + k : "  " + k;
    const Arr = new Array(...newK);
    Arr.length = max;
    const prefix = Array.from(Arr)
      .map((v) => (v ? v : "-"))
      .join("");

    messages.push(prefix + "  " + REGISTRIES[k]["registry"]);
  });

  printMessages(messages);
};

const useFn = async () => {
  inquirer
    .prompt([
      {
        type: "list",
        name: "reg",
        message: "请选择镜像",
        choices: Object.keys(REGISTRIES),
      },
    ])
    .then((res) => {
      const reg = REGISTRIES[res.reg]["registry"];

      exec(`npm config set registry ${reg}`, null, (err, stdout, stderr) => {
        if (err) {
          printError(err);
        } else {
          printSuccess("切换成功");
        }
      });
    });
};

const currentFn = async () => {
  const curRegistry = await getCurrentOrigin();
  const v = Object.keys(REGISTRIES).find((k) => {
    if (REGISTRIES[k]["registry"] === curRegistry.trim()) {
      return k;
    }
  });
  if (v) {
    console.log(chalk.blue("当前源:", v));
  } else {
    console.log(chalk.green("当前源:", curRegistry));
  }
};

const addFn = async () => {
  inquirer
    .prompt([
      {
        type: "input",
        name: "name",
        message: "请输入镜像名称",
        validate (answer) {
          const keys = Object.keys(REGISTRIES);
          if (keys.includes(answer)) {
            return `不能起名'${answer}'跟保留字冲突`;
          }
          if (!answer.trim()) {
            return "名称不能为空";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "registry",
        message: "请输入镜像地址",
        validate (answer) {
          if (!answer.trim()) {
            return `url 不能为空`;
          }
          return true;
        },
      },
    ])
    .then((res) => {
      REGISTRIES[res.name] = {
        home: res.name.trim(),
        registry: res.registry.trim(),
      };
      try {
        fs.writeFileSync(
          join(__dirname, "../registries.json"),
          JSON.stringify(REGISTRIES, null, 2)
        );
        printSuccess("添加完成");
      } catch (err) {
        printError(err);
      }
    });
};

const deleteFn = async () => {
  const keys = Object.keys(REGISTRIES);
  if (keys.every((k) => REGISTRIES.includes(k))) {
    return console.log(chalk.red("当前无自定义源可以删除"));
  } else {
    const external = keys.filter((key) => !REGISTRY_WHITE_LIST.includes(key));
    inquirer
      .prompt([
        {
          type: "list",
          name: "registry",
          message: "请选择要删除的镜像",
          choices: external,
        },
      ])
      .then(async (res) => {
        const curRegistry = await getCurrentOrigin();
        const selOrigin = REGISTRIES[res.registry];
        if (curRegistry.trim() == selOrigin.registry.trim()) {
          console.log(
            chalk.red(
              `当前还在使用该镜像${REGISTRIES[res.registry].registry
              },请切换其他镜像删除`
            )
          );
        } else {
          try {
            delete REGISTRIES[res.registry];

            fs.writeFileSync(
              path.join(__dirname, "../registries.json"),
              JSON.stringify(REGISTRIES, null, 2)
            );

            printSuccess("操作完成");
          } catch (e) {
            printError(err);
          }
        }
      });
  }
};

const testFn = async (target) => {
  const timeout = 5000;

  if (target && !Object.keys(REGISTRIES).includes(target)) {
    printError(`'${target}' is not found.`);
    return exit();
  }

  const sources = target ? { [target]: REGISTRIES[target] } : REGISTRIES;

  const results = await Promise.all(
    Object.keys(sources).map(async (name) => {
      const { registry } = sources[name];
      const start = Date.now();
      let status = false;
      let isTimeout = false;
      try {
        const response = await fetch(registry + PKG.name, { timeout });
        status = response.ok;
      } catch (error) {
        isTimeout = error.type === "request-timeout";
      }
      return {
        name,
        registry,
        success: status,
        time: Date.now() - start,
        isTimeout,
      };
    })
  );

  const [fastest] = results
    .filter((each) => each.success)
    .map((each) => each.time)
    .sort((a, b) => a - b);

  const messages = [];
  const curRegistry = await getCurrentOrigin();
  const errorMsg = chalk.red(" (请求失败...)");
  const timeoutMsg = chalk.yellow(` (请求时间： ${timeout} ms)`);
  const length = Math.max(...Object.keys(sources).map((key) => key.length)) + 3;
  results.forEach(({ registry, success, time, name, isTimeout }) => {
    const isFastest = time === fastest;
    const prefix = registry === curRegistry.trim() ? chalk.green("* ") : "  ";
    let suffix =
      isFastest && !target
        ? chalk.bgGreenBright(time + " ms")
        : isTimeout
          ? "timeout"
          : `${time} ms`;
    if (!success) {
      suffix += isTimeout ? timeoutMsg : errorMsg;
    }
    messages.push(prefix + name + geneDashLine(name, length) + suffix);
  });
  printMessages(messages);
  return messages;
};

export { listFn, useFn, currentFn, addFn, deleteFn, testFn };
