const { Bulkie } = require("./dist/cjs/bulkie");

const bulkie = new Bulkie({
  network: "datil",
  litDebug: true,
  debug: true,
});

(async () => {
  await bulkie.connectToLitNodeClient();

  console.log(bulkie);
})();
