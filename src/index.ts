#!/usr/bin/env node

// pnpx create-ts@kb
// pnpx create-ts@kb ./dirName

import * as fs from "fs";
import { join as joinPath } from "path";
import { execSync as exec } from "child_process";
import chalk from "chalk";
import { input } from "@inquirer/prompts";
import { createSpinner } from "nanospinner";
const sleep = (ms = 200) => new Promise((r) => setTimeout(r, ms));
const cwd = process.cwd();
const CONFIGPATH = "./createConfig.json";
const CONFIG = JSON.parse(fs.readFileSync(CONFIGPATH, "utf8"));
const DPM = CONFIG["default_package_manager"] || "pnpm";
const execCommand = async (command: string, cwd: string) => {
  const spinner = createSpinner(`${command}`).start();
  exec(command, { cwd: cwd });
  await sleep();
  spinner.success();
};
const main = async (pm: string) => {
  const devDependencies = [
    "typescript",
    "@types/node",
    "prettier",
    "eslint",
    "eslint-config-prettier ",
    "eslint-plugin-prettier ",
    "@typescript-eslint/eslint-plugin ",
    "@typescript-eslint/parser",
    "nodemon",
  ];
  const dirName = await getDirName();
  const appDir = joinPath(cwd, dirName);
  console.log(chalk.bgBlue.black("dir:"), chalk.yellow(appDir));
  fs.mkdirSync(appDir);
  switch (pm) {
    case "npm":
      await execCommand(`${pm} init -y`, appDir);
      break;
    case "pnpm":
      await execCommand(`${pm} init `, appDir);
      break;
    default:
      console.error(
        "invalid package manager, unable to initialize project:",
        pm,
      );
      process.exit(1);
  }

  await sleep();
  await execCommand("git init", appDir);
  installDev(pm, devDependencies, appDir);
  writePrettierrc(appDir);
  writeEslint(appDir);
  writeTsConf(appDir);
  addGitIgnore(appDir);

  await execCommand(`${pm} pkg set scripts.build="tsc"`, appDir);
  await execCommand(`${pm} pkg set scripts.dev="npx nodemon"`, appDir);
  await execCommand(
    `${pm} pkg set scripts.start="ts-node src/index.ts"`,
    appDir,
  );

  addNodemon(appDir);
  fs.mkdirSync(joinPath(appDir, "src"));
  fs.writeFileSync(
    joinPath(appDir, "src/index.ts"),
    "console.log('Hello World!')",
  );
  setupSuccessLog();
  process.exit(0);
};

