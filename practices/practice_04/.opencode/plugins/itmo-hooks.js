const { spawnSync } = require('child_process');

module.exports = async ({ client, project, directory, $ }) => {
  function runAutoCheck(file) {
    const args = ['.opencode/runners/auto-check.js'];
    if (file) args.push(file);
    spawnSync(process.execPath, args, { cwd: directory, stdio: 'inherit' });
  }
  return {
    'tool.execute.after': async (input, output) => {
      if (input.tool === 'edit' && output?.result?.files?.length) {
        runAutoCheck();
      }
    }
  };
};
