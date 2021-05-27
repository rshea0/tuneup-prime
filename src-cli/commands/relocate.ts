import chalk from 'chalk';
import { keyBy, partition } from 'lodash';
import path from 'path';
import pluralize from 'pluralize';
import prompts from 'prompts';
import { trueCasePath } from 'true-case-path';

import { BaseEngineCommand } from '../base-commands';
import * as engine from '../engine';
import {
  checkPathExists,
  checkPathIsDir,
  getFilesInDir,
  resolvePathToCwdIfRelative,
  spinner,
} from '../utils';

export default class Relocate extends BaseEngineCommand {
  static readonly description = 'relocate missing tracks';

  async run() {
    await this.connectToEngine();

    this.log();
    const missingTracks = await spinner({
      text: 'Find missing tracks',
      run: async ctx => {
        const missing = await this.findMissingTracks();
        const length = missing.length;
        if (length) {
          ctx.succeed(
            chalk`Found {red ${length.toString()}} missing ${pluralize(
              'track',
              length,
            )}`,
          );
          this.logTracks(missing);
        } else {
          ctx.warn(`Didn't find any missing tracks`);
        }
        return missing;
      },
    });
    this.log();

    if (!missingTracks.length) {
      return;
    }

    const searchFolder = await this.promptForSearchFolder();
    this.log();

    const relocated = await spinner({
      text: 'Relocate missing tracks',
      run: async ctx => {
        const { relocated, stillMissing } = await this.relocateMissingTracks({
          missingTracks,
          searchFolder,
        });

        const relocatedLength = relocated.length;
        const missingLength = stillMissing.length;
        const relocatedTrackWord = pluralize('track', relocatedLength);
        const missingTrackWord = pluralize('track', missingLength);

        if (!relocated.length) {
          ctx.fail(
            chalk`Couldn't find {red ${missingLength.toString()}} ${missingTrackWord}`,
          );
        } else if (missingLength) {
          ctx.warn(
            chalk`Relocated {green ${relocatedLength.toString()}} ${relocatedTrackWord}, couldn't find {red ${missingLength.toString()}} ${missingTrackWord}`,
          );
        } else {
          ctx.succeed(
            chalk`Relocated {green ${relocatedLength.toString()}} ${relocatedTrackWord}`,
          );
        }
        this.logTracks(relocated);
        if (stillMissing.length) {
          if (relocated.length) {
            this.log('  [still missing]');
          }
          this.logTracks(stillMissing, { color: 'red' });
        }

        return relocated;
      },
    });
    this.log();

    if (!relocated.length) {
      return;
    }

    await spinner({
      text: 'Save relocated tracks to Engine',
      successMessage: 'Saved relocated tracks to Engine',
      run: async () =>
        this.engineDb.updateTracks(
          relocated.map(track => ({
            id: track.id,
            path: track.path,
          })),
        ),
    });
  }

  private async findMissingTracks(): Promise<engine.Track[]> {
    const tracks = await this.engineDb.getTracks();
    const missing = [];

    for (const track of tracks) {
      const resolvedPath = path.isAbsolute(track.path)
        ? track.path
        : path.resolve(this.libraryFolder, track.path);
      if (!(await checkPathExists(resolvedPath))) {
        missing.push(track);
      }
    }

    return missing;
  }

  private async promptForSearchFolder(): Promise<string> {
    async function validateSearchFolder(
      folder: string,
    ): Promise<true | string> {
      if (!(await checkPathExists(folder))) {
        return `Path doesn't exist`;
      } else if (!(await checkPathIsDir(folder))) {
        return `Path isn't a folder`;
      } else if (!path.isAbsolute(folder)) {
        return 'Path must be absolute';
      }
      return true;
    }

    return prompts<'folder'>({
      type: 'text',
      name: 'folder',
      message: 'What folder would you like to search for your tracks in?',
      validate: v => validateSearchFolder(resolvePathToCwdIfRelative(v)),
      format: v => trueCasePath(resolvePathToCwdIfRelative(v)),
    }).then(x => x.folder);
  }

  private async relocateMissingTracks({
    missingTracks,
    searchFolder,
  }: {
    missingTracks: engine.Track[];
    searchFolder: string;
  }): Promise<{ relocated: engine.Track[]; stillMissing: engine.Track[] }> {
    const searchFiles = await getFilesInDir({
      path: searchFolder,
      maxDepth: 5,
    });
    const searchFileMap = keyBy(searchFiles, x => x.name);

    const [relocated, stillMissing] = partition(missingTracks, track => {
      const newPath = searchFileMap[track.filename];
      if (!newPath) {
        return false;
      }

      track.path = path
        .relative(this.libraryFolder, newPath.path)
        .replace(/\\/g, '/');

      return true;
    });

    return { relocated, stillMissing };
  }
}