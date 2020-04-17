function notEmpty(value) {
  return value != null && value !== "";
}

function getEnv(key, fallback) {
  const value = process.env[key];
  if (notEmpty(value)) return value;
  else if (fallback != null) {
    return fallback;
  } else {
    throw new Error(`Environment variable "${key}" is empty and no fallback was given.`);
  }
}

const truthyRegex = /^(yes|y|t|true|1)$/i;
function getEnvBool(key, fallback) {
  const value = process.env[key];
  if (notEmpty(value)) return value === true || truthyRegex.test(value);
  else if (fallback != null) {
    return fallback;
  } else {
    throw new Error(`Environment variable "${key}" is empty and no fallback was given.`);
  }
}

function getEnvInt(key, fallback) {
  const value = process.env[key];
  if (notEmpty(value)) return parseInt(value);
  else if (fallback != null) {
    return fallback;
  } else {
    return;
    throw new Error(`Environment variable "${key}" is empty and no fallback was given.`);
  }
}

module.exports = {
  getEnv,
  getEnvBool,
  getEnvInt,
};
