import fs from 'node:fs';

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);
const hasMacSigning = Boolean(process.env.CSC_LINK);
const hasNotarization = Boolean(
  process.env.APPLE_API_KEY &&
  process.env.APPLE_API_KEY_ID &&
  process.env.APPLE_API_ISSUER,
);

export default {
  ...packageJson.build,
  publish: {
    provider: 'github',
    owner: 'BlinkCodeOrg',
    repo: 'BlinkCode',
    releaseType: 'release',
  },
  mac: {
    ...packageJson.build.mac,
    identity: hasMacSigning ? undefined : null,
    notarize: hasNotarization,
  },
};
