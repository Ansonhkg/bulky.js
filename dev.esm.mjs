import { Bulkie } from "./dist/esm/bulkie.js";

const bulkie = new Bulkie({
  network: "datil",
  litDebug: true,
  debug: true,
});

(async () => {
  await bulkie.connectToLitNodeClient();

  console.log(bulkie);
})();
