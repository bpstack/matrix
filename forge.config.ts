import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'node:path';
import fs from 'node:fs';

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
    name: 'Matrix',
    executableName: 'matrix',
    appBundleId: 'com.razyd.matrix',
    appCategoryType: 'public.app-category.productivity',
    extraResource: ['./assets'],
    derefSymlinks: true,
  },
  rebuildConfig: {},
  hooks: {
    postPackage: async (_config, options) => {
      // Copy native modules into resources/node_modules/ so Node resolution works
      const nativeModules = ['better-sqlite3', 'bindings', 'file-uri-to-path'];
      const projectRoot = process.cwd();

      for (const outputPath of options.outputPaths) {
        const nmDest = path.join(outputPath, 'resources', 'node_modules');
        fs.mkdirSync(nmDest, { recursive: true });

        for (const mod of nativeModules) {
          const src = path.join(projectRoot, 'node_modules', mod);
          const dest = path.join(nmDest, mod);
          if (fs.existsSync(src) && !fs.existsSync(dest)) {
            copyDirSync(src, dest);
          }
        }
      }
      console.log('[Matrix] Native modules copied to resources/node_modules/');
    },
  },
  makers: [
    new MakerSquirrel({
      name: 'matrix',
      setupExe: 'MatrixSetup.exe',
      setupIcon: './assets/icon.ico',
      description: 'Strategic Personal Professional System',
      authors: 'Matrix Team',
      noMsi: true,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: 'src/backend/index.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/backend/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: true,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
