import axios from 'axios';

import { createNotification } from '../store/action-creators';
import { store } from '../store/store';

export const checkVersion = async (isForced: boolean = false) => {
  try {
    const res = await axios.get<string>(
      'https://raw.githubusercontent.com/AliasNoob/Praetorium/master/client/.env'
    );

    const versionLine = res.data
      .split('\n')
      .find((line) => line.startsWith('REACT_APP_VERSION='));

    if (!versionLine) {
      throw new Error('Version not found in .env file');
    }

    const githubVersion = versionLine.split('=')[1].trim();

    if (githubVersion !== process.env.REACT_APP_VERSION) {
      store.dispatch<any>(
        createNotification({
          title: 'Info',
          message: `New version ${githubVersion} is available! (current: ${process.env.REACT_APP_VERSION})`,
          url: 'https://github.com/AliasNoob/Praetorium/blob/master/CHANGELOG.md',
        })
      );
    } else if (isForced) {
      store.dispatch<any>(
        createNotification({
          title: 'Info',
          message: `You are using the latest version! (${process.env.REACT_APP_VERSION})`,
        })
      );
    }
  } catch (err) {
    console.log(err);
    if (isForced) {
      store.dispatch<any>(
        createNotification({
          title: 'Error',
          message: 'Failed to check for updates. Please try again later.',
        })
      );
    }
  }
};
