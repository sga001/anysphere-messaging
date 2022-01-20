import { AfterPackContext, BuildResult } from "electron-builder";
import { ArchType } from "builder-util";
const builder = require("electron-builder");
import path from "path";
import fs from "fs";
import { notarize } from "electron-notarize";

// environment variable options:
// - MAC_UNIVERSAL: true for universal, false for build for current architecture only
// - MAC_DONT_NOTARIZE: true to skip notarization
// - MAC_NOTARIZE_USERNAME: apple ID for notarization
// - MAC_NOTARIZE_PASSWORD: apple ID app-specific password (NOT THE APPLE ID PASSWORD PLS) for notarization
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

function assets(rel: string) {
  return path.join(path.resolve(__dirname, "../../assets"), rel);
}

function release_dir(rel: string) {
  return path.join(path.resolve(__dirname, "../../release"), rel);
}

function binaries(rel: string) {
  return path.join(path.resolve(__dirname, "../../binaries"), rel);
}

function mac_arch() {
  if (process.env.MAC_UNIVERSAL) {
    return "universal" as ArchType;
  } else {
    return undefined; // build for current architecture
  }
}

const config = {
  appId: "co.anysphere.Anysphere",
  copyright: "Anysphere",
  productName: "Anysphere",
  asar: true,
  asarUnpack: "**\\*.{node,dll}",
  extraResources: [assets("entitlements.mac.plist")],

  directories: {
    app: release_dir("app"),
    buildResources: assets("."),
    output: release_dir("build"),
  },

  // these files are relative to the release_dir("app") directory
  files: ["dist", "package.json", "node_modules"],

  // Make sure that all files declared in "extraResources" exists and abort if they don't.
  afterPack: (context: AfterPackContext) => {
    const resources =
      context.packager.platformSpecificBuildOptions.extraResources;
    for (const resource of resources) {
      if (!fs.existsSync(resource.from)) {
        throw new Error(`Can't find file: ${resource.from}`);
      }
    }
  },

  mac: {
    target: {
      target: "pkg",
      arch: mac_arch(),
    },
    category: "public.app-category.productivity",
    hardenedRuntime: true,
    icon: assets("icon.icns"),
    entitlements: assets("entitlements.mac.plist"),
    gatekeeperAssess: false,
    extraResources: [
      {
        from: binaries("anysphered"), // the daemon
        to: ".",
      },
      {
        from: binaries("anysphere"), // the cli
        to: ".",
      },
      // TODO: add shell completions and an uninstall script here
      // TODO: assets directory needs to contain plist???????
    ],
  },

  pkg: {
    allowAnywhere: false,
    allowCurrentUserHome: false,
    isRelocatable: false,
    isVersionChecked: false,
  },
};

function package_mac() {
  const app_out_dirs: string[] = [];

  return builder.build({
    targets: builder.Platform.MAC.createTarget(),
    config: {
      ...config,
      afterPack: (context: AfterPackContext) => {
        config.afterPack?.(context);

        app_out_dirs.push(context.appOutDir);
        return Promise.resolve();
      },
      afterAllArtifactBuild: async (buildResult: BuildResult) => {
        if (!process.env.MAC_DONT_NOTARIZE) {
          await notarize_mac(buildResult.artifactPaths[0]);
        }

        for (const dir of app_out_dirs) {
          try {
            await fs.promises.rm(dir, { recursive: true });
          } catch {}
        }
        return [];
      },
      afterSign: async (context: AfterPackContext) => {
        const out_dir = context.appOutDir;
        app_out_dirs.push(out_dir);

        if (!process.env.MAC_DONT_NOTARIZE) {
          const appName = context.packager.appInfo.productFilename;
          await notarize_mac(path.join(out_dir, `${appName}.app`));
        }
      },
    },
  });
}

function notarize_mac(app_path: string) {
  if (
    !process.env.MAC_NOTARIZE_USERNAME ||
    !process.env.MAC_NOTARIZE_PASSWORD
  ) {
    console.error(
      "ERROR: MAC_NOTARIZE_USERNAME and MAC_NOTARIZE_PASSWORD must be set"
    );
    return;
  }
  console.log("Notarizing " + app_path);
  return notarize({
    // tool: "notarytool",
    appPath: app_path,
    appBundleId: config.appId,
    appleId: process.env.MAC_NOTARIZE_USERNAME,
    appleIdPassword: process.env.MAC_NOTARIZE_PASSWORD,
  });
}

package_mac();
