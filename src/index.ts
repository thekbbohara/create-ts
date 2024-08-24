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

const execCommand = async (command: string, cwd: string) => {
  const spinner = createSpinner(`${command}`).start();
  spinner.spin();
  exec(command, { cwd: cwd });
  spinner.success();
};
const main = async () => {
  if (process.argv.length === 2) {
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
    console.log(chalk.blue("dir:"), appDir);
    fs.mkdirSync(appDir);
    execCommand("pnpm init", appDir);
    await sleep();
    execCommand("git init", appDir);
    installDev(devDependencies, appDir);
    writePrettierrc(appDir);
    writeEslint(appDir);
    writeTsConf(appDir);
    addGitIgnore(appDir);
    execCommand('npm pkg set scripts.build="tsc"', appDir);
    execCommand('npm pkg set scripts.dev="npx nodemon"', appDir);
    execCommand('npm pkg set scripts.start="ts-node src/index.ts"', appDir);
    addNodemon(appDir);
    fs.mkdirSync(joinPath(appDir, "src"));
    fs.writeFileSync(
      joinPath(appDir, "src/index.ts"),
      "console.log('Hello World!')",
    );
    setupSuccessLog();
  }
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

const installDev = (depen: string[], cwd: string) => {
  depen.forEach((d) => {
    const spinner = createSpinner(`+ ${chalk.blueBright(d)}`).start();
    spinner.spin();
    exec(`pnpm add -D ${d}`, { cwd: cwd });
    spinner.success();
  });
};

const writeFile = (dirPath: string, fileName: string, data: string) => {
  const spinner = createSpinner(`Writing ${fileName}`).start();
  try {
    spinner.spin();
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
        "target": "ES2019",
        "module": "CommonJS",
        "moduleResolution": "node",
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "allowSyntheticDefaultImports": true,
        "declaration": false,
        "outDir": "dist"
    },
    "include": ["src"],
    "exclude": ["node_modules", "**/*.spec.ts"]
}`;
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
main();
