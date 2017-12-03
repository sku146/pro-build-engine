import cheerio from 'cheerio';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import flatMap from 'lodash/flatMap';
import flattenDeep from 'lodash/flattenDeep';
import isEmpty from 'lodash/isEmpty';
import replace from 'lodash/replace';

class SecurityTemplatePlugin {
  constructor(options = {}) {
    this.security = options;
  }

  apply(compiler) {
    const self = this;
    compiler.plugin('compilation', (compilation) => {
      compilation.plugin('html-webpack-plugin-after-html-processing', (htmlPluginData, callback) => {
        const {
          security,
        } = self;
        if (!isEmpty(security) && security.enabled) {
          const {
            contentSecurityPolicy,
          } = security;
          if (!isEmpty(contentSecurityPolicy) && contentSecurityPolicy.enabled) {
            const policy = contentSecurityPolicy.content;
            const $ = cheerio.load(htmlPluginData.html);
            const computeHash = (element) => {
              const hashDigest = sha256($(element).text());
              const baseDigest = Base64.stringify(hashDigest);
              return `nonce-${baseDigest}`;
            };

            const buildPolicy = rules => flatMap(rules, (val, key) => (
              `${key} ${flattenDeep([val]).join(' ')}`)).join(';');

            const hashes = flatMap($('script:not([src])'), computeHash);
            // todo: policy['script-src'] = policy['script-src'].concat(`${hashes}`);
            htmlPluginData.html = replace(htmlPluginData.html, '%%CSP_CONTENT%%', buildPolicy(policy)); // eslint-disable-line no-param-reassign
            htmlPluginData.html = replace(htmlPluginData.html, /%%nonce%%/g, hashes[0]); // eslint-disable-line no-param-reassign
          }
        }
        callback(null, htmlPluginData);
      });
    });
  }
}

export default SecurityTemplatePlugin;
