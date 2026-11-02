/**
 * The CLI's settings (the Node APIs take their own). Frames are PNG, not JPEG: JPEG smears the edges of pixel art.
 * Sixteen tabs render at once (the M5 Max has eighteen cores; two are left for the encoder), and Chrome draws on the
 * GPU through ANGLE and Metal.
 */
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setCrf(14);
Config.setConcurrency(16);
Config.setChromiumOpenGlRenderer("angle");
