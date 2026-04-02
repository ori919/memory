import { Composition } from "remotion";
import { MemoryPromo } from "./MemoryPromo";

/** 60s @ 30fps — adjust copy and pacing in MemoryPromo.tsx */
const FPS = 30;
const DURATION_SECONDS = 60;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MemoryPromo"
        component={MemoryPromo}
        durationInFrames={FPS * DURATION_SECONDS}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
