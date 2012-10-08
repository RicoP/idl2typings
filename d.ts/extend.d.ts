//Extend the window object with cross Browser callbacks so TS will not complain 
interface Window {	
    mozRequestAnimationFrame(callback: FrameRequestCallback): number;
    oRequestAnimationFrame(callback: FrameRequestCallback): number;
    webkitRequestAnimationFrame(callback: FrameRequestCallback): number;
}

//To make WebGL work 
interface HTMLCanvasElement {
    getContext(contextId: string, params : {}): WebGLRenderingContext;
}

