let moment = require("moment");
const Nightmare = require("nightmare");
const Twilio = require("twilio");

module.exports = {
  getMonitor(options) {
    let {
      url,
      title,
      numbersToMessage,
      interestingConfig,
      refreshRate,
      smsEnabled,
      fromNumber,
      nightmareOptions,
      incognito,
      accountSid,
      authToken,
    } = options;

    let timer = null;
    var lastResponse = null;
    nightmareOptions = { show: false, ...nightmareOptions };

    incognito = incognito !== false;

    let nightmareCache;

    async function getNightmare() {
      if (incognito) {
        const nightmare = Nightmare(nightmareOptions);
        await nightmare.goto(url);
        return { nightmare }; // Wrap in object hack
      } else {
        if (nightmareCache == null) {
          nightmareCache = Nightmare(nightmareOptions);
          await nightmareCache.goto(url);
        } else {
          await nightmareCache.refresh();
        }
        return { nightmare: nightmareCache }; // Wrap in object hack
      }
    }

    const twilioClient = smsEnabled ? Twilio(accountSid, authToken) : null;

    function detectChange(responseText, callback) {
      if (lastResponse == null) {
        lastResponse = responseText;
        console.log("First Response", responseText);
      } else {
        if (responseText != lastResponse) {
          callback(lastResponse, responseText); //Send the old page and the new page to the callback
          lastResponse = responseText;
        }
      }
    }

    async function checkNow() {
      let ts = moment().format();
      console.log(ts, "Refreshing");
      let { nightmare } = await getNightmare();
      try {
        //find the section of the page we are insterested in and get the plain text
        let body = await nightmare.evaluate((selector) => {
          return Array.from(document.querySelectorAll(selector)).map((el) => el.innerText);
        }, interestingConfig.selector);

        //console.log("the body", body);

        //Our selector may return multiple results,  get the iteration we are intereseted in
        let interestingText = body[interestingConfig.position];
        //console.log("interseting", interestingText);

        //Some sites like CapitalOne, each request might return a little different results like double spaced lines instead of single space.  I assume the site is load balanced the the servers code are not the same.
        //Here we are able to modify the text so that the results are consistant, like remove all spaces
        if (interestingConfig.regremove) {
          let regs = interestingConfig.regremove;
          for (var i = 0; i < regs.length; i++) {
            interestingText = interestingText.replace(regs[i], "");
          }
        }

        //console.log(interestingText);
        detectChange(interestingText, changesFound);
      } catch (error) {
        console.log(error);
        changesFound(lastResponse, "Error parsing");
      } finally {
        if (nightmare) {
          if (nightmare !== nightmareCache) {
            await nightmare.end();
          }
        }
      }
    }

    async function changesFound(oldResponse, newResponse) {
      console.log("Old Response:");
      console.log(oldResponse);
      console.log("New Response:");
      console.log(newResponse);

      //send SMS that site has changed
      if (smsEnabled) {
        for (const number of numbersToMessage) {
          twilioClient.messages
            .create({
              body: `${title} site has changed ${url}`,
              from: fromNumber,
              to: number,
            })
            .then((message) => console.log(message.status))
            .catch((error) => console.error("Error sending SiteChanged SMS to " + number, error))
            .done();
        }
      }
    }

    if (smsEnabled) {
      for (const number of numbersToMessage) {
        twilioClient.messages
          .create({
            body: `Monitoring ${title} site ${url} Will let you know when it changes.`,
            from: fromNumber,
            to: number,
          })
          .then((message) => console.log(message.status))
          .catch((error) => console.error("Error sending initial SMS to " + number, error))
          .done();
      }
    }

    function start() {
      console.log("Starting Monitor with options:", options);
      return startAgain();
    }

    async function startAgain() {
      stop();
      try {
        await checkNow();
      } finally {
        timer = setTimeout(start, refreshRate);
      }
    }

    function stop() {
      console.log("Stopping Monitor: ", options.title, options.url);
      clearTimeout(timer);
    }

    return { start, stop };
  },
};
