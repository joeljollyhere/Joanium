const APP_NAME = 'Joanium';

export const Properties = {
  name: APP_NAME,
  version: '0.1.0',
  description: 'Your smart, reliable, and friendly personal AI assistant.',
  author: 'Joel Jolly',
  authorUrl: 'https://joeljolly.vercel.app',
  sponsorUrl: 'https://github.com/sponsors/withinJoel',
  license: 'MIT',

  get repository() {
    return `https://github.com/${this.name}/${this.name}`;
  },
};

// Safe destructuring (no name conflicts)
export const { version, name: appName, author, authorUrl, sponsorUrl, repository } = Properties;

export default Properties;