const validateDirname = (value: string): true | string => {
  const invalidChars = /[<>:"/\\|?*]/;
  if (value === "." || value === "./") return true;
  if (!invalidChars.test(value)) return true;
  if (value.length > 255) return "Dir name must be between 1-255 char long.";
  if (value.startsWith("./") && !invalidChars.test(value.substring(2)))
    return true;
  return "invalid fileName";
};

const getDirName = async () => {
  const answer = await input({
    message: "What would you name your project? ",
    default: "ts_app",
    validate: validateDirname,
  });
  return answer;
};

const installDev = (pm: string, depen: string[], cwd: string) => {
  depen.forEach((d) => {
    const spinner = createSpinner(`+ ${chalk.blueBright(d)}`).start();
    switch (pm) {
      case "pnpm":
        exec(`pnpm add -D ${d}`, { cwd: cwd });
        break;
      case "npm":
        exec(`npm i -D ${d}`, { cwd: cwd });
        break;
      default:
        console.error(
          "invalid package manager, unable to install devDependencies",
          pm,
        );
        process.exit(1);
    }
    spinner.success();
  });
};

const writeFile = (dirPath: string, fileName: string, data: string) => {
  const spinner = createSpinner(`Writing ${fileName}`).start();
  try {
    fs.writeFileSync(joinPath(dirPath, fileName), data);
    spinner.success();
  } catch (err) {
    spinner.error();
    console.log(chalk.red(`Unable to write: -${fileName}`));
  }
};

const writePrettierrc = (dirPath: string) => {
  const data =
    '{"tabWidth": 2,"printWidth": 80,"trailingComma": "all","semi": true}';
  writeFile(dirPath, ".prettierrc", data);
};

const writeEslint = (dirPath: string) => {
  const data = `{
    "extends": [
        "prettier",
        "plugin:@typescript-eslint/recommended",
        "prettier/@typescript-eslint"
    ],
    "parser": "@typescript-eslint/parser"
}`;
  writeFile(dirPath, ".eslintrc.json", data);
};
const writeTsConf = (dirPath: string) => {
  const data = `{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "allowJs": true,
    "moduleResolution": "NodeNext",
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "declaration": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true, // Enable all strict type-checking options
    "noImplicitAny": true, // Raise error on expressions with an implicit 'any' type
    "strictNullChecks": true, // Ensure that null and undefined are handled explicitly
    "strictFunctionTypes": true, // Check function parameter bivariance
    "strictPropertyInitialization": true, // Ensure class properties are correctly initialized
    "noImplicitThis": true, // Raise error on 'this' expressions with an implicit 'any' type
    "alwaysStrict": true, // Enforce strict mode in all files
    "noUnusedLocals": true, // Report errors on unused local variables
    "noUnusedParameters": true, // Report errors on unused function parameters
    "noImplicitReturns": true, // Ensure that all code paths in a function return a value
    "noFallthroughCasesInSwitch": true // Ensure switch statements have a default case or handle all possible values
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
`;
  writeFile(dirPath, "tsconfig.json", data);
};

const addGitIgnore = (dirPath: string) => {
  const data = `# Distribution
    dist
    out
    build
    node_modules

    # Logs
    *.log*
    logs

    # Environment
    *.env*

    # Misc
    .DS_Store
`;
  writeFile(dirPath, ".gitignore", data);
};

const addNodemon = (dirPath: string) => {
  const data = `{
  "watch": ["src"],
  "ext": "ts",
  "exec": "npx tsc && node dist/index.js",
  "ignore": ["dist"]
}`;
  writeFile(dirPath, "nodemon.json", data);
};

const setupSuccessLog = () => {
  console.log(`
${chalk.green("✔")} ${chalk.bold("Project setup complete!")}

${chalk.cyan("You can now start developing your project:")}

1. ${chalk.yellow("Build the project:")} ${chalk.green("pnpm build")}
2. ${chalk.yellow("Run the project:")} ${chalk.green("pnpm start")}
3. ${chalk.yellow("Start in development mode:")} ${chalk.green("pnpm dev")}

${chalk.magenta("Happy coding!")}

${chalk.gray("For more information or to contribute to the project, visit the repository at:")}
${chalk.blue("https://github.com/thekbbohara/create-ts")}
`);
};

const validFlag: string[] = ["--npm", "--pnpm", "--default"];
const validPM: string[] = ["npm", "pnpm"];
// --- execution --- //
const args = process.argv;

const execution = async () => {
  if (args.length <= 2) {
    await main(DPM);
  } else {
    const flag = args[2];
    if (args.length === 3 && validFlag.includes(flag)) {
      switch (flag) {
        case "--npm":
          await main("npm");
          break;
        case "--pnpm":
          await main("pnpm");
          break;
        case "--default":
          console.log(DPM);
          process.exit(1);
      }
    } else if (
      args.length === 4 &&
      validFlag.includes(flag) &&
      validPM.includes(args[3])
    ) {
      CONFIG["default_package_manager"] = args[3];
      const configStr = JSON.stringify(CONFIG);
      fs.writeFileSync(CONFIGPATH, configStr);
      console.info("Changed default package manager to:", args[3]);
      process.exit(0);
    } else {
      console.error(chalk.red("Invalid arguments."));
      console.log(chalk.magenta("Valid flags"), validFlag);
      console.log(chalk.magenta("supported package managers"), validPM);
      process.exit(1);
    }
  }
};

execution();
