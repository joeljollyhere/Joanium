import { createExecutor } from '../Shared/createExecutor.js';
import {
  generatePassword,
  generatePassphrase,
  generatePin,
  generateMemorable,
  strengthLabel,
} from './Utils.js';
import { toolsList } from './ToolsList.js';

export const { handles, execute } = createExecutor({
  name: 'PasswordExecutor',
  tools: toolsList,
  handlers: {
    generate_password: async (params, onStage) => {
      const type = String(params.type ?? 'password').toLowerCase();
      const count = Math.min(Math.max(1, Number(params.count) || 1), 10);
      const includeSymbols = params.include_symbols !== false;
      const includeNumbers = params.include_numbers !== false;
      const includeUppercase = params.include_uppercase !== false;

      onStage(`🔐 Generating ${count > 1 ? count + ' ' : ''}${type}${count > 1 ? 's' : ''}…`);

      const passwords = [];

      if (type === 'passphrase') {
        const wordCount = Math.min(Math.max(2, Number(params.length) || 4), 10);
        for (let i = 0; i < count; i++) {
          passwords.push(generatePassphrase(wordCount));
        }
      } else if (type === 'pin') {
        const len = Math.min(Math.max(4, Number(params.length) || 6), 20);
        for (let i = 0; i < count; i++) {
          passwords.push(generatePin(len));
        }
      } else if (type === 'memorable') {
        const len = Math.min(Math.max(6, Number(params.length) || 10), 20);
        for (let i = 0; i < count; i++) {
          passwords.push(generateMemorable(len));
        }
      } else {
        const len = Math.min(Math.max(4, Number(params.length) || 16), 128);
        for (let i = 0; i < count; i++) {
          passwords.push(generatePassword(len, includeSymbols, includeNumbers, includeUppercase));
        }
      }

      const lines = [
        `🔐 Generated ${type.charAt(0).toUpperCase() + type.slice(1)}${count > 1 ? 's' : ''}`,
        '',
      ];

      if (count === 1) {
        const pw = passwords[0];
        lines.push('```');
        lines.push(pw);
        lines.push('```');
        lines.push('');
        if (type === 'password' || type === 'memorable') {
          lines.push(`Strength: ${strengthLabel(pw)}`);
          lines.push(`Length: ${pw.length} characters`);
          const entropy = Math.floor(
            pw.length *
              Math.log2(
                (includeUppercase ? 26 : 0) +
                  (includeNumbers ? 10 : 0) +
                  (includeSymbols && type === 'password' ? 28 : 0) +
                  26,
              ),
          );
          lines.push(`Estimated entropy: ~${entropy} bits`);
        }
      } else {
        passwords.forEach((pw, i) => {
          lines.push(`${i + 1}. \`${pw}\``);
          if (type === 'password') lines.push(`   ${strengthLabel(pw)}`);
        });
      }

      lines.push('');
      lines.push(
        '⚠️ Store passwords in a password manager (Bitwarden, 1Password, etc.) — never in plain text.',
      );
      return lines.join('\n');
    },
  },
});
