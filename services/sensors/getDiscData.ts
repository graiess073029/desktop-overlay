  import { statfs } from "fs/promises";
  import { DiscData } from "../../types";

  const getDiscUsage = async (): Promise<DiscData | null> => {
      try {

        const stats = await statfs("C:\\");

        const total = stats.blocks * stats.bsize;   
        const free = stats.bfree * stats.bsize;  
        const used = total - free;                

        let data = {
          "Disk Total [GB]": (total / (1024 ** 3)).toFixed(2),
          "Disk Free [GB]": (free / (1024 ** 3)).toFixed(2),
          "Disk Used [GB]": (used / (1024 ** 3)).toFixed(2)
        };

        return data

      }

    catch (err) {
      console.error("Error getting disk usage:", err);
      return null;
    }

  }

  let discData: DiscData | null = null;

  (async () => {
    try {
      const discUsage = await getDiscUsage();
      if (discUsage) discData = discUsage;
    } catch (err) {
      console.error("Error during initial disk data fetch:", err);
    }
  })()

  setInterval(async () => {
    try {
      const discUsage = await getDiscUsage();
      if (discUsage) discData = discUsage;
    } catch (err) {
      console.error("Error during disk data refresh interval:", err);
    }
  }, 5000);

  export const getDiskData = () => {
    try {
      return discData;
    } catch (err) {
      console.error("Error getting disk data:", err);
      return null;
    }
  };



