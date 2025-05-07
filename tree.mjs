#!/usr/bin/env node

import { readdir as _readdir, stat as _stat } from "fs";
import { join, resolve } from "path";
import { promisify } from "util";

// Convertir fs.readdir y fs.stat a promesas
const readdir = promisify(_readdir);
const stat = promisify(_stat);

const IGNORE_PATTERNS = [
  /node_modules/,
  /ui/,
  /.git/,
  /.next/,
  /dist/,
  /.env/,
  /public/,
  "package-lock.json",
  ".DS_Store",
  "yarn.lock",
  "coverage",
  ".vscode",
  ".idea",
];

async function shouldInclude(name) {
  return !IGNORE_PATTERNS.some((pattern) =>
    pattern instanceof RegExp ? pattern.test(name) : pattern === name
  );
}

async function buildTree(dir, prefix = "") {
  let output = "";

  try {
    const files = await readdir(dir);
    const filteredFiles = [];

    // Filtrar archivos ignorados
    for (const file of files) {
      if (await shouldInclude(file)) {
        const filePath = join(dir, file);
        const stats = await stat(filePath);
        filteredFiles.push({
          name: file,
          isDirectory: stats.isDirectory(),
          path: filePath,
        });
      }
    }

    // Ordenar: primero directorios, luego archivos
    filteredFiles.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return b.isDirectory - a.isDirectory;
    });

    // Procesar cada archivo/directorio
    for (let i = 0; i < filteredFiles.length; i++) {
      const file = filteredFiles[i];
      const isLast = i === filteredFiles.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const nextPrefix = isLast ? prefix + "    " : prefix + "│   ";

      output += `${prefix}${connector}${file.name}\n`;

      if (file.isDirectory) {
        output += await buildTree(file.path, nextPrefix);
      }
    }

    return output;
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error);
    return "";
  }
}

async function generateTree(rootPath) {
  try {
    const resolvedPath = resolve(rootPath);
    console.log("\nDirectory Tree for:", resolvedPath, "\n");
    const tree = await buildTree(resolvedPath);
    console.log(tree);
  } catch (error) {
    console.error("Error generating tree:", error);
  }
}

// Ejecutar el generador
const targetDir = process.argv[2] || ".";
generateTree(targetDir);
