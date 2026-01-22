export const ANIMTS_LIB_VERSION = 1;

export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z: number };

export type AnimPlayer = { pos: Vec2 };

export type AnimAIInput = {
    label?: string;
    player: AnimPlayer;
    lockedState?: string | null;
    ui?: any;
    signal?: AbortSignal;
};

export type AnimRenderInput = AnimAIInput & {
    paused?: boolean;
};

export type AnimGfx2D = {
    g: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    dpr: number;
    ui?: any;
    center?: () => Vec2;
    math?: any;
};

export type AnimContext = {
    host: HTMLElement;
    stage: HTMLElement;
    signal: AbortSignal;
    wait: (ms: number) => Promise<void>;
    runtime: { isPaused: () => boolean };
    ui: any;
    danmaku: { send: (text: string, options?: any) => void };
    npc: { say: (options: any) => void };
    math?: any;
    onDispose: (fn: () => void) => void;
};

