import fs from "fs/promises";
import path from "path";
import { existsSync, readFileSync } from "fs";

interface Config {
  sourceDirs: string[];
  outputFile: string;
  ignoreImports: boolean;
  ignoreExports: boolean;
  fileExtensions: string[];
  ignorePatterns: string[];
  maxCharsPerFile?: number;
}

export enum State {
  INIT = "🚀 Initializing",
  READING_IGNORE = "📖 Reading .ignore",
  PROCESSING_FILES = "🔄 Processing files",
  WRITING_OUTPUT = "💾 Writing output",
  DONE = "✅ Done",
  ERROR = "❌ Error",
}

function printHelp() {
  console.log("TypeScript File Combiner");
  console.log("Usage: ts-node combiner.ts [OPTIONS]");
  console.log("\nOptions:");
  console.log("  --help                    Display this help message");
  console.log(
    "  --path=<directory>        Specify a source directory (can be used multiple times)"
  );
  console.log("  --output=<file>           Specify the output file path");
  console.log(
    "  --ignore-imports=<bool>   Whether to ignore import statements (default: true)"
  );
  console.log(
    "  --ignore-exports=<bool>   Whether to ignore export statements (default: true)"
  );
  console.log(
    "  --ext=<extensions>        Comma-separated list of file extensions to process (default: ts)"
  );
  console.log(
    "  --ignore-pattern=<pattern> Custom pattern for files to ignore (supports * and ? wildcards). Can be used multiple times."
  );
  console.log(
    "  --max-chars=<number>      Maximum number of characters per output file (enables pagination)"
  );
  console.log("\nExamples:");
  console.log(
    '  ts-node combiner.ts --path=/project/src --path=/project/tests --output=./combined.ts --ignore-pattern="*.tmp" --ignore-pattern="*.test.ts"'
  );
  console.log(
    "  ts-node combiner.ts --path=/project --output=./combined_code.txt --ignore-imports=false --ignore-exports=false --ext=ts,js --max-chars=100000"
  );
  console.log(
    "\nNote: When using wildcards in --ignore-pattern, you may need to quote the pattern to prevent shell expansion."
  );
}

function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    sourceDirs: [],
    outputFile: "./ts-dist/all.ts",
    ignoreImports: true,
    ignoreExports: true,
    fileExtensions: [".ts"],
    ignorePatterns: [],
  };

  let ignorePatternFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("--path=")) {
      config.sourceDirs.push(path.resolve(process.cwd(), arg.split("=")[1]));
    } else if (arg.startsWith("--output=")) {
      config.outputFile = path.resolve(process.cwd(), arg.split("=")[1]);
    } else if (arg === "--ignore-imports=false") {
      config.ignoreImports = false;
    } else if (arg === "--ignore-exports=false") {
      config.ignoreExports = false;
    } else if (arg.startsWith("--ext=")) {
      config.fileExtensions = arg
        .split("=")[1]
        .split(",")
        .map((ext) => ext.trim());
    } else if (arg.startsWith("--ignore-pattern=")) {
      const pattern = arg.split("=")[1].replace(/^["']|["']$/g, "");
      config.ignorePatterns.push(pattern);
    } else if (arg.startsWith("--ignore-pattern-file=")) {
      ignorePatternFile = path.resolve(process.cwd(), arg.split("=")[1]);
    } else if (arg.startsWith("--max-chars=")) {
      config.maxCharsPerFile = parseInt(arg.split("=")[1], 10);
    }
  }

  if (config.sourceDirs.length === 0) {
    console.error("Error: At least one --path argument must be provided.");
    console.error("Use --help for usage information.");
    process.exit(1);
  }

  // Resolve the .bulkignore file relative to the script directory
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const defaultIgnoreFile = path.resolve(scriptDir, ".bulkignore");

  // Load ignore patterns from the specified file or `.bulkignore` in the script's directory
  if (ignorePatternFile || existsSync(defaultIgnoreFile)) {
    const filePath = ignorePatternFile || defaultIgnoreFile;
    try {
      if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath, "utf-8");
        config.ignorePatterns.push(
          ...fileContent
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith("#"))
        );
      } else {
        console.warn(
          `⚠️ Warning: Ignore pattern file not found at ${filePath}. Proceeding without it.`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error: Could not read ignore pattern file at ${filePath}:`,
        error
      );
      process.exit(1);
    }
  }

  return config;
}

async function ensureOutputDirectory(outputFile: string): Promise<void> {
  const outputDir = path.dirname(outputFile);
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Output directory ensured: ${outputDir}`);
  } catch (error) {
    console.error(
      `${State.ERROR}: Creating output directory ${outputDir}:`,
      error
    );
    process.exit(1);
  }
}

