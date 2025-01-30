self.onmessage = function (e) {
  setInterval(() => {
    postMessage("tick");
  }, 1000);
};
