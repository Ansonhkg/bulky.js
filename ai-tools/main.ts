import { combineFiles, State } from "./combiner";

// Execute the function
combineFiles().catch((error) => {
  console.error(`${State.ERROR}: An unexpected error occurred:`, error);
  process.exit(1);
});
