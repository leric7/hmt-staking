import { task } from "hardhat/config";
import { HRE, setHRE } from "../helpers/misc-utils";

task(
  `set-HRE`,
  `Inits the HRE, to have access to all the plugins' objects`
).setAction(async (_, _HRE) => {
  if (HRE) {
    return;
  }

  console.log("- Enviroment");
  if (process.env.FORK) {
    console.log("  - Fork Mode activated at network: ", process.env.FORK);
    if (_HRE?.config?.networks?.hardhat?.forking?.url) {
      console.log(
        "  - Provider URL:",
        _HRE.config.networks.hardhat.forking?.url?.split("/")[2]
      );
    } else {
      console.error(
        `[FORK][Error], missing Provider URL for "${_HRE.network.name}" network. Fill the URL at './helper-hardhat-config.ts' file`
      );
    }
  }
  console.log("  - Network :", _HRE.network.name);

  setHRE(_HRE);
  return _HRE;
});
