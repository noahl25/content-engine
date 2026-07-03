import { Config } from "@remotion/cli/config";

// 1-core / no-GPU VM: render serially with software GL.
Config.setConcurrency(1);
Config.setVideoImageFormat("jpeg");
Config.setChromiumOpenGlRenderer("swiftshader");
Config.setOverwriteOutput(true);
