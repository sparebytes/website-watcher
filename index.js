require("dotenv-flow").config();
const { getMonitor } = require("./src/getMonitor");
const { getEnv, getEnvBool, getEnvInt } = require("./src/utils");

const smsEnabled = getEnvBool("SMS_ENABLED", true);
const smsOptions = !smsEnabled
  ? { smsEnabled }
  : {
      smsEnabled,
      accountSid: getEnv("TWILIO_ACCOUNT_SID"),
      authToken: getEnv("TWILIO_AUTH_TOKEN"),
      fromNumber: getEnv("TWILIO_FROM_NUMBER"),
      numbersToMessage: getEnv("SMS_TO_NUMBERS")
        .split(/,/g)
        .map((v) => v.trim())
        .filter((m) => m),
    };

const baseOptions = {
  ...smsOptions,
  incognito: getEnvBool("NIGHTMARE_INCOGNITO", true),
  nightmareOptions: {
    show: getEnvBool("NIGHTMARE_SHOW", false),
  },
  refreshRate: getEnvInt("REFRESH_RATE"),
};

const options = {
  ...baseOptions,
  url: getEnv("URL"),
  title: getEnv("TITLE"),
  interestingConfig: { selector: "body", position: 0, regremove: [/\s/g] },
};

getMonitor(options).start();
