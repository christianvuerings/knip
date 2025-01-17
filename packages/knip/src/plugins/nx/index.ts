import { compact } from '../../util/array.js';
import { timerify } from '../../util/Performance.js';
import { getDependenciesFromScripts, hasDependency, load } from '../../util/plugin.js';
import type { NxProjectConfiguration } from './types.js';
import type { IsPluginEnabledCallback, GenericPluginCallback } from '../../types/plugins.js';

const NAME = 'Nx';

const ENABLERS = ['nx', /^@nrwl\//, /^@nx\//];

const isEnabled: IsPluginEnabledCallback = ({ dependencies }) => hasDependency(dependencies, ENABLERS);

const CONFIG_FILE_PATTERNS = ['project.json', '{apps,libs}/**/project.json'];

const findNxDependencies: GenericPluginCallback = async (configFilePath, options) => {
  const { isProduction } = options;

  if (isProduction) return [];

  const localConfig: NxProjectConfiguration | undefined = await load(configFilePath);

  if (!localConfig) return [];

  const targets = localConfig.targets ? Object.values(localConfig.targets) : [];

  const executors = targets
    .map(target => target?.executor)
    .filter(executor => executor && !executor.startsWith('.'))
    .map(executor => executor?.split(':')[0]);
  const scripts = targets
    .filter(target => target.executor === 'nx:run-commands')
    .flatMap(target => target.options?.commands ?? (target.options?.command ? [target.options.command] : []));
  const dependencies = getDependenciesFromScripts(scripts, options);

  return compact([...executors, ...dependencies]);
};

const findDependencies = timerify(findNxDependencies);

export default {
  NAME,
  ENABLERS,
  isEnabled,
  CONFIG_FILE_PATTERNS,
  findDependencies,
};