function wildcardMatch(text: string, pattern: string): boolean {
  const escapeRegex = (str: string) =>
    str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  const regexPattern =
    "^" +
    pattern.split("*").map(escapeRegex).join(".*").replace(/\?/g, ".") +
    "$";
  return new RegExp(regexPattern).test(text);
}

async function createIgnoreChecker(
  sourceDir: string,
  ignorePatterns: string[]
): Promise<(path: string) => boolean> {
  console.log(`${State.READING_IGNORE}: Parsing .ignore file`);
  const ignorePath = path.join(sourceDir, ".ignore");
  let patterns: string[] = [...ignorePatterns];

  try {
    const fileContent = await fs.readFile(ignorePath, "utf-8");
    patterns.push(
      ...fileContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
    );
  } catch (error) {
    console.warn(
      `⚠️ Warning: Could not read .ignore file in ${sourceDir}. Proceeding without .ignore rules for this directory.`
    );
  }

  return (filePath: string) => {
    const normalizedPath = filePath.replace(/\\/g, "/");
    return patterns.some((pattern) => {
      if (!pattern.includes("/")) {
        return wildcardMatch(path.basename(normalizedPath), pattern);
      }
      return wildcardMatch(normalizedPath, pattern);
    });
  };
}

function removeImportsAndExports(
  content: string,
  ignoreImports: boolean,
  ignoreExports: boolean
): string {
  if (ignoreImports) {
    const importRegex =
      /^import\s+(?:(?:(?:\{[^}]*\}|\*\s+as\s+\w+|[\w,\s]+)\s+from\s+)?['"](?:[@\w\/-]+|\.{1,2}\/[\w\/-]+)['"]|(?:\{[^}]*\}|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s+['"](?:[@\w\/-]+|\.{1,2}\/[\w\/-]+)['"]|\*\s+as\s+\w+\s+from\s+['"](?:[@\w\/-]+|\.{1,2}\/[\w\/-]+)['"]);?\s*$/gm;
    content = content.replace(importRegex, "");
  }
  if (ignoreExports) {
    const exportRegex =
      /^export\s+(?:\*\s+from\s+['"](?:[@\w\/-]+|\.{1,2}\/[\w\/-]+)['"]|(?:\{[^}]*\}|\w+)(?:\s*,\s*(?:\{[^}]*\}|\w+))*\s+from\s+['"](?:[@\w\/-]+|\.{1,2}\/[\w\/-]+)['"]|(?:(?:async\s+)?function|class|const|let|var)\s+\w+|(?:\{[^}]*\}|default|type|interface));?\s*$/gm;
    content = content.replace(exportRegex, "");
  }
  return content;
}

function countChars(content: string): number {
  return content.length;
}

async function processDirectory(
  directory: string,
  shouldIgnore: (path: string) => boolean,
  config: Config,
  combinedContent: string[]
): Promise<string[]> {
  console.log(`${State.PROCESSING_FILES}: ${directory}`);
  try {
    const items = await fs.readdir(directory, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      if (shouldIgnore(relativePath)) {
        console.log(`Ignoring: ${relativePath}`);
        continue;
      }

      if (item.isDirectory()) {
        await processDirectory(fullPath, shouldIgnore, config, combinedContent);
      } else if (
        item.isFile() &&
        config.fileExtensions.includes(path.extname(item.name))
      ) {
        let content = await fs.readFile(fullPath, "utf8");
        content = removeImportsAndExports(
          content,
          config.ignoreImports,
          config.ignoreExports
        );
        combinedContent.push(`// Filename: ${fullPath}\n${content.trim()}\n\n`);
      }
    }
  } catch (error) {
    console.error(`${State.ERROR}: Processing directory ${directory}:`, error);
  }
  return combinedContent;
}

async function writeOutputFiles(
  config: Config,
  content: string[]
): Promise<void> {
  console.log(`${State.WRITING_OUTPUT}: ${config.outputFile}`);
  const totalContent = content.join("\n");
  const totalChars = countChars(totalContent);

  try {
    await fs.writeFile(config.outputFile, totalContent);
    console.log(
      `Written combined file: ${config.outputFile} (Characters: ${totalChars})`
    );

    if (config.maxCharsPerFile) {
      const numFiles = Math.ceil(totalChars / config.maxCharsPerFile);
      const baseFileName = path.basename(
        config.outputFile,
        path.extname(config.outputFile)
      );
      const fileExtension = path.extname(config.outputFile);

      const fullContent = await fs.readFile(config.outputFile, "utf-8");

      for (let i = 0; i < numFiles; i++) {
        const start = i * config.maxCharsPerFile;
        const end = Math.min((i + 1) * config.maxCharsPerFile, totalChars);
        const partContent = fullContent.slice(start, end);

        const partFileName = path.join(
          path.dirname(config.outputFile),
          `${baseFileName}_${i + 1}${fileExtension}`
        );

        await fs.writeFile(partFileName, partContent);
        console.log(
          `Written file: ${partFileName} (Characters: ${countChars(
            partContent
          )})`
        );
      }

      await fs.unlink(config.outputFile);
      console.log(`Removed combined file: ${config.outputFile}`);
    }

    console.log(`${State.DONE}: Successfully split files`);
    console.log("📊 File Statistics:");
    console.log(`   - Total Character Count: ${totalChars}`);
  } catch (error) {
    console.error(`${State.ERROR}: Writing output:`, error);
  }
}

export async function combineFiles(config?: Partial<Config>): Promise<void> {
  let finalConfig: Config;

  if (config) {
    finalConfig = {
      sourceDirs: config.sourceDirs || [],
      outputFile: config.outputFile || "./ts-dist/all.ts",
      ignoreImports: config.ignoreImports ?? true,
      ignoreExports: config.ignoreExports ?? true,
      fileExtensions: config.fileExtensions || [".ts"],
      ignorePatterns: config.ignorePatterns || [],
      maxCharsPerFile: config.maxCharsPerFile,
    };
  } else {
    finalConfig = parseArgs();
  }

  if (finalConfig.sourceDirs.length === 0) {
    throw new Error("At least one source directory must be provided.");
  }

  await ensureOutputDirectory(finalConfig.outputFile);

  console.log(State.INIT);
  console.log(
    `Import statements will be ${finalConfig.ignoreImports ? "ignored" : "included"
    }.`
  );
  console.log(
    `Export statements will be ${finalConfig.ignoreExports ? "ignored" : "included"
    }.`
  );
  console.log(
    `File extensions to process: ${finalConfig.fileExtensions.join(", ")}`
  );
  if (finalConfig.ignorePatterns.length > 0) {
    console.log(`Ignore patterns: ${finalConfig.ignorePatterns.join(", ")}`);
  }
  if (finalConfig.maxCharsPerFile) {
    console.log(
      `Max characters per output file: ${finalConfig.maxCharsPerFile}`
    );
  }

  let combinedContent: string[] = [];

  for (const sourceDir of finalConfig.sourceDirs) {
    const shouldIgnore = await createIgnoreChecker(
      sourceDir,
      finalConfig.ignorePatterns
    );
    combinedContent = await processDirectory(
      sourceDir,
      shouldIgnore,
      finalConfig,
      combinedContent
    );
  }

  await writeOutputFiles(finalConfig, combinedContent);
}
